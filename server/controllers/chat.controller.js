const Message = require('../models/message.model');
const Room = require("../models/room.model");
const User = require("../models/user.model");
const upload = require("../middleware/upload");
const path = require('path');
const fs = require('fs');
let io;

exports.setIO = (ioInstance) => {
  io = ioInstance;
};


// Заглушка для uploadToCloud - возвращает путь к локальному файлу
async function uploadToCloud(file) {
  // В реальном приложении здесь будет загрузка в облако
  // Пока просто возвращаем относительный путь для доступа
  return file.path;
}


exports.sendMessage = async (req, res) => {
  try {
    const { text, roomId } = req.body;

    // Валидация
    if (!text?.trim()) return res.status(400).json({ error: "Пустое сообщение" });
    if (!roomId) return res.status(400).json({ error: "Не указана комната" });

    // Проверка существования комнаты
    const roomExists = await Room.findById(roomId);
    if (!roomExists) return res.status(404).json({ error: "Комната не найдена" });

    // Создание сообщения
    const message = await Message.create(text, req.userId, roomId);

    // Получение информации об авторе
    const user = await User.findById(req.userId);

    res.status(201).json({
      ...message,
      sender_name: user.name
    });

  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.sendVoiceMessage = async (req, res) => {
  try {
    const roomId = req.body.roomId;

    if (!roomId) {
      return res.status(400).json({ error: "Не указана комната" });
    }

    const voiceFile = req.file;
    if (!voiceFile) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    if (!req.userId) {
      return res.status(401).json({ error: "Токен недействителен" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Комната не найдена" });
    }

    // Формируем URL для доступа к файлу
    const fileUrl = `/uploads/voice/${voiceFile.filename}`;

    // Создаём запись сообщения в БД
    const message = await Message.create({
      user_id: req.userId,
      room_id: roomId,
      is_voice_message: true,
      file_url: `/uploads/${req.file.filename}`, // или как у вас
    });
    global._io.to(`room_${roomId}`).emit('newMessage', message);

    // Формируем объект для отправки через сокет
    const voiceMessage = {
      ...message,
      sender_name: user.name, //or user_name
      user_id: user.id, // Добавляем ID отправителя
      file_url: fileUrl,
      is_voice_message: true,
      created_at: new Date().toISOString()
    };

    // Логируем для отладки
    console.log('[sendVoiceMessage] Отправка через сокет:', voiceMessage);

    console.log('[Сервер] Отправка голосового сообщения:', {
      roomId,
      fileUrl: voiceMessage.file_url,
      user: voiceMessage.user_name
    });

    // Отправляем новое сообщение всем участникам комнаты
    if (io) {
      io.to(roomId).emit('newMessage', voiceMessage);
    }

    // Отправляем ответ клиенту с данными сообщения
    res.status(201).json(voiceMessage);
    
    return res.json(message);
  } catch (error) {
    console.error("Ошибка в sendVoiceMessage:", error);
    res.status(500).json({
      error: "Ошибка отправки голосового сообщения",
      details: "Проверьте логи сервера"
    });
  }
};

exports.deleteMessage = async (req, res) => {

  try {
    const { messageId } = req.params;

    // Проверка прав доступа
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Сообщение не найдено" });
    }

    if (message.sender_id !== req.userId) {
      return res.status(403).json({ error: "Вы можете удалять только свои сообщения" });
    }

    await Message.delete(messageId);
    io.to(message.room_id).emit('message-deleted', { messageId });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Ошибка удаления сообщения" });
  }

};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.findByRoom(roomId);

    // Если сообщения пустые, проверим существование комнаты
    if (messages.length === 0) {
      const roomExists = await Room.findById(roomId);
      if (!roomExists) {
        return res.status(404).json({ error: "Комната не найдена" });
      }
    }

    // Добавляем информацию об авторе
    const messagesWithAuthors = await Promise.all(
      messages.map(async msg => {
        const user = await User.findById(msg.sender_id);
        return {
          ...msg,
          user_name: user?.name || 'Неизвестный'
        };
      })
    );

    res.json(messages);
  } catch (error) {
    console.error('[ERROR] Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
};