# Error Handling and Loading States Documentation

This document provides comprehensive documentation for all error handling and loading state components in the Vidlyx application.

## Table of Contents

1. [ErrorBoundary](#errorboundary)
2. [Spinner](#spinner)
3. [Skeleton](#skeleton)
4. [EmptyState](#emptystate)
5. [Toast](#toast)
6. [Integration Examples](#integration-examples)

---

## ErrorBoundary

A React error boundary component that catches JavaScript errors in child components and displays a fallback UI.

### Features

- Catches and logs errors in component tree
- Displays user-friendly error message
- Retry functionality to recover from errors
- Go Home button for navigation
- Shows error details in development mode
- Animated UI with gradient background

### Usage

```jsx
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallbackMessage="Custom error message">
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fallbackMessage` | string | Default message | Custom error message to display |
| `children` | ReactNode | - | Child components to protect |

### Methods

- `getDerivedStateFromError(error)`: Updates state when error occurs
- `componentDidCatch(error, errorInfo)`: Logs error details

---

## Spinner

A loading spinner component with configurable size and color.

### Features

- Three size variants: small, medium, large
- Two color variants: primary, white
- Smooth CSS animation
- Can be used inline or full-page

### Usage

```jsx
import { Spinner } from '@/components/Loading';

// Basic usage
<Spinner />

// With custom size and color
<Spinner size="large" color="white" />

// Full-page spinner
<div className="spinner-wrapper--fullpage">
  <Spinner size="large" />
</div>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | 'small' \| 'medium' \| 'large' | 'medium' | Spinner size |
| `color` | 'primary' \| 'white' | 'primary' | Spinner color |
| `className` | string | '' | Additional CSS classes |

---

## Skeleton

Loading placeholder components with pulse animation.

### Features

- Base Skeleton component with customizable dimensions
- SkeletonText for text placeholders
- SkeletonCard for card placeholders
- Rectangular and circular variants
- Smooth pulse animation
- Dark mode support

### Usage

#### Base Skeleton

```jsx
import { Skeleton } from '@/components/Loading';

<Skeleton width="100%" height="2rem" variant="rectangular" />
<Skeleton width="40px" height="40px" variant="circular" />
```

#### SkeletonText

```jsx
import { SkeletonText } from '@/components/Loading';

<SkeletonText
  lines={3}
  lastLineWidth="80%"
  lineHeight="1rem"
  gap="0.75rem"
/>
```

#### SkeletonCard

```jsx
import { SkeletonCard } from '@/components/Loading';

<SkeletonCard
  hasImage={true}
  imageHeight="200px"
  hasAvatar={true}
  linesCount={3}
/>
```

### Props

#### Skeleton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | string | '100%' | Width of skeleton |
| `height` | string | '1rem' | Height of skeleton |
| `variant` | 'rectangular' \| 'circular' | 'rectangular' | Shape variant |
| `className` | string | '' | Additional CSS classes |
| `style` | object | {} | Inline styles |

#### SkeletonText Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lines` | number | 3 | Number of lines |
| `lastLineWidth` | string | '80%' | Width of last line |
| `lineHeight` | string | '1rem' | Height of each line |
| `gap` | string | '0.75rem' | Gap between lines |

#### SkeletonCard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hasImage` | boolean | true | Show image skeleton |
| `imageHeight` | string | '200px' | Height of image |
| `hasAvatar` | boolean | false | Show avatar skeleton |
| `linesCount` | number | 3 | Number of text lines |

---

## EmptyState

A component to display when no data is available.

### Features

- Customizable icon, title, and description
- Optional action button
- Compact variant for smaller spaces
- Fade-in animation
- Dark mode support

### Usage

```jsx
import EmptyState from '@/components/EmptyState';
import { FolderOpen } from '@phosphor-icons/react';

<EmptyState
  icon={FolderOpen}
  iconSize={64}
  iconWeight="duotone"
  title="No folders found"
  description="Create your first folder to get started."
  action={
    <button onClick={handleCreate}>Create Folder</button>
  }
  compact={false}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | Component | Package | Phosphor icon component |
| `iconSize` | number | 64 | Icon size in pixels |
| `iconWeight` | string | 'duotone' | Icon weight |
| `title` | string | 'No items found' | Title text |
| `description` | string | Default message | Description text |
| `action` | ReactNode | null | Action button or element |
| `compact` | boolean | false | Use compact variant |
| `className` | string | '' | Additional CSS classes |

---

## Toast

A notification system with multiple types and auto-dismiss functionality.

### Features

- Four types: success, error, warning, info
- Auto-dismiss with configurable duration
- Manual close button
- Slide-in animation
- Color-coded by type
- Stack multiple toasts
- Can be used anywhere in the app
- Dark mode support

### Setup

Wrap your app with ToastProvider:

```jsx
import { ToastProvider } from '@/components/Toast';

function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}
```

### Usage

#### Using the hook (inside React components)

```jsx
import { useToast } from '@/components/Toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Operation successful!', 'success');
  };

  const handleError = () => {
    showToast('An error occurred', 'error', 10000); // 10 seconds
  };

  return (
    <button onClick={handleSuccess}>Show Success</button>
  );
}
```

#### Using the utility (anywhere in the app)

```jsx
import { toast } from '@/utils/toast';

// Helper methods
toast.success('Successfully saved!');
toast.error('An error occurred');
toast.warning('Please review your input');
toast.info('New update available');

// With custom duration
toast.success('Quick message', 2000); // 2 seconds
toast.error('Important error', 10000); // 10 seconds
```

### API

#### ToastProvider Props

No props required. Wrap your app with this component.

#### useToast Hook

Returns an object with:
- `showToast(message, type, duration)`: Show a toast notification
- `removeToast(id)`: Manually remove a toast

#### Toast Utility Functions

```javascript
// Main function
showToast(message, type, duration)

// Helper functions
toast.success(message, duration)
toast.error(message, duration)
toast.warning(message, duration)
toast.info(message, duration)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | string | - | Toast message |
| `type` | 'success' \| 'error' \| 'warning' \| 'info' | 'info' | Toast type |
| `duration` | number | 5000 | Auto-dismiss duration in ms (0 = no auto-dismiss) |

---

## Integration Examples

### Complete App Setup

```jsx
import React from 'react';
import { ToastProvider, setGlobalToast, useToast } from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';

// Initialize global toast
function ToastInitializer({ children }) {
  const { showToast } = useToast();

  React.useEffect(() => {
    setGlobalToast(showToast);
  }, [showToast]);

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ToastInitializer>
          <YourApp />
        </ToastInitializer>
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### Loading State Example

```jsx
import { Spinner, Skeleton, SkeletonCard } from '@/components/Loading';

function VideoList() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);

  if (loading) {
    return (
      <div className="video-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} hasImage hasAvatar linesCount={2} />
        ))}
      </div>
    );
  }

  return <div className="video-grid">{/* Render videos */}</div>;
}
```

### Empty State Example

```jsx
import EmptyState from '@/components/EmptyState';
import { VideoCamera } from '@phosphor-icons/react';

function VideoList({ videos }) {
  if (videos.length === 0) {
    return (
      <EmptyState
        icon={VideoCamera}
        title="No videos yet"
        description="Upload your first video to get started with analysis."
        action={
          <button onClick={handleUpload}>Upload Video</button>
        }
      />
    );
  }

  return <div className="video-grid">{/* Render videos */}</div>;
}
```

### Error Handling Example

```jsx
import { toast } from '@/utils/toast';

async function saveVideo(data) {
  try {
    const response = await fetch('/api/videos', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to save video');
    }

    const video = await response.json();
    toast.success('Video saved successfully!');
    return video;
  } catch (error) {
    console.error('Error saving video:', error);
    toast.error('Failed to save video. Please try again.');
    throw error;
  }
}
```

### Complete Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { Spinner, SkeletonCard } from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/utils/toast';
import { VideoCamera } from '@phosphor-icons/react';

function VideoGallery() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/videos');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err.message);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="video-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} hasImage hasAvatar linesCount={2} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && videos.length === 0) {
    return (
      <EmptyState
        icon={VideoCamera}
        title="No videos found"
        description="Upload your first video to get started."
        action={
          <button onClick={() => window.location.href = '/upload'}>
            Upload Video
          </button>
        }
      />
    );
  }

  // Success state
  return (
    <div className="video-grid">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

---

## Best Practices

### ErrorBoundary

- Wrap high-level components (routes, features)
- Provide meaningful fallback messages
- Don't catch errors in event handlers (use try/catch)
- Log errors to monitoring service in production

### Loading States

- Use Skeleton for content-heavy components
- Use Spinner for quick operations
- Match skeleton shapes to actual content
- Maintain layout stability during loading

### Empty States

- Provide clear guidance on next steps
- Use relevant icons
- Include actionable buttons when possible
- Keep messages concise and friendly

### Toasts

- Use appropriate types (success, error, warning, info)
- Keep messages short and actionable
- Use longer duration for important errors
- Don't spam users with multiple toasts
- Provide error details in console, not toast

---

## File Structure

```
dashboard/src/
├── components/
│   ├── ErrorBoundary/
│   │   ├── ErrorBoundary.js
│   │   ├── ErrorBoundary.css
│   │   └── index.js
│   ├── Loading/
│   │   ├── Spinner.js
│   │   ├── Spinner.css
│   │   ├── Skeleton.js
│   │   ├── Skeleton.css
│   │   └── index.js
│   ├── EmptyState/
│   │   ├── EmptyState.js
│   │   ├── EmptyState.css
│   │   └── index.js
│   └── Toast/
│       ├── Toast.js
│       ├── Toast.css
│       └── index.js
└── utils/
    └── toast.js
```

---

## Browser Support

All components support:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS animations and transitions
- Dark mode (prefers-color-scheme)
- Responsive design

---

## License

Part of the Vidlyx project.
