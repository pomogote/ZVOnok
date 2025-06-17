// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../utils/api';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate('/chats');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-lg w-80">
        <h2 className="text-2xl font-rubik mb-4 text-center">Вход</h2>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <Input label="Пароль" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <Button type="submit" className="w-full">Войти</Button>
        <p className="text-xs text-muted mt-4 text-center">
          Нет аккаунта? {' '}
          <Link to="/register" className="text-primary hover:underline">Зарегистрируйтесь</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;