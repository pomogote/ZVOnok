// src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { fetchMessages, sendMessage } from '../utils/api';
import Message from './Message';

const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId).then(setMessages);
    }
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(chatId, text);
    setText('');
    const updated = await fetchMessages(chatId);
    setMessages(updated);
  };

  return (
    <div className="flex flex-col flex-1 bg-surface p-4">
      <div className="flex-1 overflow-auto space-y-2">
        {messages.map(msg => <Message key={msg.id} {...msg} />)}
        <div ref={endRef} />
      </div>
      <div className="mt-4 flex">
        <input
          className="flex-1 px-3 py-2 bg-background text-text rounded-l-lg focus:outline-none"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Введите сообщение..."
        />
        <button onClick={handleSend} className="px-4 bg-primary rounded-r-lg">
          Отправить
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
