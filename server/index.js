const express = require('express');
const http = require('http');
const fs = require('fs');
const pool = require('./config/db');
const socketAuth = require('./middleware/socketAuth');
const Message = require('./models/message.model');
const path = require('path');
const chatController = require('./controllers/chat.controller');

pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('PostgreSQL connection error:', err);
  } else {
    console.log('PostgreSQL connected successfully');
  }
});

const authRoutes = require('./routes/auth.routes');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const cors = require('cors');
app.use(cors({
  origin: '*', //http://localhost:8080
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/calls', require('./routes/call.routes'));

// Profile endpoint
app.get('/api/profile', require('./middleware/auth'), (req, res) => {
  res.json({ userId: req.userId });
});

//Перехват необработанных исключений
process.on('uncaughtException', (error) => {
  console.error(`[CRASH] Необработанная ошибка: ${error.message}`);
  process.exit(1);
});

const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3001", // Клиентский порт
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"], // Разрешаем токен в заголовках
    credentials: true
  },
  transports: ['websocket', 'polling'] // Явное указание транспортов
});
io.use(socketAuth);
global._io = io;
chatController.setIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) return next(new Error('Invalid token'));
    socket.userId = decoded.userId;
    next();
  });
});

// Хранилище для отслеживания участников комнат
const voiceRooms = new Map();

// Хранилище для отслеживания активных подключений
const activeConnections = new Map(); // roomId → Set<peerId>
const peerConfigs = new Map(); // peerId → { type: 'call' | 'conference', roomId }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Подписка на комнату чата
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined chat room: ${roomId}`);
  });

  socket.on('chatMessage', async (data) => {
    console.log('Received chatMessage:', data);
    // Сохраняем и эмитим
    const savedMessage = await saveMessageToDB(data.roomId, data.userId, data.message);
    io.to(data.roomId).emit('newMessage', savedMessage);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Подписка на комнату для голосовой связи
  socket.on('joinVoiceRoom', (roomId) => {
    socket.join(roomId);

    // Инициализируем комнату если ее нет
    if (!voiceRooms.has(roomId)) {
      voiceRooms.set(roomId, new Set());
    }

    voiceRooms.get(roomId).add(socket.id);
    console.log(`User joined voice room: ${roomId}`);

    // Уведомляем других участников о новом пользователе
    socket.to(roomId).emit('new-peer', { peerId: socket.id });
  });

  // Обработка WebRTC сигналов
  socket.on('webrtc-signal', (data) => {
    // Пересылаем сигнал конкретному получателю
    io.to(data.targetPeerId).emit('webrtc-signal', {
      senderId: socket.id,
      signal: data.signal,
      roomId: data.roomId
    });
  });

  // Обработка отключения
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Удаляем пользователя из всех голосовых комнат
    voiceRooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        socket.to(roomId).emit('peer-disconnected', { peerId: socket.id });
      }
    });
  });

  // Отправка сообщения в комнату
  socket.on('sendMessage', async (data) => {
    try {
      const { text, roomId } = data;
      const message = await Message.create(text, socket.userId, roomId);
      io.to(roomId).emit('newMessage', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Инициализация звонка 1:1
  socket.on('initiate-call', ({ targetUserId, roomId }) => {
    socket.join(roomId);
    activeConnections.set(roomId, new Set([socket.id]));
    peerConfigs.set(socket.id, { type: 'call', roomId });
    socket.to(roomId).emit('incoming-call', { callerId: socket.id });
  });

  // Принятие входящего звонка
  socket.on('accept-call', ({ roomId }) => {
    socket.join(roomId);
    const peers = activeConnections.get(roomId);
    peers.add(socket.id);
    io.to(roomId).emit('call-accepted', { participants: Array.from(peers) });
  });

  // Создание конференции
  socket.on('create-conference', (roomId) => {
    socket.join(roomId);
    activeConnections.set(roomId, new Set([socket.id]));
    peerConfigs.set(socket.id, { type: 'conference', roomId });
  });

  // Присоединение к конференции
  socket.on('join-conference', (roomId) => {
    socket.join(roomId);
    const peers = activeConnections.get(roomId);
    peers.add(socket.id);
    io.to(roomId).emit('new-participant', { peerId: socket.id });
  });

  // Обработка WebRTC-сигналов
  socket.on('webrtc-signal', ({ signal, targetPeerId, roomId }) => {
    socket.to(targetPeerId).emit('webrtc-signal', {
      senderId: socket.id,
      signal,
      roomId
    });
  });

  // Демонстрация экрана
  socket.on('screen-share', ({ roomId, streamId }) => {
    const peers = activeConnections.get(roomId);
    peers.forEach(peerId => {
      if (peerId !== socket.id) {
        io.to(peerId).emit('screen-share-started', { streamId });
      }
    });
  });

  // Отключение
  socket.on('disconnect', () => {
    const config = peerConfigs.get(socket.id);
    if (config) {
      const roomId = config.roomId;
      const peers = activeConnections.get(roomId);
      peers.delete(socket.id);

      if (peers.size === 0) {
        activeConnections.delete(roomId);
      } else {
        io.to(roomId).emit('participant-left', { peerId: socket.id });
      }

      peerConfigs.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });

});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });


