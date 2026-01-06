import React, { useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { getShortcutDisplay } from '../../hooks/useKeyboardShortcuts';
import { useShortcuts } from '../../contexts/ShortcutsContext';
import Modal from '../Common/Modal';
import './ShortcutsHelp.css';

function ShortcutsHelp() {
  const { showHelp, setShowHelp } = useShortcuts();

  // Close on ESC key
  useEffect(() => {
    if (!showHelp) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showHelp, setShowHelp]);

  const shortcutCategories = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: 'g then h', description: 'Go to Home/Dashboard' },
        { keys: 'g then c', description: 'Go to Collection' },
        { keys: 'g then n', description: 'Go to New Video' },
        { keys: 'mod+k', description: 'Open Search' }
      ]
    },
    {
      title: 'Video Player',
      shortcuts: [
        { keys: ' ', description: 'Play/Pause', displayKeys: 'Space' },
        { keys: 'k', description: 'Play/Pause' },
        { keys: 'j', description: 'Rewind 10 seconds' },
        { keys: 'l', description: 'Forward 10 seconds' },
        { keys: 'arrowleft', description: 'Rewind 5 seconds', displayKeys: '\u2190' },
        { keys: 'arrowright', description: 'Forward 5 seconds', displayKeys: '\u2192' },
        { keys: 'm', description: 'Mute/Unmute' },
        { keys: 'f', description: 'Toggle Fullscreen' },
        { keys: 'shift+,', description: 'Decrease Speed', displayKeys: '<' },
        { keys: 'shift+.', description: 'Increase Speed', displayKeys: '>' },
        { keys: '0-9', description: 'Seek to 0%-90%' }
      ]
    },
    {
      title: 'Selection',
      shortcuts: [
        { keys: 'mod+a', description: 'Select All' },
        { keys: 'escape', description: 'Clear Selection', displayKeys: 'Esc' }
      ]
    },
    {
      title: 'General',
      shortcuts: [
        { keys: 'shift+/', description: 'Show Keyboard Shortcuts', displayKeys: '?' },
        { keys: 'escape', description: 'Close Modal/Dialog', displayKeys: 'Esc' }
      ]
    }
  ];

  const renderShortcutKey = (keys, displayKeys) => {
    // Use custom display if provided
    if (displayKeys) {
      return <kbd className="shortcut-key">{displayKeys}</kbd>;
    }

    // Handle special cases
    if (keys.includes('then')) {
      const parts = keys.split(' then ');
      return (
        <span className="shortcut-sequence">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <kbd className="shortcut-key">{part.toUpperCase()}</kbd>
              {index < parts.length - 1 && (
                <span className="shortcut-then">then</span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    // Handle key ranges (0-9)
    if (keys.includes('-')) {
      return <kbd className="shortcut-key">{keys}</kbd>;
    }

    // Use getShortcutDisplay for standard shortcuts
    const display = getShortcutDisplay(keys);
    const parts = display.split(' + ');

    return (
      <span className="shortcut-combo">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <kbd className="shortcut-key">{part}</kbd>
            {index < parts.length - 1 && (
              <span className="shortcut-plus">+</span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  return (
    <Modal
      isOpen={showHelp}
      onClose={() => setShowHelp(false)}
      title="Keyboard Shortcuts"
      size="large"
    >
      <div className="shortcuts-help">
        <div className="shortcuts-grid">
          {shortcutCategories.map((category, index) => (
            <div key={index} className="shortcuts-category">
              <h3 className="category-title">{category.title}</h3>
              <div className="shortcuts-list">
                {category.shortcuts.map((shortcut, shortcutIndex) => (
                  <div key={shortcutIndex} className="shortcut-item">
                    <div className="shortcut-keys">
                      {renderShortcutKey(shortcut.keys, shortcut.displayKeys)}
                    </div>
                    <div className="shortcut-description">
                      {shortcut.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <p className="shortcuts-hint">
            Press <kbd className="shortcut-key">Esc</kbd> or{' '}
            <kbd className="shortcut-key">?</kbd> to close this dialog
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default ShortcutsHelp;
