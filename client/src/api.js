import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    return res.data;
};
// Регистрация
export const register = async (name, email, password) => {
  const res = await axios.post(`${API_URL}/api/auth/register`, {
    name, email, password
  });
  // сервер возвращает объект пользователя, но без токена,
  // токен придёт только после логина
  return res.data;
};

export const fetchRooms = async (token) => {
    const res = await axios.get(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const fetchMessages = async (roomId, token) => {
    const res = await axios.get(
        `${API_URL}/api/chat/rooms/${roomId}/messages`, // Добавлен сегмент /rooms/
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const createRoom = async (name, token) => {
    const res = await axios.post(`${API_URL}/api/rooms`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deleteRoom = async (roomId, token) => {
    await axios.delete(`${API_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateMessage = (token, messageId, text) => {
    return axios.put(`${API_URL}/api/messages/${messageId}`, { text }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const deleteMessage = (token, messageId) => {
    return axios.delete(`${API_URL}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};