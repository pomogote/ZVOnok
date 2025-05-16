const jwt = require('jsonwebtoken');

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Access denied: No token provided'));
    }

    const decoded = jwt.verify(token, 'your_jwt_secret');
    socket.userId = decoded.userId; // сохраняем userId для дальнейшего использования
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};

module.exports = socketAuth;