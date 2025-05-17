// src/pages/RoomsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await axios.get('/rooms');
        setRooms(data);
      } catch (error) {
        console.error('Ошибка загрузки комнат:', error);
      }
    };
    fetchRooms();
  }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    try {
      const { data } = await axios.post('/rooms', { name: newRoomName });
      setRooms([...rooms, data]);
      setNewRoomName('');
      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Ошибка создания комнаты:', error);
    }
  };

  return (
    <div className="rooms-container">
      <h2>Комнаты</h2>
      <form onSubmit={createRoom} className="room-form">
        <input
          type="text"
          placeholder="Название комнаты"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button type="submit">Создать</button>
      </form>

      <div className="rooms-list">
        {rooms.map(room => (
          <Link key={room.id} to={`/chat/${room.id}`} className="room-item">
            {room.name}
          </Link>
        ))}
      </div>
    </div>
  );
}