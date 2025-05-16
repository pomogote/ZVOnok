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
    const { text, roomId, isVoiceMessage, fileUrl } = req.body;

    //проверка существования комнаты
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Комната не найдена" });
    }

    const message = await Message.create(text, req.userId, roomId, isVoiceMessage, fileUrl);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.sendVoiceMessage = async (req, res) => {
  try {
    const { roomId } = req.body;
    const voiceFile = req.file;

    if (!voiceFile) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Комната не найдена" });
    }

    // Получение данных пользователя
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const fileUrl = `/uploads/voice/${voiceFile.filename}`;


    const isVoiceMessage = true;
    const message = await Message.create(
      "", // Очищаем текстовое поле
      req.userId,
      roomId,
      true, // Явно указываем тип сообщения
      `/uploads/voice/${voiceFile.filename}`
    );

    // Отправляем полные данные через сокет
    io.to(roomId).emit('newMessage', {
      ...message,
      user_name: user.name, // Добавляем имя
      file_url: message.file_url, // Полный URL
      is_voice_message: true // Явно указываем тип
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Ошибка:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: "Ошибка отправки",
      details: "Проверьте логи сервера"
    });
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