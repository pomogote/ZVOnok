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
    const { roomId } = req.body;
    console.log('Parsed roomId:', roomId);
    if (!roomId) return res.status(400).json({ error: "Не указана комната" });
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

    console.log('Received roomId:', req.body.roomId);
    console.log('File:', req.file);

    const fileUrl = `/uploads/voice/${voiceFile.filename}`;


    const isVoiceMessage = true;
    const message = await Message.create(
      "", // Очищаем текстовое поле
      req.userId,
      roomId,
      true, // Явно указываем тип сообщения
      `/uploads/voice/${voiceFile.filename}`
    );

    // После сохранения голосового сообщения
    const voiceMessage = {
      ...message, // Данные из БД
      user_name: user.name,
      file_url: `/uploads/voice/${voiceFile.filename}`,
      is_voice_message: true,
      created_at: new Date().toISOString()
    };

    console.log('Отправка через сокет:', voiceMessage); // Логируем
    io.to(roomId).emit('newMessage', voiceMessage);

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