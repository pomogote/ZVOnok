import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ user, setUser }) {
  return (
    <nav>
      <Link to="/">Home</Link>
      {user ? (
        <button onClick={() => setUser(null)}>Logout</button>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}