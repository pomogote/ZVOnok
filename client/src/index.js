import process from 'process';
globalThis.process = {
    env: { NODE_ENV: process.env.NODE_ENV },
    nextTick: (cb, ...args) => setTimeout(() => cb(...args), 0),
};
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
