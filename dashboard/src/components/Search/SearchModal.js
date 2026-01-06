import React, { useState, useEffect, useRef } from 'react';
import { X, MagnifyingGlass } from '@phosphor-icons/react';
import SearchResultItem from './SearchResultItem';
import './SearchModal.css';

/**
 * SearchModal Component
 *
 * Command palette style search modal with:
 * - Centered overlay with blur backdrop
 * - Search input with icon
 * - Filter tabs for different result types
 * - Results list with loading and empty states
 * - Keyboard navigation support (ESC to close)
 */
// Default no-op search hook for when useSearch is not provided
const defaultSearchHook = () => ({ results: [], isLoading: false, error: null });

const SearchModal = ({ isOpen, onClose, useSearch = defaultSearchHook }) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const inputRef = useRef(null);

  // Use the search hook (passed as prop to allow flexibility)
  // Always call the hook unconditionally to follow React's rules of hooks
  const { results, isLoading, error } = useSearch(query, activeFilter);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle result selection
  const handleResultSelect = (result) => {
    onClose();
    // Navigation is handled in SearchResultItem
  };

  // Filter options
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'videos', label: 'Videos' },
    { id: 'saves', label: 'Saves' },
    { id: 'transcripts', label: 'Transcripts' },
  ];

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={handleBackdropClick}>
      <div className="search-modal">
        {/* Search Input */}
        <div className="search-modal-header">
          <div className="search-modal-input-wrapper">
            <MagnifyingGlass size={20} className="search-modal-input-icon" />
            <input
              ref={inputRef}
              type="text"
              className="search-modal-input"
              placeholder="Search videos, saves, transcripts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <button
              className="search-modal-close-btn"
              onClick={onClose}
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="search-modal-filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={`search-modal-filter-btn ${
                  activeFilter === filter.id ? 'active' : ''
                }`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="search-modal-body">
          {isLoading && (
            <div className="search-modal-empty">
              <div className="search-modal-loader"></div>
              <p>Searching...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="search-modal-empty">
              <p className="search-modal-error">
                Error: {error.message || 'Failed to search'}
              </p>
            </div>
          )}

          {!isLoading && !error && query && results.length === 0 && (
            <div className="search-modal-empty">
              <MagnifyingGlass size={48} weight="duotone" />
              <p>No results found for "{query}"</p>
              <p className="search-modal-empty-hint">
                Try different keywords or filters
              </p>
            </div>
          )}

          {!isLoading && !error && !query && (
            <div className="search-modal-empty">
              <MagnifyingGlass size={48} weight="duotone" />
              <p>Start typing to search</p>
              <p className="search-modal-empty-hint">
                Search across videos, saves, and transcripts
              </p>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <div className="search-modal-results">
              {results.map((result) => (
                <SearchResultItem
                  key={`${result.type}-${result.id || result.videoId || Math.random()}`}
                  result={result}
                  onSelect={handleResultSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="search-modal-footer">
          <div className="search-modal-hints">
            <span className="search-modal-hint">
              <kbd>ESC</kbd> to close
            </span>
            <span className="search-modal-hint">
              <kbd>↵</kbd> to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
