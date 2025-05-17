// src/pages/AuthPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AuthPage({ type, setUser }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`/auth/${type}`, {
        email: formData.email,
        password: formData.password
      });

      // Добавьте логирование ответа
      console.log('Auth response:', data);

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user); // Обновление состояния пользователя
        navigate('/chat'); // Перенаправление
      } else {
        setError('Неверные данные авторизации');
      }
    } catch (error) {
      console.error('Ошибка:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Ошибка сервера');
    }
  };

  return (
    <div className="auth-container">
      <h2>{type === 'login' ? 'Вход' : 'Регистрация'}</h2>
      <form onSubmit={handleSubmit}>
        {type === 'register' && (
          <input
            type="text"
            placeholder="Имя"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button type="submit">{type === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}