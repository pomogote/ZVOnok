// server/controllers/message.controller.js
const Message = require('../models/message.model');

exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    // проверяем владельца внутри модели
    const updated = await Message.updateText(messageId, req.userId, text);
    if (!updated) return res.status(403).json({ error: 'Нельзя редактировать чужое сообщение' });
    global._io.emit('message-updated', { messageId, text });
    res.json({ messageId, text });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка при обновлении сообщения' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const deleted = await Message.delete(messageId, req.userId);
    if (!deleted) return res.status(403).json({ error: 'Нельзя удалять чужое сообщение' });
    global._io.emit('message-deleted', { messageId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка при удалении сообщения' });
  }
};