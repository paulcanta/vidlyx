/**
 * Toast Utility
 *
 * This utility provides a simple way to show toast notifications from anywhere in the app.
 *
 * Usage:
 * import { showToast, toast } from '@/utils/toast';
 *
 * // Basic usage
 * showToast('Operation completed', 'success');
 *
 * // Using helper methods
 * toast.success('Successfully saved!');
 * toast.error('An error occurred');
 * toast.warning('Please review your input');
 * toast.info('New update available');
 *
 * // With custom duration (in milliseconds)
 * toast.success('Quick message', 2000); // 2 seconds
 * toast.error('Important error', 10000); // 10 seconds
 *
 * Note: Make sure ToastProvider is wrapped around your app in App.js or index.js
 */

let globalShowToast = null;

// Set the global toast function (called by ToastProvider)
export const setGlobalToast = (showToastFn) => {
  globalShowToast = showToastFn;
};

// Default toast duration
const DEFAULT_DURATION = 5000; // 5 seconds

// Main showToast function
export const showToast = (message, type = 'info', duration = DEFAULT_DURATION) => {
  if (globalShowToast) {
    return globalShowToast(message, type, duration);
  } else {
    // Fallback to console if ToastProvider is not available
    console.warn('Toast not initialized. Wrap your app with ToastProvider.');
    console.log(`Toast: [${type}] ${message}`);
  }
};

// Helper functions for different toast types
export const toast = {
  success: (message, duration = DEFAULT_DURATION) => {
    return showToast(message, 'success', duration);
  },

  error: (message, duration = DEFAULT_DURATION) => {
    return showToast(message, 'error', duration);
  },

  warning: (message, duration = DEFAULT_DURATION) => {
    return showToast(message, 'warning', duration);
  },

  info: (message, duration = DEFAULT_DURATION) => {
    return showToast(message, 'info', duration);
  }
};

export default toast;
