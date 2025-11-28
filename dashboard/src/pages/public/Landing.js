import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to {process.env.REACT_APP_NAME || 'Vidlyx'}</h1>
      <p>Your video processing platform</p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/login" style={{ marginRight: '1rem', padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Login
        </Link>
        <Link to="/register" style={{ padding: '0.5rem 1rem', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Register
        </Link>
      </div>
    </div>
  );
}

export default Landing;
