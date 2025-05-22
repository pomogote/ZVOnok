import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import Register from './Register';
import ChatRoom from './ChatRoom';
import TaskManager from './TaskManager';
import { fetchRooms, createRoom, deleteRoom } from './api';
import createSocket from './socket';

export default function App() {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState(''); // Для создания новых комнат
  const [showTasks, setShowTasks] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      socketRef.current = createSocket(token);
      socketRef.current.on('room-created', room => setRooms(prev => [...prev, room]));
      socketRef.current.on('room-deleted', ({ roomId }) =>
        setRooms(prev => prev.filter(r => r.id !== roomId))
      );
      fetchRooms(token).then(setRooms);
      return () => socketRef.current.disconnect();
    }
  }, [token]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await createRoom(newRoomName, token);
      setNewRoomName('');
    } catch {
      alert('Не удалось создать комнату');
    }
  };

  const handleDeleteRoom = async roomId => {
    if (!window.confirm('Вы уверены, что хотите удалить комнату?')) return;
    try {
      await deleteRoom(roomId, token);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (currentRoom?.id === roomId) setCurrentRoom(null);
    } catch {
      alert('Не удалось удалить комнату');
    }
  };

  if (!token) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
        {showRegister ? (
          <Register onRegistered={() => setShowRegister(false)} />
        ) : (
          <Login
            onLogin={(tok, uid, uname) => {
              setToken(tok);
              setUserId(uid);
              setUsername(uname);
            }}
          />
        )}
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <button
            onClick={() => setShowRegister(!showRegister)}
            style={{ background: 'none', border: 'none', color: '#06c', cursor: 'pointer' }}
          >
            {showRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    );
  }

  // Рендер таск-менеджера
  if (showTasks) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => setShowTasks(false)}
          style={{ marginBottom: '10px' }}
        >
          ← Назад к чатам
        </button>
        <TaskManager token={token} />
      </div>
    );
  }

  // Список комнат
  if (!currentRoom) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => setShowTasks(true)}
          style={{
            display: 'block',
            marginBottom: '20px',
            background: '#06c',
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Открыть таск-менеджер
        </button>
        <h2>Чаты</h2>
        <div style={{ marginBottom: '20px' }}>
          <input
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            placeholder="Название новой комнаты"
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleCreateRoom}>Создать комнату</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rooms.map(room => (
            <li
              key={room.id}
              style={{
                margin: '10px 0',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                onClick={() => setCurrentRoom(room)}
                style={{ flexGrow: 1, textAlign: 'left' }}
              >
                {room.name}
              </button>
              {room.creator_id === userId && (
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  style={{
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            setToken('');
            setUserId('');
            setUsername('');
          }}
          style={{ marginTop: '20px' }}
        >
          Выйти
        </button>
      </div>
    );
  }

  // Комната чата
  return (
    <ChatRoom
      token={token}
      userId={userId}
      username={username}
      room={currentRoom}
      onLeave={() => setCurrentRoom(null)}
    />
  );
}
