# Task 8 - Subtask 5: Responsive Design

## Objective
Make the application fully responsive across desktop, tablet, and mobile devices.

## Prerequisites
- Task 8 - Subtask 4 completed (Export Functionality)

## Instructions

### 1. Define Breakpoints
Update `/home/pgc/vidlyx/dashboard/src/styles/variables.css`:

```css
:root {
  /* Existing variables... */

  /* Breakpoints */
  --breakpoint-xs: 480px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* Container widths */
  --container-xs: 100%;
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
}
```

### 2. Create Responsive Utilities Hook
Create `/home/pgc/vidlyx/dashboard/src/hooks/useMediaQuery.js`:

```javascript
import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch: isMobile || isTablet
  };
}
```

### 3. Responsive App Layout
Update `/home/pgc/vidlyx/dashboard/src/components/Layout/AppLayout.css`:

```css
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: transform var(--transition-normal);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-header {
  height: var(--header-height);
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.app-content {
  flex: 1;
  overflow-y: auto;
}

/* Mobile Navigation */
.mobile-nav-toggle {
  display: none;
}

/* Tablet and below */
@media (max-width: 1023px) {
  .app-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: var(--z-sidebar);
    transform: translateX(-100%);
  }

  .app-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: calc(var(--z-sidebar) - 1);
  }

  .sidebar-overlay.visible {
    display: block;
  }

  .mobile-nav-toggle {
    display: flex;
    padding: var(--space-2);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-primary);
  }
}

/* Mobile */
@media (max-width: 639px) {
  .app-header {
    padding: 0 var(--space-3);
  }

  .app-header .search-trigger {
    padding: var(--space-2);
  }

  .app-header .search-trigger span,
  .app-header .search-trigger kbd {
    display: none;
  }
}
```

### 4. Responsive Video Analysis Page
Update `/home/pgc/vidlyx/dashboard/src/pages/app/VideoAnalysis.css`:

```css
.video-analysis {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-4);
  padding: var(--space-4);
  height: calc(100vh - var(--header-height));
}

.video-player-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.video-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tablet */
@media (max-width: 1023px) {
  .video-analysis {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: auto;
    min-height: calc(100vh - var(--header-height));
  }

  .video-sidebar {
    height: 50vh;
    min-height: 300px;
  }
}

/* Mobile */
@media (max-width: 639px) {
  .video-analysis {
    padding: var(--space-2);
    gap: var(--space-2);
  }

  .video-player-container {
    margin: 0 calc(var(--space-2) * -1);
  }

  .video-sidebar {
    height: auto;
    max-height: none;
  }

  .video-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

### 5. Responsive Collection Grid
Update `/home/pgc/vidlyx/dashboard/src/pages/app/Collection.css`:

```css
.collection-layout {
  display: flex;
  height: calc(100vh - var(--header-height));
}

.collection-sidebar {
  width: 250px;
  border-right: 1px solid var(--border-color);
  padding: var(--space-4);
  flex-shrink: 0;
  overflow-y: auto;
}

.collection-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.save-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-4);
}

/* Tablet */
@media (max-width: 1023px) {
  .collection-sidebar {
    position: fixed;
    top: var(--header-height);
    left: 0;
    bottom: 0;
    z-index: var(--z-sidebar);
    background: var(--bg-primary);
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }

  .collection-sidebar.open {
    transform: translateX(0);
  }

  .collection-main {
    padding: var(--space-3);
  }

  .save-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-3);
  }
}

/* Mobile */
@media (max-width: 639px) {
  .collection-main {
    padding: var(--space-2);
  }

  .collection-toolbar {
    flex-direction: column;
    gap: var(--space-2);
  }

  .collection-toolbar .search-input {
    width: 100%;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .save-grid {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  .save-card {
    display: flex;
    flex-direction: row;
    height: auto;
  }

  .save-card-thumbnail {
    width: 120px;
    flex-shrink: 0;
  }
}
```

### 6. Responsive Modals
Update `/home/pgc/vidlyx/dashboard/src/components/ui/Modal.css`:

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: var(--z-modal);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  max-height: calc(100vh - var(--space-8));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  padding: var(--space-4);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--border-color);
}

/* Mobile */
@media (max-width: 639px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal {
    max-width: none;
    max-height: 90vh;
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer button {
    width: 100%;
  }
}
```

### 7. Responsive Frame Gallery
Update `/home/pgc/vidlyx/dashboard/src/components/Frame/FrameGallery.css`:

```css
.frame-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.frame-card {
  position: relative;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  cursor: pointer;
}

.frame-card-image {
  aspect-ratio: 16/9;
  object-fit: cover;
  width: 100%;
}

/* Tablet */
@media (max-width: 1023px) {
  .frame-gallery {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-2);
  }
}

/* Mobile */
@media (max-width: 639px) {
  .frame-gallery {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }

  .frame-card-overlay {
    opacity: 1;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
  }
}
```

### 8. Touch-Friendly Interactions
Create `/home/pgc/vidlyx/dashboard/src/styles/touch.css`:

```css
/* Increase tap targets on touch devices */
@media (pointer: coarse) {
  button,
  a,
  input,
  select,
  .clickable {
    min-height: 44px;
    min-width: 44px;
  }

  .btn-icon {
    padding: var(--space-3);
  }

  /* Disable hover effects on touch */
  .save-card:hover,
  .folder-item:hover,
  .frame-card:hover {
    transform: none;
  }

  /* Add active states instead */
  .save-card:active,
  .folder-item:active,
  .frame-card:active {
    transform: scale(0.98);
  }

  /* Make checkboxes larger */
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
  }

  /* Improve scroll behavior */
  .scrollable {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}
```

### 9. Add Viewport Meta Tag
Ensure `public/index.html` has proper viewport meta:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

## Verification
1. Test on desktop (>1024px)
2. Test on tablet (768px-1023px)
3. Test on mobile (<640px)
4. Sidebar collapses on tablet/mobile
5. Modals adapt to mobile (bottom sheet)
6. Touch targets are at least 44px

## Next Steps
Proceed to Task 8 - Subtask 6 (Error Handling and Loading States)

## Estimated Time
3-4 hours
