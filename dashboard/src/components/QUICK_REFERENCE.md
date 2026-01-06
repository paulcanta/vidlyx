# Quick Reference Guide - Error Handling & Loading States

## Table of Contents
- [Setup](#setup)
- [ErrorBoundary](#errorboundary)
- [Spinner](#spinner)
- [Skeleton](#skeleton)
- [EmptyState](#emptystate)
- [Toast](#toast)

---

## Setup

### 1. Wrap your App with providers (in App.js or index.js)

```jsx
import React, { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast, setGlobalToast } from './components/Toast';

// Initialize global toast
function ToastInitializer({ children }) {
  const { showToast } = useToast();
  useEffect(() => {
    setGlobalToast(showToast);
  }, [showToast]);
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ToastInitializer>
          {/* Your app content */}
        </ToastInitializer>
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

---

## ErrorBoundary

Catches errors in React components.

```jsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Wrap any component that might error
<ErrorBoundary fallbackMessage="Custom error message">
  <MyComponent />
</ErrorBoundary>
```

**When to use:**
- Wrap entire app
- Wrap major features/routes
- Wrap third-party components

---

## Spinner

Loading spinner with different sizes and colors.

```jsx
import { Spinner } from '@/components/Loading';

// Small spinner
<Spinner size="small" />

// Medium (default)
<Spinner />

// Large spinner
<Spinner size="large" />

// White spinner
<Spinner color="white" />

// Full-page spinner
<div className="spinner-wrapper--fullpage">
  <Spinner size="large" />
</div>
```

**When to use:**
- Quick operations (< 2 seconds)
- Full-page loading
- Button loading states

---

## Skeleton

Loading placeholders that match your content.

```jsx
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/Loading';

// Basic skeleton
<Skeleton width="100%" height="2rem" />

// Circle (for avatars)
<Skeleton width="40px" height="40px" variant="circular" />

// Text lines
<SkeletonText lines={3} lastLineWidth="80%" />

// Full card
<SkeletonCard
  hasImage={true}
  imageHeight="200px"
  hasAvatar={true}
  linesCount={3}
/>

// Multiple cards
{Array.from({ length: 6 }).map((_, i) => (
  <SkeletonCard key={i} hasImage hasAvatar linesCount={2} />
))}
```

**When to use:**
- Content-heavy pages
- List/grid loading
- Better than spinner for known layouts

---

## EmptyState

Display when no data is available.

```jsx
import EmptyState from '@/components/EmptyState';
import { VideoCamera } from '@phosphor-icons/react';

// Basic
<EmptyState
  icon={VideoCamera}
  title="No videos"
  description="Upload your first video to get started."
/>

// With action button
<EmptyState
  icon={VideoCamera}
  title="No videos"
  description="Upload your first video to get started."
  action={
    <button onClick={handleUpload}>Upload Video</button>
  }
/>

// Compact variant
<EmptyState
  icon={VideoCamera}
  title="No results"
  description="Try adjusting your filters."
  compact={true}
/>
```

**When to use:**
- Empty lists/tables
- No search results
- First-time user experience

---

## Toast

Show notifications to users.

```jsx
import { toast } from '@/utils/toast';

// Success
toast.success('Saved successfully!');

// Error
toast.error('Failed to save');

// Warning
toast.warning('Please review your input');

// Info
toast.info('New features available');

// Custom duration (milliseconds)
toast.success('Quick message', 2000); // 2 seconds
toast.error('Important message', 10000); // 10 seconds

// No auto-dismiss
toast.info('Persistent message', 0);
```

**When to use:**
- Action confirmations (save, delete, update)
- Error messages
- Warnings
- Info updates

**Don't use for:**
- Long error messages (use modal instead)
- Multiple simultaneous toasts (keep it to 1-3)

---

## Common Patterns

### Loading Pattern

```jsx
function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  if (loading) {
    return <Spinner />;
    // OR
    return (
      <div className="grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return <div>{/* render data */}</div>;
}
```

### Empty Pattern

```jsx
function MyComponent() {
  const [data, setData] = useState([]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={VideoCamera}
        title="No items"
        description="Add your first item"
        action={<button>Add Item</button>}
      />
    );
  }

  return <div>{/* render data */}</div>;
}
```

### Error Pattern

```jsx
async function handleSave() {
  try {
    await saveData();
    toast.success('Saved successfully!');
  } catch (error) {
    console.error('Save failed:', error);
    toast.error('Failed to save. Please try again.');
  }
}
```

### Complete Pattern

```jsx
function VideoList() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} hasImage hasAvatar />
        ))}
      </div>
    );
  }

  // Empty
  if (videos.length === 0) {
    return (
      <EmptyState
        icon={VideoCamera}
        title="No videos"
        description="Upload your first video"
        action={<button>Upload</button>}
      />
    );
  }

  // Success
  return (
    <div className="grid">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

---

## Import Cheat Sheet

```jsx
// Error Boundary
import ErrorBoundary from '@/components/ErrorBoundary';

// Loading
import { Spinner } from '@/components/Loading';
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/Loading';

// Empty State
import EmptyState from '@/components/EmptyState';

// Toast (utility - use anywhere)
import { toast } from '@/utils/toast';

// Toast (React hook - use in components)
import { useToast } from '@/components/Toast';

// Icons
import { VideoCamera, FolderOpen, Package } from '@phosphor-icons/react';
```

---

## Tips

1. **ErrorBoundary:** Wrap at high levels (app, routes, features)
2. **Spinner:** Use for quick operations, full-page loading
3. **Skeleton:** Use for content-heavy pages, better UX than spinner
4. **EmptyState:** Always provide next steps or actions
5. **Toast:** Keep messages short, use appropriate types
6. **Performance:** Skeletons are more performant than spinners
7. **UX:** Match skeleton shapes to actual content
8. **Accessibility:** All components are keyboard accessible

---

## Color Reference

- Primary: #667eea (Purple)
- Success: #10b981 (Green)
- Error: #ef4444 (Red)
- Warning: #f59e0b (Amber)
- Info: #3b82f6 (Blue)

---

## Need Help?

See full documentation in `ERROR_HANDLING_LOADING_STATES.md`
See examples in `INTEGRATION_EXAMPLE.js`
