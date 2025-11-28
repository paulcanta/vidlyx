# Task 8 - Subtask 7: Micro-interactions and Animations

## Objective
Add subtle animations and micro-interactions to enhance user experience.

## Prerequisites
- Task 8 - Subtask 6 completed (Error Handling)

## Instructions

### 1. Define Animation Variables
Update `/home/pgc/vidlyx/dashboard/src/styles/variables.css`:

```css
:root {
  /* Existing variables... */

  /* Animation durations */
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* Easing functions */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* Common transitions */
  --transition-fast: var(--duration-fast) var(--ease-out);
  --transition-normal: var(--duration-normal) var(--ease-out);
  --transition-slow: var(--duration-slow) var(--ease-out);
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. Create Animation Keyframes
Create `/home/pgc/vidlyx/dashboard/src/styles/animations.css`:

```css
/* Fade animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale animations */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  70% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide animations */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Bounce animation */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Shake animation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Ripple effect */
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Shimmer effect */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Spin */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Progress bar */
@keyframes progress {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
```

### 3. Create Animated Button Component
Update `/home/pgc/vidlyx/dashboard/src/components/ui/Button.css`:

```css
.btn {
  position: relative;
  overflow: hidden;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* Ripple effect */
.btn-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

/* Loading state */
.btn-loading .btn-content {
  opacity: 0;
}

.btn-loading .btn-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Success state flash */
.btn-success-flash {
  animation: successFlash 0.5s ease-out;
}

@keyframes successFlash {
  0% {
    background: var(--color-success);
  }
  100% {
    background: var(--color-primary);
  }
}
```

### 4. Create Page Transition Component
Create `/home/pgc/vidlyx/dashboard/src/components/Transitions/PageTransition.js`:

```jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './PageTransition.css';

function PageTransition({ children }) {
  const location = useLocation();

  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.pathname}
        classNames="page"
        timeout={300}
      >
        {children}
      </CSSTransition>
    </TransitionGroup>
  );
}

export default PageTransition;
```

Install required package:
```bash
npm install react-transition-group
```

Create `/home/pgc/vidlyx/dashboard/src/components/Transitions/PageTransition.css`:

```css
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-in;
}
```

### 5. Create Animated List Component
Create `/home/pgc/vidlyx/dashboard/src/components/Transitions/AnimatedList.js`:

```jsx
import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './AnimatedList.css';

function AnimatedList({ items, renderItem, keyExtractor, className = '' }) {
  return (
    <TransitionGroup className={`animated-list ${className}`}>
      {items.map((item, index) => (
        <CSSTransition
          key={keyExtractor(item)}
          classNames="list-item"
          timeout={300}
        >
          <div style={{ '--index': index }}>
            {renderItem(item, index)}
          </div>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}

export default AnimatedList;
```

Create `/home/pgc/vidlyx/dashboard/src/components/Transitions/AnimatedList.css`:

```css
.list-item-enter {
  opacity: 0;
  transform: translateY(10px);
}

.list-item-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
  transition-delay: calc(var(--index, 0) * 50ms);
}

.list-item-exit {
  opacity: 1;
}

.list-item-exit-active {
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}
```

### 6. Add Card Hover Effects
Update save card styles:

```css
.save-card {
  transition:
    transform var(--transition-normal),
    box-shadow var(--transition-normal);
}

.save-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.save-card:active {
  transform: translateY(-2px);
}

/* Image zoom on hover */
.save-card-thumbnail img {
  transition: transform var(--transition-slow);
}

.save-card:hover .save-card-thumbnail img {
  transform: scale(1.05);
}

/* Reveal actions on hover */
.save-card-actions {
  opacity: 0;
  transform: translateY(5px);
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.save-card:hover .save-card-actions {
  opacity: 1;
  transform: translateY(0);
}
```

### 7. Add Frame Selection Animation
Update frame card styles:

```css
.frame-card {
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.frame-card.selected {
  animation: selectPop 0.3s var(--ease-spring);
}

@keyframes selectPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.frame-card .selection-indicator {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transform: scale(0);
  transition: transform var(--transition-fast) var(--ease-spring);
}

.frame-card.selected .selection-indicator {
  transform: scale(1);
}
```

### 8. Add Toast Animations
Update toast styles:

```css
.toast {
  animation: toastSlideIn 0.3s var(--ease-out);
}

.toast.exiting {
  animation: toastSlideOut 0.2s var(--ease-in) forwards;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* Progress bar for auto-dismiss */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: toastProgress var(--toast-duration, 5s) linear;
}

@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}
```

### 9. Add Modal Animations
Update modal styles:

```css
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-overlay.closing {
  animation: fadeOut 0.15s ease-in forwards;
}

.modal {
  animation: modalSlideIn 0.3s var(--ease-spring);
}

.modal-overlay.closing .modal {
  animation: modalSlideOut 0.15s ease-in forwards;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modalSlideOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}
```

## Verification
1. Cards have smooth hover effects
2. Page transitions are smooth
3. List items animate in staggered
4. Modals scale in/out smoothly
5. Toasts slide in from right
6. Reduced motion preference respected

## Next Steps
Proceed to Task 8 - Subtask 8 (Performance Optimization)

## Estimated Time
2-3 hours
