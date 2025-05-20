import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
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