import React from 'react';
import './Input.css';

function Input({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`input-container ${containerClassName}`.trim()}>
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <div className="input-icon">{icon}</div>}
        <input
          type={type}
          className={`input ${icon ? 'input-with-icon' : ''} ${error ? 'input-error' : ''} ${className}`.trim()}
          {...props}
        />
      </div>
      {error && <div className="input-error-message">{error}</div>}
    </div>
  );
}

export default Input;
