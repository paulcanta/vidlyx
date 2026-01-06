import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const ShortcutsContext = createContext(null);

export function ShortcutsProvider({ children }) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  // Handle search shortcut (mod+k)
  const handleSearch = useCallback(() => {
    // Dispatch custom event that can be caught by search components
    const event = new CustomEvent('openSearch');
    window.dispatchEvent(event);
  }, []);

  // Handle navigation shortcuts
  const handleGoHome = useCallback(() => {
    navigate('/app');
  }, [navigate]);

  const handleGoCollection = useCallback(() => {
    navigate('/app/collection');
  }, [navigate]);

  const handleGoNew = useCallback(() => {
    navigate('/app/new');
  }, [navigate]);

  // Handle help shortcut
  const handleToggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // Define global shortcuts
  const shortcuts = [
    // Search
    {
      key: 'mod+k',
      callback: handleSearch,
      enabled: true,
      preventDefault: true,
      stopPropagation: true
    },
    // Navigation (g+h, g+c, g+n pattern)
    // These use a sequence pattern that we'll handle manually
    {
      key: 'g',
      callback: (e) => {
        // Set a flag for the next key
        const handleNext = (nextEvent) => {
          if (nextEvent.key === 'h') {
            handleGoHome();
            document.removeEventListener('keydown', handleNext);
          } else if (nextEvent.key === 'c') {
            handleGoCollection();
            document.removeEventListener('keydown', handleNext);
          } else if (nextEvent.key === 'n') {
            handleGoNew();
            document.removeEventListener('keydown', handleNext);
          } else {
            document.removeEventListener('keydown', handleNext);
          }
        };

        // Add temporary listener for the next key
        setTimeout(() => {
          document.addEventListener('keydown', handleNext, { once: true });
        }, 0);
      },
      enabled: true,
      preventDefault: false,
      allowWhileTyping: false
    },
    // Help
    {
      key: 'shift+/',
      callback: handleToggleHelp,
      enabled: true,
      preventDefault: true
    }
  ];

  // Register global shortcuts
  useKeyboardShortcuts(shortcuts);

  const value = {
    showHelp,
    setShowHelp,
    handleSearch,
    handleGoHome,
    handleGoCollection,
    handleGoNew,
    handleToggleHelp
  };

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
}

export default ShortcutsContext;
