const express = require('express');
const router = express.Router();
const webrtcService = require('../services/webrtc.service');
const authMiddleware = require('../middleware/auth');

router.post('/initiate', authMiddleware, (req, res) => {
  const roomId = webrtcService.generateRoomId();
  res.json({ roomId });
});

router.get('/ice-servers', (req, res) => {
  res.json({ servers: webrtcService.getICEServers() });
});

module.exports = router;