# Search Components

Command palette style search UI with highlighting for the Vidlyx project.

## Components

### SearchModal

Main search modal component with command palette UX.

**Features:**
- Centered overlay with blur backdrop
- Slide-down animation on open
- ESC key to close
- Auto-focus on input when opened
- Filter tabs (All, Videos, Saves, Transcripts)
- Loading and empty states
- Keyboard hints in footer

**Usage:**
```jsx
import { SearchModal } from './components/Search';
import { useSearch } from './hooks/useSearch'; // Custom hook

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsSearchOpen(true)}>
        Open Search
      </button>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        useSearch={useSearch}
      />
    </>
  );
}
```

**Props:**
- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Callback when modal should close
- `useSearch` (function): Custom hook that returns `{ results, isLoading, error }`

### SearchResultItem

Individual search result display component.

**Features:**
- Type-based icons (Video, Save, Transcript)
- Color-coded icon backgrounds
- Highlighted text in title and excerpt
- Optional timestamp display
- Optional thumbnail
- Click to navigate
- Hover effects and animations

**Usage:**
```jsx
import { SearchResultItem } from './components/Search';

<SearchResultItem
  result={{
    type: 'video',
    id: '123',
    videoId: '123',
    title: 'Search <mark>term</mark> highlighted',
    excerpt: 'This is an excerpt with <mark>highlighted</mark> text',
    thumbnail: 'https://...',
    timestamp: 120 // optional, in seconds
  }}
  onSelect={(result) => console.log('Selected:', result)}
/>
```

**Result Object Shape:**
```typescript
{
  type: 'video' | 'save' | 'transcript',
  id: string,
  videoId?: string,
  saveId?: string,
  title: string,         // Can contain <mark> tags for highlights
  excerpt?: string,      // Can contain <mark> tags for highlights
  thumbnail?: string,
  timestamp?: number     // In seconds
}
```

### HighlightedText

Safely renders HTML with highlighted search matches.

**Features:**
- Sanitizes HTML using DOMPurify
- Only allows `<mark>` tags
- Prevents XSS attacks
- Preserves text content

**Usage:**
```jsx
import { HighlightedText } from './components/Search';

<HighlightedText
  text="This is <mark>highlighted</mark> text"
  className="custom-class"
/>
```

**Props:**
- `text` (string): HTML string with `<mark>` tags
- `className` (string): Optional CSS class

## Styling

### CSS Variables

The components use CSS variables for theming:

```css
--color-primary: #3b82f6
--color-bg-primary: #ffffff
--color-bg-secondary: #f9fafb
--color-bg-tertiary: #f3f4f6
--color-border: #e5e7eb
--color-text-primary: #111827
--color-text-secondary: #6b7280
--color-text-tertiary: #9ca3af
--color-error: #ef4444
```

### Dark Mode

Both CSS files include dark mode support via `@media (prefers-color-scheme: dark)`.

### Customization

You can override styles by:
1. Defining CSS variables in your root styles
2. Creating custom CSS classes
3. Modifying the component CSS files directly

## Dependencies

- `react` and `react-router-dom` for navigation
- `@phosphor-icons/react` for icons
- `dompurify` for XSS protection

## Keyboard Shortcuts

- `ESC` - Close search modal
- `Enter` - Select highlighted result (when keyboard navigation is implemented)

## Integration Example

```jsx
import React, { useState, useEffect } from 'react';
import { SearchModal } from './components/Search';

// Custom search hook
function useSearch(query, filter) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Call your search API
    fetch(`/api/search?q=${query}&filter=${filter}`)
      .then(res => res.json())
      .then(data => {
        setResults(data.results);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, [query, filter]);

  return { results, isLoading, error };
}

// In your app
function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SearchModal
      isOpen={searchOpen}
      onClose={() => setSearchOpen(false)}
      useSearch={useSearch}
    />
  );
}
```

## API Response Format

The search API should return results with `<mark>` tags for highlighting:

```json
{
  "results": [
    {
      "type": "video",
      "id": "123",
      "videoId": "123",
      "title": "How to use <mark>React</mark> hooks",
      "thumbnail": "https://...",
      "excerpt": null
    },
    {
      "type": "transcript",
      "id": "456",
      "videoId": "123",
      "title": "Video Title",
      "excerpt": "In this section we discuss <mark>React</mark> state management...",
      "timestamp": 120
    }
  ]
}
```

## Future Enhancements

- Keyboard navigation (arrow keys to select results)
- Recent searches
- Search suggestions
- Advanced filters
- Result grouping by type
- Infinite scroll for large result sets
