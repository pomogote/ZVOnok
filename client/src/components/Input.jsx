// src/components/Input.jsx

import React from 'react';

const Input = ({ label, className = '', ...props }) => (
  <div className={`flex flex-col mb-4 ${className}`}>
    {label && <label className="mb-1 text-sm font-medium">{label}</label>}
    <input
      className="px-3 py-2 bg-surface text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
      {...props}
    />
  </div>
);

export default Input;