const express = require('express');
const router = express.Router();
const { updateMessage, deleteMessage } = require('../controllers/message.controller');
const auth = require('../middleware/auth');

router.put('/:messageId', auth, updateMessage);
router.delete('/:messageId', auth, deleteMessage);

module.exports = router;
