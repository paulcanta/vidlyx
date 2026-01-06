import { useEffect, useCallback, useRef } from 'react';

/**
 * Determines if the user is currently typing in an input field
 */
const isTyping = () => {
  const activeElement = document.activeElement;
  const tagName = activeElement?.tagName?.toLowerCase();

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    activeElement?.isContentEditable
  );
};

/**
 * Normalizes a keyboard event to a shortcut string
 * Example: { ctrlKey: true, key: 'k' } => 'ctrl+k'
 */
const normalizeShortcut = (event) => {
  // Guard against undefined event or key
  if (!event || !event.key) return '';

  const keys = [];
  const eventKey = event.key.toLowerCase();

  if (event.ctrlKey || event.metaKey) {
    keys.push('mod');
  }
  if (event.shiftKey && eventKey !== 'shift') {
    keys.push('shift');
  }
  if (event.altKey && eventKey !== 'alt') {
    keys.push('alt');
  }

  if (eventKey !== 'control' && eventKey !== 'meta' && eventKey !== 'shift' && eventKey !== 'alt') {
    keys.push(eventKey);
  }

  return keys.join('+');
};

/**
 * Parses a shortcut string into its components
 * Example: 'mod+shift+k' => { mod: true, shift: true, key: 'k' }
 */
const parseShortcut = (shortcut) => {
  const parts = shortcut.toLowerCase().split('+');
  const result = {
    mod: false,
    shift: false,
    alt: false,
    ctrl: false,
    key: null
  };

  parts.forEach(part => {
    if (part === 'mod') result.mod = true;
    else if (part === 'shift') result.shift = true;
    else if (part === 'alt') result.alt = true;
    else if (part === 'ctrl') result.ctrl = true;
    else result.key = part;
  });

  return result;
};

/**
 * Checks if a keyboard event matches a shortcut string
 */
const matchesShortcut = (event, shortcut) => {
  // Guard against undefined event or key
  if (!event || !event.key) return false;

  const parsed = parseShortcut(shortcut);
  const isMac = typeof navigator !== 'undefined' && navigator.platform
    ? navigator.platform.toUpperCase().indexOf('MAC') >= 0
    : false;

  // Check modifiers
  if (parsed.mod) {
    const modPressed = isMac ? event.metaKey : event.ctrlKey;
    if (!modPressed) return false;
  } else {
    // If mod is not specified, neither ctrl nor meta should be pressed
    if (event.ctrlKey || event.metaKey) return false;
  }

  if (parsed.ctrl && !event.ctrlKey) return false;
  if (parsed.shift && !event.shiftKey) return false;
  if (parsed.alt && !event.altKey) return false;

  // Check key
  if (parsed.key && event.key.toLowerCase() !== parsed.key) return false;

  return true;
};

/**
 * Hook for registering a single keyboard shortcut
 * @param {string} shortcut - Shortcut string (e.g., 'mod+k', 'shift+?')
 * @param {Function} callback - Function to call when shortcut is triggered
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the shortcut is enabled (default: true)
 * @param {boolean} options.preventDefault - Whether to prevent default behavior (default: true)
 * @param {boolean} options.stopPropagation - Whether to stop event propagation (default: false)
 * @param {boolean} options.allowWhileTyping - Whether to trigger while typing in inputs (default: false)
 * @param {Array<string>} options.dependencies - Dependency array for useCallback
 */
export function useKeyboardShortcut(
  shortcut,
  callback,
  options = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    allowWhileTyping = false,
    dependencies = []
  } = options;

  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !shortcut) return;

    const handleKeyDown = (event) => {
      // Don't trigger if typing in an input (unless allowed)
      if (!allowWhileTyping && isTyping()) return;

      // Check if the event matches our shortcut
      if (matchesShortcut(event, shortcut)) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }

        callbackRef.current(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcut, enabled, preventDefault, stopPropagation, allowWhileTyping, ...dependencies]);
}

/**
 * Hook for registering multiple keyboard shortcuts
 * @param {Array<Object>} shortcuts - Array of shortcut configurations
 * Each shortcut object should have:
 * - key: string - Shortcut string (e.g., 'mod+k')
 * - callback: Function - Function to call when triggered
 * - enabled: boolean (optional) - Whether enabled (default: true)
 * - preventDefault: boolean (optional) - Prevent default (default: true)
 * - stopPropagation: boolean (optional) - Stop propagation (default: false)
 * - allowWhileTyping: boolean (optional) - Allow while typing (default: false)
 */
export function useKeyboardShortcuts(shortcuts = []) {
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when it changes
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const typingInInput = isTyping();

      for (const shortcutConfig of shortcutsRef.current) {
        const {
          key,
          callback,
          enabled = true,
          preventDefault = true,
          stopPropagation = false,
          allowWhileTyping = false
        } = shortcutConfig;

        if (!enabled || !key) continue;

        // Don't trigger if typing in an input (unless allowed)
        if (!allowWhileTyping && typingInInput) continue;

        // Check if the event matches this shortcut
        if (matchesShortcut(event, key)) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }

          callback(event);
          break; // Only trigger the first matching shortcut
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty deps because we use ref
}

/**
 * Utility function to get the display string for a shortcut
 * Shows Cmd on Mac, Ctrl on Windows/Linux
 */
export function getShortcutDisplay(shortcut) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return shortcut
    .split('+')
    .map(key => {
      if (key === 'mod') return isMac ? 'Cmd' : 'Ctrl';
      if (key === 'shift') return 'Shift';
      if (key === 'alt') return isMac ? 'Option' : 'Alt';
      if (key === 'ctrl') return 'Ctrl';
      if (key === ' ') return 'Space';
      return key.toUpperCase();
    })
    .join(' + ');
}

export default useKeyboardShortcut;
