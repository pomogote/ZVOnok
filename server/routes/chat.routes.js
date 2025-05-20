const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth');
const upload = require("../middleware/upload");

router.post('/messages', authMiddleware, chatController.sendMessage);
router.get('/rooms/:roomId/messages', authMiddleware, chatController.getMessages);
router.delete('/messages/:messageId', authMiddleware, chatController.deleteMessage);
router.post('/voice', authMiddleware,
    upload.single('voice'),
    (req, res, next) => {
        console.log("Middleware: Проверка аутентификации");
        next();
    },
    (req, res, next) => {
        console.log("Файл:", req.file); // Добавьте лог файла
        req.body.roomId = req.body.roomId;
        next();
    },
    chatController.sendVoiceMessage
);

module.exports = router;