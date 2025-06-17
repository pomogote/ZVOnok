// src/components/Message.jsx
import React from 'react';

const Message = ({ sender, content, timestamp }) => {
  const isOwn = sender === 'me';
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs p-3 rounded-xl ${isOwn ? 'bg-primary text-white' : 'bg-surface text-text'}`}>
        <div className="text-sm mb-1 font-medium">{isOwn ? 'Вы' : sender}</div>
        <div className="text-sm">{content}</div>
        <div className="text-xs text-muted mt-1 text-right">{new Date(timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default Message;