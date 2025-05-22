const express = require('express');
const http = require('http');
const fs = require('fs');
const pool = require('./config/db');
const socketAuth = require('./middleware/socketAuth');
const Message = require('./models/message.model');
const User = require('./models/user.model');
const path = require('path');
const chatController = require('./controllers/chat.controller');
const callService = require('./services/call.service');
const messageRoutes = require('./routes/message.routes');
const usersRouter = require('./routes/user.routes');

pool.query('SELECT NOW()', (err) => {
  if (err) console.error('PostgreSQL connection error:', err);
  else console.log('PostgreSQL connected successfully');
});

const authRoutes = require('./routes/auth.routes');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/messages', messageRoutes);

// CORS
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://192.168.0.104:3001'
  ],
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
app.use('/api/users', usersRouter);

app.get('/api/profile', require('./middleware/auth'), (req, res) => {
  res.json({ userId: req.userId });
});
app.get('/api/calls/active', (req, res) => {
  res.json(Array.from(callService.activeCalls.entries()));
});

// uncaught exceptions
process.on('uncaughtException', error => {
  console.error(`[CRASH] Необработанная ошибка: ${error.message}`);
  process.exit(1);
});

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'http://localhost:3001',
      'http://192.168.0.104:3001'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});
io.use(socketAuth);
global._io = io;
chatController.setIO(io);

// Track active connections for conference
const activeConnections = new Map(); // roomId -> Set(socket.id)

io.on('connection', socket => {
  console.log('New socket:', socket.id, 'userId:', socket.userId);

  // Chat room join
  socket.on('joinRoom', roomId => socket.join(roomId));

  socket.on('sendMessage', async (data) => {
    try {
      const { text, roomId } = data;
      if (!text?.trim()) return;

      // Сохраняем в БД
      const message = await Message.create(text, socket.userId, roomId);
      // Берём имя отправителя
      const user = await User.findById(socket.userId);

      // Собираем полезную нагрузку
      const payload = {
        ...message,
        sender_name: user.name
      };

      // Эмитим всем в комнате
      io.to(roomId).emit('newMessage', payload);
      console.log('📨 sendMessage:', payload);
    } catch (err) {
      console.error('Ошибка в sendMessage:', err);
    }
  });

  // 1:1 call and chat logic omitted…

  // Conference events
  socket.on('create-conference', roomId => {
    socket.join(roomId);
    activeConnections.set(roomId, new Set([socket.id]));
    socket.to(roomId).emit('conference-started', { roomId });
  });

  socket.on('join-conference', ({ roomId, userId, username }) => {
    socket.join(roomId);
    // add to active set
    const set = activeConnections.get(roomId) || new Set();
    set.add(socket.id);
    activeConnections.set(roomId, set);
    socket.to(roomId).emit('new-conference-participant', { peerId: socket.id, initiatorId: userId });
  });

  socket.on('leave-conference', ({ roomId }) => {
    socket.leave(roomId);
    const set = activeConnections.get(roomId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) activeConnections.delete(roomId);
      else activeConnections.set(roomId, set);
    }
    socket.to(roomId).emit('conference-participant-left', { peerId: socket.id });
  });

  // Screen share handlers at top-level
  socket.on('screen-share', ({ roomId, peerId }) => {
    console.log(`⚙️  Сервер получил screen-share от ${peerId} в комнате ${roomId}`);
    socket.to(roomId).emit('screen-share', { peerId });
  });
  socket.on('screen-share-stop', ({ roomId, peerId }) => {
    console.log(`⚙️  Сервер получил screen-share-stop от ${peerId} в комнате ${roomId}`);
    socket.to(roomId).emit('screen-share-stop', { peerId });
  });
  socket.on('screen-share-join', ({ roomId, targetPeerId }) => {
    console.log(`⚙️  Сервер получил screen-share-join от ${socket.id}, шлёт screen-share-joined -> ${targetPeerId}`);
    io.to(targetPeerId).emit('screen-share-joined', { requesterId: socket.id });
  });

  // WebRTC signaling
  socket.on('webrtc-signal', ({ target, senderId, signal, roomId }) => {
    io.to(target).emit('webrtc-signal', { senderId, signal, roomId });
  });

  // Disconnect
  socket.on('disconnect', () => {
    // clean up conference
    for (const [roomId, set] of activeConnections) {
      if (set.has(socket.id)) {
        set.delete(socket.id);
        socket.to(roomId).emit('conference-participant-left', { peerId: socket.id });
        if (set.size === 0) activeConnections.delete(roomId);
      }
    }
  });
});

const PORT = 3000;
// Привязываем к 0.0.0.0, чтобы слушать на всех интерфейсах
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});

// ensure uploads dir
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
