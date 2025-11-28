import React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import './Button.css';

function Button({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const buttonClass = `button button-${variant} button-${size} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <CircleNotch size={16} className="button-spinner" weight="bold" />
      )}
      {children}
    </button>
  );
}

export default Button;
