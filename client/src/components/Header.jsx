// src/components/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/chats', label: 'Чаты' },
  { path: '/tasks', label: 'Задачи' },
];

const Header = () => {
  const { pathname } = useLocation();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-surface shadow-md">
      <h1 className="text-xl font-rubik">MyApp</h1>
      <nav className="flex space-x-4">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm font-medium hover:text-primary ${pathname === item.path ? 'text-primary' : 'text-muted'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;