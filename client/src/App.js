// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import TasksPage from './pages/TasksPage';
import RoomsPage from './pages/RoomsPage';
import CallPage from './pages/CallPage';
import Navbar from './components/Navbar';

axios.defaults.baseURL = 'http://localhost:3000/api';

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const newSocket = io('http://localhost:3000', {
        auth: { token },
        transports: ['websocket'] // Принудительно используем WebSocket
      });
      setSocket(newSocket);
    }
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/chat" /> : <Navigate to="/login" />
        }/>
        <Route path="/login" element={
          <AuthPage type="login" setUser={setUser} />
        }/>
        <Route path="/register" element={
          <AuthPage type="register" setUser={setUser} />
        }/>
        <Route path="/chat" element={
          <ProtectedRoute user={user}><ChatPage socket={socket} /></ProtectedRoute>
        }/>
        <Route path="/tasks" element={
          <ProtectedRoute user={user}><TasksPage /></ProtectedRoute>
        }/>
        <Route path="/rooms" element={
          <ProtectedRoute user={user}><RoomsPage /></ProtectedRoute>
        }/>
        <Route path="/call/:roomId" element={
          <ProtectedRoute user={user}><CallPage socket={socket} /></ProtectedRoute>
        }/>
      </Routes>
    </Router>
  );
}

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default App;