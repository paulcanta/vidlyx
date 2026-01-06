import React, { useRef, useEffect } from 'react';
import { Star, TextAa, Sparkle } from '@phosphor-icons/react';
import { formatTimestamp } from '../../utils/formatters';

/**
 * FrameTimeline Component
 * Horizontal timeline view with frame thumbnails
 */
function FrameTimeline({ frames = [], currentTime = 0, onFrameClick, onSeek }) {
  const timelineRef = useRef(null);
  const activeFrameRef = useRef(null);

  // Find active frame
  const activeIndex = frames.findIndex((frame, index) => {
    const nextFrame = frames[index + 1];
    return (
      currentTime >= frame.timestamp &&
      (!nextFrame || currentTime < nextFrame.timestamp)
    );
  });

  // Auto-scroll to active frame
  useEffect(() => {
    if (activeFrameRef.current && timelineRef.current) {
      const container = timelineRef.current;
      const activeElement = activeFrameRef.current;

      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      const elementLeft = activeElement.offsetLeft;
      const elementWidth = activeElement.offsetWidth;

      // Calculate if element is out of view
      if (
        elementLeft < scrollLeft ||
        elementLeft + elementWidth > scrollLeft + containerWidth
      ) {
        // Scroll to center the active element
        container.scrollTo({
          left: elementLeft - containerWidth / 2 + elementWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex]);

  if (!frames.length) {
    return (
      <div className="frame-timeline-empty">
        <p>No frames available</p>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="frame-timeline" ref={timelineRef}>
      <div className="timeline-track">
        {frames.map((frame, index) => {
          const isActive = index === activeIndex;

          return (
            <div
              key={frame.id || index}
              ref={isActive ? activeFrameRef : null}
              className={`timeline-frame ${isActive ? 'active' : ''}`}
              onClick={() => onFrameClick?.(frame)}
            >
              {/* Thumbnail */}
              <div className="timeline-thumbnail">
                <img
                  src={frame.thumbnail_url || frame.image_url}
                  alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
                  loading="lazy"
                />

                {/* Active indicator */}
                {isActive && <div className="active-indicator" />}

                {/* Badges */}
                <div className="timeline-badges">
                  {frame.is_keyframe && (
                    <span className="timeline-badge keyframe" title="Keyframe">
                      <Star size={10} weight="fill" />
                    </span>
                  )}
                  {frame.has_text && (
                    <span className="timeline-badge text" title="Contains text">
                      <TextAa size={10} weight="bold" />
                    </span>
                  )}
                  {frame.has_analysis && (
                    <span className="timeline-badge analysis" title="Has AI analysis">
                      <Sparkle size={10} weight="fill" />
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="timeline-info">
                <button
                  className="timeline-timestamp"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek?.(frame.timestamp);
                  }}
                >
                  {formatTimestamp(frame.timestamp)}
                </button>

                {frame.ocr_text && (
                  <div className="timeline-text">
                    {frame.ocr_text.slice(0, 30)}
                    {frame.ocr_text.length > 30 && '...'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .frame-timeline {
    overflow-x: auto;
    overflow-y: hidden;
    background: white;
    border-radius: 8px;
    padding: 1rem;
  }

  .frame-timeline::-webkit-scrollbar {
    height: 8px;
  }

  .frame-timeline::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
  }

  .frame-timeline::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }

  .frame-timeline::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  .timeline-track {
    display: flex;
    gap: 0.75rem;
    min-width: min-content;
  }

  .timeline-frame {
    flex: 0 0 180px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .timeline-frame:hover {
    transform: translateY(-2px);
  }

  .timeline-frame.active {
    transform: translateY(-4px);
  }

  .timeline-thumbnail {
    position: relative;
    width: 180px;
    height: 100px;
    border-radius: 6px;
    overflow: hidden;
    background: #f3f4f6;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }

  .timeline-frame:hover .timeline-thumbnail {
    border-color: #93c5fd;
  }

  .timeline-frame.active .timeline-thumbnail {
    border-color: #2563eb;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  }

  .timeline-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .active-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #2563eb;
  }

  .timeline-badges {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .timeline-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .timeline-badge.keyframe {
    color: #fbbf24;
  }

  .timeline-badge.text {
    color: #60a5fa;
  }

  .timeline-badge.analysis {
    color: #a78bfa;
  }

  .timeline-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .timeline-timestamp {
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
    text-align: left;
  }

  .timeline-timestamp:hover {
    background: #dbeafe;
  }

  .timeline-text {
    font-size: 0.7rem;
    color: #6b7280;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .frame-timeline-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    color: #9ca3af;
  }
`;

export default FrameTimeline;
