// src/socket.js
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Экспортируем уже сконфигурированный сокет.
// В tokenProvider() можно брать токен из LocalStorage или из любого хранилища состояния.
// const socket = (token) => io(API_URL, {
//   auth: { token },
//   transports: ['websocket']
// });

// Обновим конфигурацию сокета
const socket = (token) => io(API_URL, {
  auth: { token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Добавьте свои TURN серверы при необходимости
  ]
});

export default socket;
