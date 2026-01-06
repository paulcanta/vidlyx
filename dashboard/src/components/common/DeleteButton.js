import React, { useState } from 'react';
import { Trash } from '@phosphor-icons/react';

function DeleteButton({ onDelete, confirmText = 'Are you sure you want to delete this item?' }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onDelete();
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        background: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca'
      }}>
        <span style={{ fontSize: '0.875rem', color: '#991b1b' }}>
          {confirmText}
        </span>
        <button
          onClick={handleConfirm}
          style={{
            padding: '0.375rem 0.75rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          style={{
            padding: '0.375rem 0.75rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'white',
        color: '#dc2626',
        border: '1px solid #dc2626',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = '#dc2626';
        e.target.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'white';
        e.target.style.color = '#dc2626';
      }}
    >
      <Trash size={18} />
      Delete
    </button>
  );
}

export default DeleteButton;
