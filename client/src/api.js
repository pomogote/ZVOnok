import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    return res.data;
};

export const register = async (name, email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
    return res.data;
};

export const fetchRooms = async token => {
    const res = await axios.get(`${API_URL}/api/rooms`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

export const fetchMessages = async (roomId, token) => {
    const res = await axios.get(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const createRoom = async (name, token) => {
    const res = await axios.post(
        `${API_URL}/api/rooms`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const deleteRoom = async (roomId, token) => {
    const res = await axios.delete(`${API_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const updateMessage = async (token, messageId, text) => {
    const res = await axios.put(
        `${API_URL}/api/messages/${messageId}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const deleteMessage = async (token, messageId) => {
    const res = await axios.delete(
        `${API_URL}/api/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const fetchTasks = async token => {
    const res = await axios.get(
        `${API_URL}/api/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const createTask = async (task, token) => {
    const res = await axios.post(
        `${API_URL}/api/tasks`,
        task,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTask = async (taskId, status, token) => {
    const res = await axios.patch(
        `${API_URL}/api/tasks/${taskId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const fetchUsers = async token => {
    const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;  // ожидаем массив {id, name} или похожий
};