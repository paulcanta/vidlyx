import React, { useState } from 'react';
import { Star, TextAa, Sparkle, Play, CheckSquare, Square } from '@phosphor-icons/react';
import { formatTimestamp } from '../../utils/formatters';
import { useSelection } from '../../contexts/SelectionContext';

/**
 * FrameCard Component
 * Individual frame thumbnail card with badges and metadata
 */
function FrameCard({ frame, isActive, onClick, onTimestampClick }) {
  const [isClicked, setIsClicked] = useState(false);
  const { selectionMode, selectedFrames, toggleFrameSelection } = useSelection();

  // Check if this frame is selected
  const isSelected = selectedFrames.some((f) => f.id === frame.id);

  const handleClick = (e) => {
    e.stopPropagation();

    // If in selection mode, toggle selection
    if (selectionMode) {
      toggleFrameSelection(frame);
      return;
    }

    // Normal click behavior
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    onClick?.(frame);
  };

  const handleTimestampClick = (e) => {
    e.stopPropagation();
    onTimestampClick?.(frame.timestamp);
  };

  return (
    <div
      className={`frame-card ${isActive ? 'active' : ''} ${isClicked ? 'clicked' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="frame-thumbnail">
        <img
          src={frame.thumbnail_url || frame.image_url}
          alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
          loading="lazy"
        />

        {/* Selection Checkbox (only in selection mode) */}
        {selectionMode && (
          <div className="selection-checkbox">
            {isSelected ? (
              <CheckSquare size={24} weight="fill" color="#2563eb" />
            ) : (
              <Square size={24} weight="regular" color="#6b7280" />
            )}
          </div>
        )}

        {/* Play Icon Overlay (hidden in selection mode) */}
        {!selectionMode && (
          <div className="play-overlay">
            <Play size={48} weight="fill" />
          </div>
        )}

        {/* Badges */}
        <div className="frame-badges">
          {frame.is_keyframe && (
            <span className="badge keyframe-badge" title="Keyframe">
              <Star size={12} weight="fill" />
            </span>
          )}
          {frame.has_text && (
            <span className="badge text-badge" title="Contains text">
              <TextAa size={12} weight="bold" />
            </span>
          )}
          {frame.has_analysis && (
            <span className="badge analysis-badge" title="Has AI analysis">
              <Sparkle size={12} weight="fill" />
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="frame-info">
        <button
          className="frame-timestamp"
          onClick={handleTimestampClick}
          title="Jump to this time"
        >
          {formatTimestamp(frame.timestamp)}
        </button>

        {frame.ocr_text && (
          <div className="frame-text-preview">
            {frame.ocr_text.slice(0, 60)}
            {frame.ocr_text.length > 60 && '...'}
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .frame-card {
    border-radius: 8px;
    overflow: hidden;
    background: white;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .frame-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
  }

  .frame-card.active {
    border-color: #2563eb;
    box-shadow: 0 2px 12px rgba(37, 99, 235, 0.2);
  }

  .frame-card.selected {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }

  .frame-card.clicked {
    animation: clickPulse 0.3s ease-out;
  }

  @keyframes clickPulse {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  .frame-thumbnail {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    background: #f3f4f6;
    overflow: hidden;
  }

  .frame-thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .selection-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    background: white;
    border-radius: 4px;
    padding: 2px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.2s;
    color: white;
  }

  .frame-card:hover .play-overlay {
    opacity: 1;
  }

  .frame-badges {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
  }

  .badge {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .keyframe-badge {
    color: #fbbf24;
  }

  .text-badge {
    color: #60a5fa;
  }

  .analysis-badge {
    color: #a78bfa;
  }

  .frame-info {
    padding: 0.5rem;
  }

  .frame-timestamp {
    display: inline-block;
    background: none;
    border: none;
    color: #2563eb;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .frame-timestamp:hover {
    background: #dbeafe;
  }

  .frame-text-preview {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`;

export default FrameCard;
