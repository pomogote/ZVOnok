import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import ChatRoom from './ChatRoom';
import { fetchRooms, createRoom, deleteRoom } from './api';
import createSocket from './socket';

export default function App() {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState(''); // Для создания новых комнат
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      // инициализируем сокет при логине
      socketRef.current = createSocket(token);

      // подписываемся на создание комнаты
      socketRef.current.on('room-created', room => {
        setRooms(prev => [...prev, room]);
      });

      // подписываемся на удаление
      socketRef.current.on('room-deleted', ({ roomId }) => {
        setRooms(prev => prev.filter(r => r.id !== roomId));
      });

      // первый запрос для первоначального списка
      fetchRooms(token).then(setRooms);

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [token]);

  const refreshRooms = () => {
    fetchRooms(token).then(setRooms);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      // создаём комнату на сервере — клиент добавит её по socket-событию 'room-created'
      await createRoom(newRoomName, token);
      setNewRoomName('');
    } catch (error) {
      console.error('Ошибка создания комнаты:', error);
      alert('Не удалось создать комнату');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Вы уверены, что хотите удалить комнату?')) return;

    try {
      await deleteRoom(roomId, token);
      setRooms(prev => prev.filter(room => room.id !== roomId));
      if (currentRoom?.id === roomId) setCurrentRoom(null);
    } catch (error) {
      console.error('Ошибка удаления комнаты:', error);
      alert('Не удалось удалить комнату');
    }
  };

  if (!token) {
    return <Login onLogin={(tok, uid, uname) => {
      setToken(tok);
      setUserId(uid);
      setUsername(uname);
    }} />;
  }

  if (!currentRoom) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Чаты</h2>

        {/* Форма создания комнаты */}
        <div style={{ marginBottom: '20px' }}>
          <input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Название новой комнаты"
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleCreateRoom}>Создать комнату</button>
        </div>

        {/* Список комнат */}
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

              {/* Кнопка удаления (только для создателя) */}
              {room.creator_id === userId && (
                <button
                  onClick={() => {
                    if (window.confirm(`Удалить комнату "${room.name}"?`)) {
                      deleteRoom(room.id, token)
                        .then(() => setRooms(prev => prev.filter(r => r.id !== room.id)))
                        .catch(error => console.error('Ошибка удаления:', error));
                    }
                  }}
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

        {/* Кнопка выхода */}
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
