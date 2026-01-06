import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MagnifyingGlass, X, Clock, Copy, Check, CircleNotch, BookmarkSimple } from '@phosphor-icons/react';
import { escapeRegExp, debounce } from '../../utils/formatters';
import { useSelection } from '../../contexts/SelectionContext';
import { useToast } from '../../contexts/ToastContext';

function TranscriptPanel({
  segments = [],
  currentTime = 0,
  onSeek,
  loading = false,
  error = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectionPopup, setSelectionPopup] = useState(null);
  const searchInputRef = useRef(null);

  const scrollContainerRef = useRef(null);
  const segmentRefs = useRef([]);

  const { addTranscriptSelection } = useSelection();
  const { showToast } = useToast();

  // Find active segment index with lookahead compensation
  const activeIndex = useMemo(() => {
    const SYNC_OFFSET = 0.5; // 0.5s lookahead
    const adjustedTime = currentTime + SYNC_OFFSET;

    if (segments.length === 0) return -1;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];
      const segmentEnd = nextSegment
        ? nextSegment.start
        : (segment.end || segment.start + 5);

      if (adjustedTime >= segment.start && adjustedTime < segmentEnd) {
        return i;
      }
    }

    if (adjustedTime >= segments[segments.length - 1].start) {
      return segments.length - 1;
    }

    return 0;
  }, [segments, currentTime]);

  // Filter segments based on search
  const filteredIndices = useMemo(() => {
    if (!searchQuery) return segments.map((_, i) => i);
    const lowerQuery = searchQuery.toLowerCase();
    return segments
      .map((segment, i) => segment.text.toLowerCase().includes(lowerQuery) ? i : -1)
      .filter(i => i !== -1);
  }, [segments, searchQuery]);

  // Auto-scroll to active segment (scroll to top, no focus stealing)
  useEffect(() => {
    if (autoScroll && activeIndex >= 0 && segmentRefs.current[activeIndex]) {
      const container = scrollContainerRef.current;
      const segment = segmentRefs.current[activeIndex];

      if (container && segment) {
        // Calculate position to scroll segment to top with small offset
        const containerRect = container.getBoundingClientRect();
        const segmentRect = segment.getBoundingClientRect();
        const offsetTop = segmentRect.top - containerRect.top + container.scrollTop - 16;

        // Smooth scroll without stealing focus
        container.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex, autoScroll]);

  // Handle search
  const handleSearch = useMemo(
    () => debounce((query) => setSearchQuery(query), 300),
    []
  );

  // Toggle search and focus input
  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  };

  // Copy transcript to clipboard (without timestamps)
  const copyTranscript = async () => {
    const text = segments.map(s => s.text).join(' ');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Highlight search terms
  const highlightText = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  // Handle text selection
  const handleMouseUp = (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 5) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionPopup({
        text: selectedText,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    } else {
      setSelectionPopup(null);
    }
  };

  // Handle adding text to selection
  const handleAddToSelection = () => {
    if (selectionPopup) {
      addTranscriptSelection({
        text: selectionPopup.text,
        timestamp: currentTime
      });
      showToast('Text added to selection', 'success');
      setSelectionPopup(null);
      window.getSelection().removeAllRanges();
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (selectionPopup) {
        setSelectionPopup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionPopup]);

  // Loading state
  if (loading) {
    return (
      <div className="transcript-panel">
        <div className="panel-loading">
          <CircleNotch size={32} weight="bold" className="spinning" />
          <p>Loading transcript...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="transcript-panel">
        <div className="panel-empty">
          <Clock size={32} weight="duotone" />
          <p>{error}</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Empty state
  if (!segments.length) {
    return (
      <div className="transcript-panel">
        <div className="panel-empty">
          <Clock size={32} weight="duotone" />
          <p>No transcript available</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="transcript-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-actions">
          {/* Inline Search Bar - expands left of icon */}
          {searchExpanded && (
            <div className="inline-search">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search transcript..."
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <span className="match-count">
                  {filteredIndices.length}
                </span>
              )}
            </div>
          )}
          <button
            className={`icon-btn ${searchExpanded ? 'active' : ''}`}
            onClick={toggleSearch}
            title={searchExpanded ? 'Close search' : 'Search transcript'}
          >
            {searchExpanded ? <X size={16} /> : <MagnifyingGlass size={16} />}
          </button>
          <button
            className={`toggle-btn ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            Auto
          </button>
          <button
            className="icon-btn"
            onClick={copyTranscript}
            title="Copy transcript"
          >
            {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Continuous Text Flow */}
      <div className="transcript-flow" ref={scrollContainerRef} onMouseUp={handleMouseUp}>
        <p className="transcript-text">
          {segments.map((segment, index) => {
            const isActive = index === activeIndex;
            const isSearchMatch = searchQuery && filteredIndices.includes(index);
            const isHidden = searchQuery && !isSearchMatch;

            return (
              <span
                key={index}
                ref={(el) => (segmentRefs.current[index] = el)}
                className={`text-segment ${isActive ? 'active' : ''} ${isHidden ? 'dimmed' : ''}`}
                data-segment-index={index}
                onClick={() => onSeek?.(segment.start)}
                title="Click to seek"
              >
                {highlightText(segment.text, searchQuery)}
                {' '}
              </span>
            );
          })}
        </p>
      </div>

      {/* Text Selection Popup */}
      {selectionPopup && (
        <div
          className="selection-popup"
          style={{
            left: `${selectionPopup.x}px`,
            top: `${selectionPopup.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button className="add-to-save-btn" onClick={handleAddToSelection}>
            <BookmarkSimple size={16} weight="fill" />
            Add to Save
          </button>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .transcript-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    background: #fafafa;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-left: auto;
  }

  .inline-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 16px;
    padding: 0.25rem 0.75rem;
    animation: expandSearch 0.2s ease-out;
  }

  @keyframes expandSearch {
    from {
      width: 0;
      opacity: 0;
      padding: 0;
    }
    to {
      width: 200px;
      opacity: 1;
      padding: 0.25rem 0.75rem;
    }
  }

  .inline-search input {
    border: none;
    outline: none;
    font-size: 0.8125rem;
    color: #374151;
    background: transparent;
    width: 160px;
    min-width: 160px;
  }

  .inline-search input::placeholder {
    color: #9ca3af;
  }

  .match-count {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #1d4ed8;
    background: #dbeafe;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    white-space: nowrap;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .icon-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .icon-btn.active {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .toggle-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #9ca3af;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .toggle-btn:hover {
    color: #6b7280;
  }

  .toggle-btn.active {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .transcript-flow {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    user-select: text;
  }

  .transcript-text {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.8;
    color: #374151;
  }

  .text-segment {
    cursor: pointer;
    border-radius: 3px;
    padding: 1px 2px;
    margin: -1px -2px;
    transition: all 0.2s ease;
  }

  .text-segment:hover {
    background: #f3f4f6;
  }

  .text-segment.active {
    background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
    color: #1e40af;
    font-weight: 500;
    padding: 2px 4px;
    margin: -2px -4px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2);
  }

  .text-segment.dimmed {
    opacity: 0.35;
  }

  .text-segment mark {
    background: #fef08a;
    color: inherit;
    padding: 0 2px;
    border-radius: 2px;
  }

  .selection-popup {
    position: fixed;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 4px;
    z-index: 1000;
  }

  .add-to-save-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .add-to-save-btn:hover {
    background: #1d4ed8;
  }

  .panel-loading,
  .panel-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    gap: 0.5rem;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default TranscriptPanel;
