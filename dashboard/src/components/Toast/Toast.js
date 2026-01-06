import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Warning,
  Info,
  X
} from '@phosphor-icons/react';
import './Toast.css';

// Create Toast Context
const ToastContext = createContext(null);

// Toast types configuration
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'toast-item--success'
  },
  error: {
    icon: XCircle,
    className: 'toast-item--error'
  },
  warning: {
    icon: Warning,
    className: 'toast-item--warning'
  },
  info: {
    icon: Info,
    className: 'toast-item--info'
  }
};

// Default toast duration
const DEFAULT_DURATION = 5000; // 5 seconds

// ToastItem Component
const ToastItem = ({ id, type, message, duration, onClose }) => {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div className={`toast-item ${config.className}`}>
      <div className="toast-item__icon">
        <Icon size={24} weight="fill" />
      </div>
      <div className="toast-item__message">{message}</div>
      <button
        className="toast-item__close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <X size={20} weight="bold" />
      </button>
    </div>
  );
};

// ToastProvider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    return addToast(message, type, duration);
  }, [addToast]);

  const value = {
    showToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use Toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Export a global toast instance that can be used outside of React components
let globalShowToast = null;

export const setGlobalToast = (showToastFn) => {
  globalShowToast = showToastFn;
};

export const showToast = (message, type = 'info', duration = DEFAULT_DURATION) => {
  if (globalShowToast) {
    return globalShowToast(message, type, duration);
  } else {
    console.warn('Toast not initialized. Wrap your app with ToastProvider.');
    console.log(`Toast: [${type}] ${message}`);
  }
};

// Success, Error, Warning, Info helper functions
export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration)
};

export default ToastProvider;
