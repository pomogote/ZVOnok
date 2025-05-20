const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const activeCalls = require('../services/call.service');

router.post('/initiate', authMiddleware, (req, res) => {
  const { targetUserId, roomId } = req.body;
  const callId = activeCalls.initiateCall(req.userId, targetUserId, roomId);
  res.json({ callId });
});

router.post('/accept', authMiddleware, (req, res) => {
  const { callId } = req.body;
  const success = activeCalls.acceptCall(callId, req.userId);
  res.json({ success });
});

module.exports = router;