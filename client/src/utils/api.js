// src/utils/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// Аутентификация
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
};

// Чаты
export const fetchChats = async () => {
  const response = await api.get('/chats');
  return response.data;
};

export const fetchMessages = async (chatId) => {
  const response = await api.get(`/chats/${chatId}/messages`);
  return response.data;
};

export const sendMessage = async (chatId, message) => {
  const response = await api.post(`/chats/${chatId}/messages`, { message });
  return response.data;
};

// Задачи
export const fetchTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (taskId, updates) => {
  const response = await api.put(`/tasks/${taskId}`, updates);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Экспорт объекта API (если нужно)
export default api;
