// client/src/Register.js
import React, { useState } from 'react';
import { register } from './api';

export default function Register({ onRegistered }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await register(name, email, password);
      alert('Регистрация успешна! Введите данные для входа.');
      onRegistered();  // переключаемся обратно на логин
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Регистрация</h2>
      <input placeholder="Имя"    value={name}    onChange={e => setName(e.target.value)} />
      <input placeholder="Email"  value={email}   onChange={e => setEmail(e.target.value)} />
      <input placeholder="Пароль" type="password"
             value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Зарегистрироваться</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}
