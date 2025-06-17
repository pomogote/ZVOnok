// src/components/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { fetchChats } from '../utils/api';

const ChatList = ({ onSelect }) => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    fetchChats().then(setChats);
  }, []);

  return (
    <Sidebar chats={chats} onSelect={onSelect} />
  );
};

export default ChatList;