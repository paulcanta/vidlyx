# Task 8 - Subtask 3: Keyboard Shortcuts

## Objective
Implement comprehensive keyboard navigation for power users.

## Prerequisites
- Task 8 - Subtask 2 completed (Search UI)

## Instructions

### 1. Create Keyboard Shortcuts Hook
Create `/home/pgc/vidlyx/dashboard/src/hooks/useKeyboardShortcuts.js`:

```javascript
import { useEffect, useCallback } from 'react';

const registeredShortcuts = new Map();

export function useKeyboardShortcut(shortcut, callback, options = {}) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = document
  } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't trigger if user is typing in an input
    const targetElement = event.target;
    const isTyping = targetElement.tagName === 'INPUT' ||
                     targetElement.tagName === 'TEXTAREA' ||
                     targetElement.isContentEditable;

    // Allow certain shortcuts even when typing
    const allowWhileTyping = ['Escape', 'mod+k', 'mod+s'].includes(shortcut);

    if (isTyping && !allowWhileTyping) return;

    const keys = shortcut.toLowerCase().split('+');
    const modKey = navigator.platform.includes('Mac') ? event.metaKey : event.ctrlKey;

    let matches = true;

    for (const key of keys) {
      switch (key) {
        case 'mod':
          if (!modKey) matches = false;
          break;
        case 'shift':
          if (!event.shiftKey) matches = false;
          break;
        case 'alt':
          if (!event.altKey) matches = false;
          break;
        case 'ctrl':
          if (!event.ctrlKey) matches = false;
          break;
        case 'meta':
          if (!event.metaKey) matches = false;
          break;
        default:
          if (event.key.toLowerCase() !== key) matches = false;
      }
    }

    if (matches) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      callback(event);
    }
  }, [shortcut, callback, enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    target.addEventListener('keydown', handleKeyDown);
    return () => target.removeEventListener('keydown', handleKeyDown);
  }, [target, handleKeyDown]);
}

// Hook for multiple shortcuts
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetElement = event.target;
      const isTyping = targetElement.tagName === 'INPUT' ||
                       targetElement.tagName === 'TEXTAREA' ||
                       targetElement.isContentEditable;

      for (const { shortcut, callback, allowWhileTyping = false } of shortcuts) {
        if (isTyping && !allowWhileTyping) continue;

        const keys = shortcut.toLowerCase().split('+');
        const modKey = navigator.platform.includes('Mac') ? event.metaKey : event.ctrlKey;

        let matches = true;

        for (const key of keys) {
          switch (key) {
            case 'mod':
              if (!modKey) matches = false;
              break;
            case 'shift':
              if (!event.shiftKey) matches = false;
              break;
            case 'alt':
              if (!event.altKey) matches = false;
              break;
            default:
              if (event.key.toLowerCase() !== key) matches = false;
          }
        }

        if (matches) {
          event.preventDefault();
          callback(event);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
```

### 2. Create Global Shortcuts Provider
Create `/home/pgc/vidlyx/dashboard/src/contexts/ShortcutsContext.js`:

```jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';

const ShortcutsContext = createContext();

export function ShortcutsProvider({ children }) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  // Global shortcuts
  useKeyboardShortcut('mod+k', () => {
    document.dispatchEvent(new CustomEvent('openSearch'));
  }, { allowWhileTyping: true });

  useKeyboardShortcut('g+h', () => {
    navigate('/app');
  });

  useKeyboardShortcut('g+c', () => {
    navigate('/app/collection');
  });

  useKeyboardShortcut('g+n', () => {
    navigate('/app/new');
  });

  useKeyboardShortcut('?', () => {
    setShowHelp(true);
  });

  useKeyboardShortcut('escape', () => {
    setShowHelp(false);
  }, { allowWhileTyping: true });

  const value = {
    showHelp,
    setShowHelp
  };

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts() {
  return useContext(ShortcutsContext);
}
```

### 3. Create Shortcuts Help Modal
Create `/home/pgc/vidlyx/dashboard/src/components/Shortcuts/ShortcutsHelp.js`:

```jsx
import React from 'react';
import Modal from '../ui/Modal';
import { useShortcuts } from '../../contexts/ShortcutsContext';
import './ShortcutsHelp.css';

const isMac = navigator.platform.includes('Mac');
const modKey = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['g', 'h'], description: 'Go to Home' },
      { keys: ['g', 'c'], description: 'Go to Collection' },
      { keys: ['g', 'n'], description: 'New Video Analysis' },
    ]
  },
  {
    category: 'Search',
    items: [
      { keys: [modKey, 'K'], description: 'Open Search' },
      { keys: ['↑', '↓'], description: 'Navigate results' },
      { keys: ['Enter'], description: 'Select result' },
      { keys: ['Esc'], description: 'Close search' },
    ]
  },
  {
    category: 'Video Player',
    items: [
      { keys: ['Space'], description: 'Play/Pause' },
      { keys: ['←', '→'], description: 'Seek 5 seconds' },
      { keys: ['J', 'L'], description: 'Seek 10 seconds' },
      { keys: ['K'], description: 'Play/Pause' },
      { keys: ['M'], description: 'Mute/Unmute' },
      { keys: ['F'], description: 'Fullscreen' },
      { keys: ['<', '>'], description: 'Speed down/up' },
    ]
  },
  {
    category: 'Selection',
    items: [
      { keys: ['S'], description: 'Toggle selection mode' },
      { keys: [modKey, 'A'], description: 'Select all' },
      { keys: [modKey, 'S'], description: 'Save selection' },
      { keys: ['Esc'], description: 'Clear selection' },
    ]
  },
  {
    category: 'General',
    items: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal/dialog' },
    ]
  }
];

function ShortcutsHelp() {
  const { showHelp, setShowHelp } = useShortcuts();

  if (!showHelp) return null;

  return (
    <Modal title="Keyboard Shortcuts" onClose={() => setShowHelp(false)}>
      <div className="shortcuts-help">
        {shortcuts.map(category => (
          <div key={category.category} className="shortcuts-category">
            <h4>{category.category}</h4>
            <div className="shortcuts-list">
              {category.items.map((item, index) => (
                <div key={index} className="shortcut-item">
                  <span className="shortcut-description">{item.description}</span>
                  <div className="shortcut-keys">
                    {item.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd>{key}</kbd>
                        {i < item.keys.length - 1 && (
                          <span className="key-separator">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default ShortcutsHelp;
```

### 4. Style Shortcuts Help
Create `/home/pgc/vidlyx/dashboard/src/components/Shortcuts/ShortcutsHelp.css`:

```css
.shortcuts-help {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-6);
}

.shortcuts-category h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-3);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

.shortcut-description {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shortcut-keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: var(--text-xs);
  font-family: inherit;
  color: var(--text-secondary);
}

.key-separator {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

### 5. Video Player Shortcuts
Create `/home/pgc/vidlyx/dashboard/src/hooks/useVideoShortcuts.js`:

```javascript
import { useEffect } from 'react';

export function useVideoShortcuts(playerRef, options = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !playerRef.current) return;

    const handleKeyDown = (event) => {
      // Don't handle if typing in input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const player = playerRef.current;

      switch (event.key.toLowerCase()) {
        case ' ':
        case 'k':
          event.preventDefault();
          if (player.getPlayerState() === 1) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
          break;

        case 'j':
          event.preventDefault();
          player.seekTo(player.getCurrentTime() - 10, true);
          break;

        case 'l':
          event.preventDefault();
          player.seekTo(player.getCurrentTime() + 10, true);
          break;

        case 'arrowleft':
          event.preventDefault();
          player.seekTo(player.getCurrentTime() - 5, true);
          break;

        case 'arrowright':
          event.preventDefault();
          player.seekTo(player.getCurrentTime() + 5, true);
          break;

        case 'm':
          event.preventDefault();
          if (player.isMuted()) {
            player.unMute();
          } else {
            player.mute();
          }
          break;

        case 'f':
          event.preventDefault();
          const iframe = player.getIframe();
          if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
          }
          break;

        case ',':
        case '<':
          event.preventDefault();
          const currentRate = player.getPlaybackRate();
          const rates = player.getAvailablePlaybackRates();
          const currentIndex = rates.indexOf(currentRate);
          if (currentIndex > 0) {
            player.setPlaybackRate(rates[currentIndex - 1]);
          }
          break;

        case '.':
        case '>':
          event.preventDefault();
          const rate = player.getPlaybackRate();
          const availableRates = player.getAvailablePlaybackRates();
          const idx = availableRates.indexOf(rate);
          if (idx < availableRates.length - 1) {
            player.setPlaybackRate(availableRates[idx + 1]);
          }
          break;

        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault();
          const percent = parseInt(event.key) / 10;
          const duration = player.getDuration();
          player.seekTo(duration * percent, true);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playerRef, enabled]);
}
```

### 6. Selection Mode Shortcuts
Update the Selection context with shortcuts:

```javascript
// Add to SelectionProvider
useKeyboardShortcut('s', () => {
  setSelectionMode(prev => !prev);
});

useKeyboardShortcut('mod+a', () => {
  if (selectionMode && allFrames.length > 0) {
    setSelectedFrames(allFrames);
  }
});

useKeyboardShortcut('escape', () => {
  if (hasSelection) {
    clearSelection();
  } else if (selectionMode) {
    setSelectionMode(false);
  }
}, { allowWhileTyping: true });

useKeyboardShortcut('mod+s', () => {
  if (hasSelection) {
    setShowSaveCreator(true);
  }
}, { allowWhileTyping: true });
```

## Verification
1. Cmd/Ctrl+K opens search
2. G then H navigates to home
3. ? shows shortcuts help
4. Video player shortcuts work
5. Selection shortcuts work
6. ESC closes modals

## Next Steps
Proceed to Task 8 - Subtask 4 (Export Functionality)

## Estimated Time
2-3 hours
