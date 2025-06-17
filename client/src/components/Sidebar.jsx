// src/components/Sidebar.jsx
import React from 'react';

const Sidebar = ({ chats, onSelect }) => (
  <aside className="w-64 bg-surface p-4 space-y-2">
    {chats.map(chat => (
      <button
        key={chat.id}
        onClick={() => onSelect(chat.id)}
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary"
      >
        {chat.name}
      </button>
    ))}
  </aside>
);

export default Sidebar;