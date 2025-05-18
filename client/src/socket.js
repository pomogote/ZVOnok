// src/socket.js
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Экспортируем уже сконфигурированный сокет.
// В tokenProvider() можно брать токен из LocalStorage или из любого хранилища состояния.
const socket = (token) => io(API_URL, {
  auth: { token },
  transports: ['websocket']
});

export default socket;
