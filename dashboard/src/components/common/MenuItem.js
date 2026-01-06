import React from 'react';

/**
 * MenuItem Component
 * Renders a clickable menu item with optional icon
 *
 * @param {ReactNode} icon - Icon component to display
 * @param {Function} onClick - Click handler
 * @param {ReactNode} children - Menu item content
 * @param {String} variant - Style variant ('default' or 'danger')
 */
function MenuItem({ icon, onClick, children, variant = 'default' }) {
  const isDanger = variant === 'danger';

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textAlign: 'left',
    transition: 'background-color 0.15s',
    color: isDanger ? '#dc2626' : '#374151',
    borderBottom: '1px solid #f3f4f6'
  };

  return (
    <button
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDanger ? '#fef2f2' : '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

export default MenuItem;
