# Task 8 - Subtask 6: Error Handling and Loading States

## Objective
Implement comprehensive error handling, loading states, and user feedback throughout the application.

## Prerequisites
- Task 8 - Subtask 5 completed (Responsive Design)

## Instructions

### 1. Create Error Boundary Component
Create `/home/pgc/vidlyx/dashboard/src/components/ErrorBoundary/ErrorBoundary.js`:

```jsx
import React from 'react';
import { Warning, ArrowClockwise } from '@phosphor-icons/react';
import Button from '../ui/Button';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    // In production, send to error tracking
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTracking(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <Warning size={48} className="error-icon" />
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}

            <div className="error-actions">
              <Button onClick={this.handleRetry}>
                <ArrowClockwise size={18} />
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/app'}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 2. Style Error Boundary
Create `/home/pgc/vidlyx/dashboard/src/components/ErrorBoundary/ErrorBoundary.css`:

```css
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--space-6);
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  color: var(--color-error);
  margin-bottom: var(--space-4);
}

.error-content h2 {
  font-size: var(--text-xl);
  margin-bottom: var(--space-2);
}

.error-content p {
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.error-details {
  text-align: left;
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: var(--space-2);
}

.error-details pre {
  font-size: var(--text-xs);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}
```

### 3. Create API Error Handler
Update `/home/pgc/vidlyx/dashboard/src/services/api.js`:

```javascript
import axios from 'axios';
import { showToast } from '../utils/toast';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, request, message } = error;

    // Network error
    if (!response) {
      if (message === 'Network Error') {
        showToast('Unable to connect. Please check your internet connection.', 'error');
      } else if (error.code === 'ECONNABORTED') {
        showToast('Request timed out. Please try again.', 'error');
      }
      return Promise.reject(error);
    }

    // Server responded with error
    const { status, data } = response;

    switch (status) {
      case 400:
        // Bad request - validation error
        showToast(data.message || 'Invalid request', 'error');
        break;

      case 401:
        // Unauthorized - redirect to login
        window.location.href = '/login';
        break;

      case 403:
        // Forbidden
        showToast('You do not have permission to perform this action', 'error');
        break;

      case 404:
        // Not found
        showToast(data.message || 'Resource not found', 'error');
        break;

      case 409:
        // Conflict
        showToast(data.message || 'Conflict occurred', 'error');
        break;

      case 422:
        // Validation error
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => showToast(err.message, 'error'));
        } else {
          showToast(data.message || 'Validation failed', 'error');
        }
        break;

      case 429:
        // Rate limited
        showToast('Too many requests. Please slow down.', 'warning');
        break;

      case 500:
      case 502:
      case 503:
        // Server error
        showToast('Server error. Please try again later.', 'error');
        break;

      default:
        showToast(data.message || 'An error occurred', 'error');
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 4. Create Loading Components
Create `/home/pgc/vidlyx/dashboard/src/components/Loading/Spinner.js`:

```jsx
import React from 'react';
import './Spinner.css';

function Spinner({ size = 'medium', color = 'primary' }) {
  return (
    <div className={`spinner spinner-${size} spinner-${color}`}>
      <div className="spinner-circle" />
    </div>
  );
}

export default Spinner;
```

Create `/home/pgc/vidlyx/dashboard/src/components/Loading/Skeleton.js`:

```jsx
import React from 'react';
import './Skeleton.css';

function Skeleton({ width, height, variant = 'rectangular', className = '' }) {
  const style = {
    width: width || '100%',
    height: height || '1rem'
  };

  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`}
      style={style}
    />
  );
}

function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton height="140px" variant="rectangular" />
      <div className="skeleton-card-content">
        <Skeleton height="1rem" width="80%" />
        <Skeleton height="0.75rem" width="60%" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard };
```

### 5. Style Loading Components
Create `/home/pgc/vidlyx/dashboard/src/components/Loading/Spinner.css`:

```css
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner-circle {
  border-radius: 50%;
  border-style: solid;
  border-color: transparent;
  animation: spin 0.8s linear infinite;
}

.spinner-small .spinner-circle {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.spinner-medium .spinner-circle {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

.spinner-large .spinner-circle {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.spinner-primary .spinner-circle {
  border-top-color: var(--color-primary);
}

.spinner-white .spinner-circle {
  border-top-color: white;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

Create `/home/pgc/vidlyx/dashboard/src/components/Loading/Skeleton.css`:

```css
.skeleton {
  background: var(--bg-tertiary);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-rectangular {
  border-radius: var(--border-radius-sm);
}

.skeleton-circular {
  border-radius: 50%;
}

.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-primary);
}

.skeleton-card-content {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### 6. Create Empty State Component
Create `/home/pgc/vidlyx/dashboard/src/components/EmptyState/EmptyState.js`:

```jsx
import React from 'react';
import './EmptyState.css';

function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false
}) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
```

### 7. Create Toast Notification System
Create `/home/pgc/vidlyx/dashboard/src/components/Toast/Toast.js`:

```jsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Warning, XCircle, Info, X } from '@phosphor-icons/react';
import './Toast.css';

const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

let toastId = 0;
let addToast = null;

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  addToast = (message, type = 'info', duration = 5000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        toastContainer
      )}
    </>
  );
}

function ToastItem({ id, message, type, duration, onClose }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} weight="fill" />,
    error: <XCircle size={20} weight="fill" />,
    warning: <Warning size={20} weight="fill" />,
    info: <Info size={20} weight="fill" />
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

export function showToast(message, type = 'info', duration = 5000) {
  if (addToast) {
    return addToast(message, type, duration);
  }
}

export default ToastProvider;
```

### 8. Style Toast
Create `/home/pgc/vidlyx/dashboard/src/components/Toast/Toast.css`:

```css
.toast-container {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: var(--z-toast);
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success .toast-icon { color: var(--color-success); }
.toast-error .toast-icon { color: var(--color-error); }
.toast-warning .toast-icon { color: var(--color-warning); }
.toast-info .toast-icon { color: var(--color-primary); }

.toast-message {
  flex: 1;
  font-size: var(--text-sm);
}

.toast-close {
  padding: var(--space-1);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
}

.toast-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

@media (max-width: 639px) {
  .toast-container {
    left: var(--space-4);
    right: var(--space-4);
    max-width: none;
  }
}
```

## Verification
1. Error boundary catches component errors
2. API errors show appropriate toasts
3. Loading skeletons appear while fetching
4. Empty states show helpful messages
5. Toast notifications stack properly
6. Network errors handled gracefully

## Next Steps
Proceed to Task 8 - Subtask 7 (Micro-interactions and Animations)

## Estimated Time
3-4 hours
