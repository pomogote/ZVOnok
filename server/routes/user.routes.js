// server/routes/user.routes.js
const express = require('express');
const { getAllUsers } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.get('/', authMiddleware, getAllUsers);  // GET /api/users

module.exports = router;
