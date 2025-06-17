// src/components/Button.jsx

import React from 'react';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-secondary text-text hover:bg-secondary/90',
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = 'px-4 py-2 rounded-2xl shadow-md font-rubik focus:outline-none';
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button className={`${base} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;