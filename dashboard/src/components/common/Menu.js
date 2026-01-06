import React, { useRef, useEffect } from 'react';

/**
 * Menu Component
 * Renders a trigger element and a dropdown menu that can be toggled
 *
 * @param {ReactNode} trigger - The element that triggers the menu (e.g., button)
 * @param {Boolean} open - Whether the menu is open
 * @param {Function} onClose - Callback when menu should close
 * @param {ReactNode} children - Menu content
 */
function Menu({ trigger, open, onClose, children }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Add event listener on next tick to avoid immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {trigger}

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          minWidth: '200px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default Menu;
