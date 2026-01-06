# Transitions and Animations

This folder contains reusable transition components and animation utilities for the Vidlyx application.

## Components

### PageTransition

Wraps route content with smooth page transition animations.

```jsx
import { PageTransition } from './components/Transitions';

function App() {
  return (
    <PageTransition mode="fade">
      <YourPageContent />
    </PageTransition>
  );
}
```

**Props:**
- `mode`: Animation type - 'fade' | 'slide' | 'scale' (default: 'fade')
- `timeout`: Animation duration in ms (default: 300)

### AnimatedList

Wrapper for list items with staggered enter/exit animations.

```jsx
import { AnimatedList } from './components/Transitions';

function MyList({ items }) {
  return (
    <AnimatedList animation="slide" stagger>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </AnimatedList>
  );
}
```

**Props:**
- `animation`: Animation type - 'fade' | 'slide' | 'scale' | 'slide-left' (default: 'fade')
- `timeout`: Animation duration in ms (default: 300)
- `stagger`: Enable staggered animation (default: false)
- `staggerDelay`: Delay between items in ms (default: 50)
- `component`: HTML tag for container (default: 'div')

## Animation Utilities

### CSS Classes

Add animation classes directly to elements:

```jsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-in-right">Slides from right</div>
<div className="animate-pop-in">Pops in with bounce</div>
```

Available classes:
- `animate-fade-in`, `animate-fade-out`
- `animate-fade-in-up`, `animate-fade-in-down`
- `animate-scale-in`, `animate-scale-out`
- `animate-pop-in`
- `animate-slide-in-right`, `animate-slide-in-left`
- `animate-bounce`, `animate-shake`, `animate-pulse`
- `animate-spin`

### Hover Effects

```jsx
<div className="hover-lift">Lifts on hover</div>
<div className="hover-grow">Grows on hover</div>
<div className="hover-glow">Glows on hover</div>
```

### Loading States

```jsx
<div className="skeleton">Loading skeleton</div>
<div className="loading-spinner">Spinning loader</div>
<div className="loading-dots">
  <span></span>
  <span></span>
  <span></span>
</div>
```

### Staggered Items

```jsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="stagger-item"
    style={{ '--index': index }}
  >
    {item.content}
  </div>
))}
```

## CSS Variables

### Durations
- `--duration-instant`: 50ms
- `--duration-fast`: 150ms
- `--duration-normal`: 300ms
- `--duration-slow`: 500ms

### Easing
- `--ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `--ease-out`: cubic-bezier(0, 0, 0.2, 1)
- `--ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)
- `--ease-bounce`: cubic-bezier(0.68, -0.55, 0.265, 1.55)
- `--ease-spring`: cubic-bezier(0.175, 0.885, 0.32, 1.275)

### Common Transitions
- `--transition-instant`
- `--transition-fast`
- `--transition-normal`
- `--transition-slow`
- `--transition-bounce`
- `--transition-spring`

### Component-specific
- `--transition-button`
- `--transition-modal`
- `--transition-toast`
- `--transition-dropdown`

## Accessibility

All animations respect the `prefers-reduced-motion` media query. Users who prefer reduced motion will see instant transitions instead of animations.

## Usage Tips

1. **Keep animations subtle**: Use fast durations (150-300ms) for most UI interactions
2. **Use appropriate easing**:
   - `ease-out` for entering elements
   - `ease-in` for exiting elements
   - `ease-in-out` for elements that change state
3. **Stagger sparingly**: Use stagger delays of 50-100ms max
4. **Always provide reduced motion support**: Never disable accessibility features
5. **Test on slower devices**: Ensure animations don't cause jank
