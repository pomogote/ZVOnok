import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatsPage from './pages/ChatsPage';
import TasksPage from './pages/TasksPage';

const App = () => {
  return (
    <div className="min-h-screen bg-background text-text">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </div>
  );
};

export default App;