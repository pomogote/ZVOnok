const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Автоматическое создание папки
const voiceDir = path.join(__dirname, "../uploads/voice");
fs.mkdirSync(voiceDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, voiceDir); // Используем абсолютный путь
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9\.]/g, '_');
    cb(null, uniqueSuffix + '-' + cleanName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Только аудиофайлы разрешены'));
    }
  }
});

module.exports = upload;