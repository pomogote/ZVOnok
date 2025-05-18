import React, { useState, useEffect } from 'react';
import Login from './Login';
import ChatRoom from './ChatRoom';
import { fetchRooms } from './api';

export default function App() {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    if (token) {
      fetchRooms(token).then(setRooms);
    }
  }, [token]);

  if (!token) {
    return <Login onLogin={(tok, uid, uname) => {
      setToken(tok);
      setUserId(uid);
      setUsername(uname);
    }} />;
  }

  if (!currentRoom) {
    return (
      <div>
        <h2>Чаты</h2>
        <ul>
          {rooms.map(room => (
            <li key={room.id}>
              <button onClick={() => setCurrentRoom(room)}>{room.name}</button>
            </li>
          ))}
        </ul>
        <button onClick={() => {
          setToken('');
          setUserId('');
          setUsername('');
        }}>Выйти</button>
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
