// src/pages/ChatsPage.jsx
import React, { useState } from 'react';
import Header from '../components/Header';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const ChatsPage = () => {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1">
        <ChatList onSelect={setActiveChat} />
        {activeChat ? <ChatWindow chatId={activeChat} /> : <div className="flex-1 flex items-center justify-center text-muted">Выберите чат</div>}
      </div>
    </div>
  );
};

export default ChatsPage;