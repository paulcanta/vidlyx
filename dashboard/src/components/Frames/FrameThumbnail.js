import React from 'react';
import { Play } from '@phosphor-icons/react';

/**
 * FrameThumbnail Component
 * Individual frame thumbnail in the FrameStrip carousel
 */
function FrameThumbnail({ frame, isActive, onClick }) {
  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`frame-thumbnail-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="thumbnail-image">
        <img
          src={frame.thumbnail_url || frame.image_url}
          alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
          loading="lazy"
        />
        <div className="thumbnail-overlay">
          <Play size={20} weight="fill" />
        </div>
      </div>
      <div className="thumbnail-time">
        {formatTimestamp(frame.timestamp)}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .frame-thumbnail-card {
    flex-shrink: 0;
    width: 120px;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .frame-thumbnail-card:hover {
    transform: scale(1.05);
  }

  .frame-thumbnail-card:active {
    transform: scale(0.98);
  }

  .thumbnail-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    overflow: hidden;
    background: #f3f4f6;
    border: 2px solid transparent;
    transition: border-color 0.15s;
  }

  .frame-thumbnail-card:hover .thumbnail-image {
    border-color: #93c5fd;
  }

  .frame-thumbnail-card.active .thumbnail-image {
    border-color: #2563eb;
  }

  .thumbnail-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.15s;
  }

  .frame-thumbnail-card:hover .thumbnail-overlay {
    opacity: 1;
  }

  .thumbnail-overlay svg {
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .thumbnail-time {
    margin-top: 4px;
    font-size: 11px;
    font-family: 'SF Mono', 'Monaco', monospace;
    font-weight: 600;
    color: #6b7280;
    text-align: center;
  }

  .frame-thumbnail-card.active .thumbnail-time {
    color: #2563eb;
  }

  @media (max-width: 768px) {
    .frame-thumbnail-card {
      width: 100px;
    }
  }
`;

export default FrameThumbnail;
