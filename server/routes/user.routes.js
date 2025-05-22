const express = require('express');
const { getAllUsers } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

const router = express.Router();
router.get('/', auth, getAllUsers);
module.exports = router;