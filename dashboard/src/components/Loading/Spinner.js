import React from 'react';
import './Spinner.css';

const Spinner = ({
  size = 'medium',
  color = 'primary',
  className = ''
}) => {
  const sizeClass = `spinner--${size}`;
  const colorClass = `spinner--${color}`;

  return (
    <div className={`spinner-wrapper ${className}`}>
      <div className={`spinner ${sizeClass} ${colorClass}`}>
        <div className="spinner__circle"></div>
        <div className="spinner__circle"></div>
        <div className="spinner__circle"></div>
        <div className="spinner__circle"></div>
      </div>
    </div>
  );
};

export default Spinner;
