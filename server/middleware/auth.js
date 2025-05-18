const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = await User.findById(decoded.userId);
    req.user = user;
    req.userId = decoded.userId; // Сохраняем ID пользователя
    next();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};