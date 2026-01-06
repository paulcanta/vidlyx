# Vidlyx Animation Quick Reference

## CSS Animation Classes

### Fade Animations
```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-fade-out">Fades out</div>
<div class="animate-fade-in-up">Fades in from below</div>
<div class="animate-fade-in-down">Fades in from above</div>
```

### Scale Animations
```html
<div class="animate-scale-in">Scales in</div>
<div class="animate-scale-out">Scales out</div>
<div class="animate-pop-in">Pops in with bounce</div>
```

### Slide Animations
```html
<div class="animate-slide-in-right">Slides from right</div>
<div class="animate-slide-in-left">Slides from left</div>
```

### Interaction Animations
```html
<div class="animate-bounce">Bounces continuously</div>
<div class="animate-shake">Shakes once</div>
<div class="animate-pulse">Pulses continuously</div>
<div class="animate-spin">Spins continuously</div>
```

### Hover Effects
```html
<div class="hover-lift">Lifts on hover</div>
<div class="hover-grow">Grows on hover</div>
<div class="hover-glow">Glows on hover</div>
```

### Loading States
```html
<div class="skeleton">Loading skeleton</div>
<div class="loading-spinner">Spinner</div>
<div class="loading-dots">
  <span></span><span></span><span></span>
</div>
```

## React Components

### PageTransition
```jsx
import { PageTransition } from './components/Transitions';

<PageTransition mode="fade" timeout={300}>
  <YourContent />
</PageTransition>
```

Modes: `fade` | `slide` | `scale`

### AnimatedList
```jsx
import { AnimatedList } from './components/Transitions';

<AnimatedList
  animation="slide"
  stagger={true}
  staggerDelay={50}
>
  {items.map(item => <div key={item.id}>{item}</div>)}
</AnimatedList>
```

Animations: `fade` | `slide` | `scale` | `slide-left`

### Card Component
```jsx
import { Card, CardHeader, CardTitle, CardBody } from './components/Common';

<Card interactive elevated selected badge="New">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

## CSS Variables

### Durations
```css
var(--duration-instant)  /* 50ms */
var(--duration-fast)     /* 150ms */
var(--duration-normal)   /* 300ms */
var(--duration-slow)     /* 500ms */
```

### Easing
```css
var(--ease-in)           /* Accelerating */
var(--ease-out)          /* Decelerating */
var(--ease-in-out)       /* Both */
var(--ease-bounce)       /* Bouncy */
var(--ease-spring)       /* Spring-like */
```

### Transitions
```css
var(--transition-fast)   /* 150ms ease-out */
var(--transition-normal) /* 300ms ease-in-out */
var(--transition-slow)   /* 500ms ease-in-out */
var(--transition-bounce) /* 300ms bounce */
var(--transition-spring) /* 300ms spring */
```

### Component-Specific
```css
var(--transition-button)   /* Button interactions */
var(--transition-modal)    /* Modal open/close */
var(--transition-toast)    /* Toast notifications */
var(--transition-dropdown) /* Dropdown menus */
```

## Custom Animations

### Staggered List
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

### Custom Timing
```jsx
<div style={{
  animation: 'fadeIn var(--duration-slow) var(--ease-bounce)'
}}>
  Custom animation
</div>
```

## Best Practices

1. **Use semantic class names**: `animate-fade-in` not `fade`
2. **Keep durations short**: 150-300ms for most interactions
3. **Use ease-out for entrances**: Elements appear to slow down
4. **Use ease-in for exits**: Elements appear to speed up
5. **Stagger sparingly**: Max 50-100ms delay between items
6. **Test reduced motion**: Always check accessibility
7. **Prefer CSS over JS**: Better performance
8. **Don't animate layout properties**: Use transform/opacity

## Common Patterns

### Button with ripple
```css
.button {
  position: relative;
  overflow: hidden;
  transition: all var(--transition-button);
}

.button::after {
  /* Ripple effect on click */
}
```

### Card with hover
```css
.card {
  transition: all var(--transition-fast);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

### Loading skeleton
```css
.skeleton {
  background: linear-gradient(90deg, ...);
  animation: shimmer 1.5s ease-in-out infinite;
}
```

## Troubleshooting

### Animation not working?
1. Check if animations.css is imported
2. Verify class name spelling
3. Check for CSS specificity issues
4. Test without reduced motion enabled

### Animation too fast/slow?
1. Use different duration variable
2. Custom duration: `animation-duration: 500ms`

### Stagger not working?
1. Ensure `--index` is set on element
2. Use `animation-delay: calc(var(--index) * 50ms)`

### Performance issues?
1. Use transform/opacity only
2. Avoid animating width/height/top/left
3. Use will-change sparingly
4. Check frame rate in DevTools
