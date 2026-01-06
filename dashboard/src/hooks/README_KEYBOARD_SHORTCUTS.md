# Keyboard Shortcuts System

This directory contains the keyboard shortcuts system for Vidlyx, providing a consistent and powerful way to navigate and control the application using keyboard shortcuts.

## Overview

The keyboard shortcuts system consists of:

1. **useKeyboardShortcuts** - Core hook for registering keyboard shortcuts
2. **useVideoShortcuts** - Specialized hook for video player controls
3. **ShortcutsContext** - Global shortcuts and help modal state
4. **ShortcutsHelp** - Modal component showing all available shortcuts

## Files

- `useKeyboardShortcuts.js` - Core keyboard shortcut functionality
- `useVideoShortcuts.js` - Video player keyboard shortcuts
- `../contexts/ShortcutsContext.js` - Global shortcuts context
- `../components/Shortcuts/ShortcutsHelp.js` - Help modal component
- `../components/Shortcuts/ShortcutsHelp.css` - Help modal styles

## Usage

### Basic Shortcut Registration

```javascript
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';

function MyComponent() {
  // Single shortcut
  useKeyboardShortcut('mod+s', () => {
    console.log('Save triggered!');
  });

  // With options
  useKeyboardShortcut('escape', handleClose, {
    enabled: isModalOpen,
    preventDefault: true,
    allowWhileTyping: false
  });
}
```

### Multiple Shortcuts

```javascript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function MyComponent() {
  const shortcuts = [
    {
      key: 'mod+k',
      callback: handleSearch,
      enabled: true,
      preventDefault: true
    },
    {
      key: 'escape',
      callback: handleClose,
      enabled: isOpen
    },
    {
      key: 'mod+enter',
      callback: handleSubmit,
      allowWhileTyping: true
    }
  ];

  useKeyboardShortcuts(shortcuts);
}
```

### Video Player Shortcuts

```javascript
import { useVideoShortcuts } from '../hooks/useVideoShortcuts';

function VideoPlayer() {
  const playerRef = useRef(null);

  // Automatically register all video shortcuts
  useVideoShortcuts(playerRef, true);

  return <div ref={playerRef} />;
}
```

### Global Shortcuts

Global shortcuts are automatically available throughout the app via the `ShortcutsProvider`:

```javascript
import { useShortcuts } from '../contexts/ShortcutsContext';

function MyComponent() {
  const { showHelp, setShowHelp } = useShortcuts();

  // Global shortcuts already registered:
  // - mod+k: Open search
  // - g then h: Go home
  // - g then c: Go to collection
  // - g then n: New video
  // - ?: Show keyboard shortcuts help
}
```

## Keyboard Shortcut Format

### Modifiers

- `mod` - Cmd on Mac, Ctrl on Windows/Linux (cross-platform)
- `shift` - Shift key
- `alt` - Alt/Option key
- `ctrl` - Ctrl key (use `mod` instead for cross-platform)

### Examples

- `mod+k` - Cmd/Ctrl + K
- `shift+/` - Shift + / (shows as ?)
- `mod+shift+p` - Cmd/Ctrl + Shift + P
- `escape` - ESC key
- ` ` (space) - Space bar
- `arrowleft` - Left arrow key

## Available Shortcuts

### Navigation
- `g then h` - Go to Home/Dashboard
- `g then c` - Go to Collection
- `g then n` - Go to New Video
- `mod+k` - Open Search

### Video Player
- `Space` or `k` - Play/Pause
- `j` - Rewind 10 seconds
- `l` - Forward 10 seconds
- `←` - Rewind 5 seconds
- `→` - Forward 5 seconds
- `m` - Mute/Unmute
- `f` - Toggle Fullscreen
- `<` (Shift+,) - Decrease Speed
- `>` (Shift+.) - Increase Speed
- `0-9` - Seek to 0%-90%

### Selection
- `mod+a` - Select All
- `escape` - Clear Selection

### General
- `?` (Shift+/) - Show Keyboard Shortcuts
- `escape` - Close Modal/Dialog

## Options

All shortcut hooks accept these options:

- **enabled** (boolean, default: true) - Whether the shortcut is active
- **preventDefault** (boolean, default: true) - Prevent default browser behavior
- **stopPropagation** (boolean, default: false) - Stop event from bubbling
- **allowWhileTyping** (boolean, default: false) - Allow shortcut in input fields

## Features

### Smart Input Detection

By default, shortcuts are disabled when typing in input fields (input, textarea, contentEditable). Use `allowWhileTyping: true` to override.

### Cross-Platform Support

The `mod` key automatically maps to:
- Cmd (⌘) on macOS
- Ctrl on Windows/Linux

### Display Formatting

Use `getShortcutDisplay()` to show shortcuts to users:

```javascript
import { getShortcutDisplay } from '../hooks/useKeyboardShortcuts';

const display = getShortcutDisplay('mod+k');
// Returns: "Cmd + K" on Mac, "Ctrl + K" on Windows
```

### Help Modal

Press `?` anywhere in the app to see all available shortcuts in a categorized modal.

## Implementation Details

### How It Works

1. **Event Listening**: Uses native `keydown` event listeners on `document`
2. **Event Matching**: Normalizes keyboard events and matches against shortcut strings
3. **Priority**: First matching shortcut wins (when using `useKeyboardShortcuts`)
4. **Cleanup**: Automatically removes listeners on unmount

### Performance

- Uses refs to avoid re-registering listeners on every render
- Single event listener per hook instance
- Efficient event matching algorithm

## Adding New Global Shortcuts

To add new global shortcuts:

1. Open `src/contexts/ShortcutsContext.js`
2. Add handler function
3. Add to shortcuts array
4. Update `src/components/Shortcuts/ShortcutsHelp.js` to document it

Example:

```javascript
// In ShortcutsContext.js
const handleNewShortcut = useCallback(() => {
  // Your logic here
}, []);

const shortcuts = [
  // ... existing shortcuts
  {
    key: 'mod+shift+n',
    callback: handleNewShortcut,
    enabled: true,
    preventDefault: true
  }
];
```

## Best Practices

1. **Use `mod` for cross-platform** - Don't hardcode Cmd or Ctrl
2. **Document all shortcuts** - Add to ShortcutsHelp component
3. **Avoid conflicts** - Check existing shortcuts before adding new ones
4. **Provide visual hints** - Show shortcuts in tooltips/buttons
5. **Test on both platforms** - Verify Mac and Windows behavior

## Troubleshooting

### Shortcut not working?

1. Check if another shortcut is matching first
2. Verify the shortcut string format (lowercase, correct modifiers)
3. Check if `enabled` option is true
4. Ensure you're not in an input field (unless `allowWhileTyping: true`)

### Conflicts with browser shortcuts?

Use `preventDefault: true` to override browser behavior, but be careful with essential browser shortcuts like `mod+w` (close tab).

## Future Enhancements

- [ ] Customizable shortcuts (user preferences)
- [ ] Shortcut recording UI
- [ ] Command palette integration
- [ ] Keyboard shortcut analytics
- [ ] Export/import shortcut configurations
