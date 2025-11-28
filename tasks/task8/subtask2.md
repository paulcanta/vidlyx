# Task 8 - Subtask 2: Search Results UI with Highlighting

## Objective
Build the search UI with command palette, results display, and text highlighting.

## Prerequisites
- Task 8 - Subtask 1 completed (Full-Text Search)

## Instructions

### 1. Create Global Search Modal (Command Palette)
Create `/home/pgc/vidlyx/dashboard/src/components/Search/SearchModal.js`:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, X, Video, BookmarkSimple, TextT, Clock } from '@phosphor-icons/react';
import { useSearch } from '../../hooks/useSearch';
import SearchResultItem from './SearchResultItem';
import './SearchModal.css';

function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const {
    query,
    results,
    suggestions,
    loading,
    hasSearched,
    search,
    fetchSuggestions,
    clearSearch
  } = useSearch();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      clearSearch();
      setActiveFilter('all');
    }
  }, [isOpen, clearSearch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    search(value, activeFilter === 'all' ? undefined : activeFilter);
    fetchSuggestions(value);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    if (query) {
      search(query, filter === 'all' ? undefined : filter);
    }
  };

  const handleResultClick = (result) => {
    switch (result.type) {
      case 'video':
        navigate(`/app/video/${result.id}`);
        break;
      case 'save':
        navigate(`/app/collection/save/${result.id}`);
        break;
      case 'transcript':
        navigate(`/app/video/${result.video_id}?t=${result.start_time}`);
        break;
    }
    onClose();
  };

  if (!isOpen) return null;

  const filters = [
    { id: 'all', label: 'All', icon: null },
    { id: 'videos', label: 'Videos', icon: <Video size={14} /> },
    { id: 'saves', label: 'Saves', icon: <BookmarkSimple size={14} /> },
    { id: 'transcripts', label: 'Transcripts', icon: <TextT size={14} /> }
  ];

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <MagnifyingGlass size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search videos, saves, transcripts..."
            className="search-input"
          />
          {query && (
            <button className="search-clear" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
          <kbd className="search-shortcut">ESC</kbd>
        </div>

        <div className="search-filters">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => handleFilterChange(filter.id)}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="spinner" />
              Searching...
            </div>
          ) : !hasSearched ? (
            <div className="search-empty">
              <Clock size={24} />
              <span>Recent searches will appear here</span>
            </div>
          ) : results.length === 0 ? (
            <div className="search-no-results">
              <MagnifyingGlass size={32} />
              <span>No results found for "{query}"</span>
              <p>Try different keywords or filters</p>
            </div>
          ) : (
            <div className="search-results-list">
              {results.map((result, index) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onClick={() => handleResultClick(result)}
                  isActive={false}
                />
              ))}
            </div>
          )}
        </div>

        <div className="search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span><kbd>Enter</kbd> to select</span>
          <span><kbd>ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
```

### 2. Create SearchResultItem Component
Create `/home/pgc/vidlyx/dashboard/src/components/Search/SearchResultItem.js`:

```jsx
import React from 'react';
import { Video, BookmarkSimple, TextT, ArrowRight } from '@phosphor-icons/react';
import { formatTimestamp, formatDate } from '../../utils/formatters';
import HighlightedText from './HighlightedText';
import './SearchResultItem.css';

function SearchResultItem({ result, onClick, isActive }) {
  const getIcon = () => {
    switch (result.type) {
      case 'video': return <Video size={20} />;
      case 'save': return <BookmarkSimple size={20} />;
      case 'transcript': return <TextT size={20} />;
      default: return null;
    }
  };

  const getTypeLabel = () => {
    switch (result.type) {
      case 'video': return 'Video';
      case 'save': return 'Save';
      case 'transcript': return 'Transcript';
      default: return '';
    }
  };

  return (
    <button
      className={`search-result-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="result-icon" data-type={result.type}>
        {getIcon()}
      </div>

      <div className="result-content">
        <div className="result-header">
          <span className="result-type">{getTypeLabel()}</span>
          {result.type === 'transcript' && (
            <span className="result-timestamp">
              {formatTimestamp(result.start_time)}
            </span>
          )}
        </div>

        <h4 className="result-title">
          {result.type === 'video' ? (
            <HighlightedText html={result.highlight || result.title} />
          ) : result.type === 'save' ? (
            <HighlightedText html={result.highlight || result.title || result.auto_title} />
          ) : (
            <span className="result-video-title">{result.video_title}</span>
          )}
        </h4>

        {result.type === 'transcript' && (
          <p className="result-excerpt">
            <HighlightedText html={result.highlight} />
          </p>
        )}

        {result.type === 'save' && result.video_title && (
          <p className="result-meta">From: {result.video_title}</p>
        )}
      </div>

      {result.thumbnail_url && (
        <div className="result-thumbnail">
          <img src={result.thumbnail_url} alt="" />
        </div>
      )}

      <ArrowRight size={16} className="result-arrow" />
    </button>
  );
}

export default SearchResultItem;
```

### 3. Create HighlightedText Component
Create `/home/pgc/vidlyx/dashboard/src/components/Search/HighlightedText.js`:

```jsx
import React from 'react';
import DOMPurify from 'dompurify';

function HighlightedText({ html, className = '' }) {
  if (!html) return null;

  // Sanitize HTML to prevent XSS, only allow <mark> tags
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: []
  });

  return (
    <span
      className={`highlighted-text ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

export default HighlightedText;
```

Install DOMPurify:
```bash
cd /home/pgc/vidlyx/dashboard
npm install dompurify
```

### 4. Style Search Modal
Create `/home/pgc/vidlyx/dashboard/src/components/Search/SearchModal.css`:

```css
.search-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.search-modal {
  width: 100%;
  max-width: 640px;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--text-lg);
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-clear {
  padding: var(--space-1);
  background: var(--bg-tertiary);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
}

.search-shortcut {
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.search-filters {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: none;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.search-loading,
.search-empty,
.search-no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  gap: var(--space-2);
  color: var(--text-tertiary);
  text-align: center;
}

.search-results-list {
  padding: var(--space-2);
}

.search-footer {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.search-footer kbd {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  margin-right: 4px;
}
```

### 5. Style SearchResultItem
Create `/home/pgc/vidlyx/dashboard/src/components/Search/SearchResultItem.css`:

```css
.search-result-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  background: none;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.search-result-item:hover,
.search-result-item.active {
  background: var(--bg-tertiary);
}

.result-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  flex-shrink: 0;
}

.result-icon[data-type="video"] {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.result-icon[data-type="save"] {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.result-icon[data-type="transcript"] {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 2px;
}

.result-type {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}

.result-timestamp {
  font-size: var(--text-xs);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 1px 6px;
  border-radius: var(--border-radius-sm);
}

.result-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-excerpt {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 4px 0 0;
}

.result-thumbnail {
  width: 60px;
  height: 34px;
  flex-shrink: 0;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.result-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-arrow {
  color: var(--text-tertiary);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.search-result-item:hover .result-arrow {
  opacity: 1;
}

/* Highlighted text */
.highlighted-text mark {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
  padding: 0 2px;
  border-radius: 2px;
}
```

### 6. Add Search Trigger to Header
Update the app header to include search button:

```jsx
import { MagnifyingGlass } from '@phosphor-icons/react';
import SearchModal from './Search/SearchModal';

function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

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
    <header className="app-header">
      {/* ... other header content ... */}

      <button
        className="search-trigger"
        onClick={() => setSearchOpen(true)}
      >
        <MagnifyingGlass size={18} />
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </header>
  );
}
```

## Verification
1. Cmd/Ctrl+K opens search modal
2. Results appear as you type
3. Filter tabs work correctly
4. Search matches are highlighted
5. Clicking result navigates correctly
6. ESC closes modal

## Next Steps
Proceed to Task 8 - Subtask 3 (Keyboard Shortcuts)

## Estimated Time
3-4 hours
