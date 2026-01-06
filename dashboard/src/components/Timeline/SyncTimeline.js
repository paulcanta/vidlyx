import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from '@phosphor-icons/react';
import TimeDisplay from './TimeDisplay';
import TimelineMarker from './TimelineMarker';
import { formatTimestamp } from '../../utils/formatters';

/**
 * SyncTimeline Component
 * Synchronized timeline view with video progress, frame markers, and thumbnails
 */
function SyncTimeline({ video, currentTime = 0, onSeek, frames = [] }) {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTime, setHoveredTime] = useState(null);
  const [hoveredPosition, setHoveredPosition] = useState(null);

  const duration = video?.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle timeline click/drag
  const handleTimelineInteraction = (e) => {
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percentage / 100) * duration;

    onSeek?.(time);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleTimelineInteraction(e);
  };

  const handleMouseMove = (e) => {
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percentage / 100) * duration;

    setHoveredTime(time);
    setHoveredPosition(percentage);

    if (isDragging) {
      handleTimelineInteraction(e);
    }
  };

  const handleMouseLeave = () => {
    setHoveredTime(null);
    setHoveredPosition(null);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleTimelineInteraction(e);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, duration, onSeek]);

  // Filter frames to show every 5th for minimap
  const minimapFrames = frames.filter((_, index) => index % 5 === 0);

  return (
    <div className="sync-timeline">
      {/* Header */}
      <div className="timeline-header">
        <h4>Timeline</h4>
        <TimeDisplay current={currentTime} total={duration} />
      </div>

      {/* Main Timeline */}
      <div
        ref={timelineRef}
        className="timeline-track"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background */}
        <div className="timeline-background" />

        {/* Buffered/loaded indicator (optional) */}
        <div className="timeline-buffered" style={{ width: '100%' }} />

        {/* Progress bar */}
        <div className="timeline-progress" style={{ width: `${progress}%` }} />

        {/* Playhead */}
        <div className="timeline-playhead" style={{ left: `${progress}%` }}>
          <div className="playhead-line" />
          <div className="playhead-handle" />
        </div>

        {/* Frame markers */}
        {frames.map((frame, index) => {
          const position = duration > 0 ? (frame.timestamp / duration) * 100 : 0;
          return (
            <TimelineMarker
              key={frame.id || index}
              position={position}
              type="frame"
              isKeyframe={frame.is_keyframe}
              onClick={() => onSeek?.(frame.timestamp)}
            />
          );
        })}

        {/* Hover tooltip */}
        {hoveredTime !== null && (
          <div
            className="timeline-tooltip"
            style={{ left: `${hoveredPosition}%` }}
          >
            {formatTimestamp(hoveredTime)}
          </div>
        )}
      </div>

      {/* Mini-map with thumbnails */}
      {minimapFrames.length > 0 && (
        <div className="timeline-minimap">
          <div className="minimap-track">
            {minimapFrames.map((frame, index) => {
              const position = duration > 0 ? (frame.timestamp / duration) * 100 : 0;
              return (
                <div
                  key={frame.id || index}
                  className="minimap-thumbnail"
                  style={{ left: `${position}%` }}
                  onClick={() => onSeek?.(frame.timestamp)}
                  title={formatTimestamp(frame.timestamp)}
                >
                  {frame.thumbnail_url && (
                    <img
                      src={`http://localhost:4051${frame.thumbnail_url}`}
                      alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
                      loading="lazy"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-marker frame-marker" />
          <span>Frame</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker keyframe-marker" />
          <span>Keyframe</span>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .sync-timeline {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .timeline-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .timeline-track {
    position: relative;
    height: 40px;
    margin-bottom: 1rem;
    cursor: pointer;
    user-select: none;
  }

  .timeline-background {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 8px;
    transform: translateY(-50%);
    background: #e5e7eb;
    border-radius: 4px;
  }

  .timeline-buffered {
    position: absolute;
    top: 50%;
    left: 0;
    height: 8px;
    transform: translateY(-50%);
    background: #d1d5db;
    border-radius: 4px;
    z-index: 1;
  }

  .timeline-progress {
    position: absolute;
    top: 50%;
    left: 0;
    height: 8px;
    transform: translateY(-50%);
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 4px;
    z-index: 2;
    transition: width 0.1s linear;
  }

  .timeline-playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;
  }

  .playhead-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: #2563eb;
    transform: translateX(-50%);
  }

  .playhead-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 14px;
    height: 14px;
    background: #2563eb;
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .timeline-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    transform: translateX(-50%);
    padding: 0.375rem 0.75rem;
    background: #1f2937;
    color: white;
    font-size: 0.75rem;
    font-family: 'Monaco', 'Courier New', monospace;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 20;
  }

  .timeline-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #1f2937;
  }

  .timeline-minimap {
    margin-bottom: 1rem;
    padding: 0.5rem 0;
  }

  .minimap-track {
    position: relative;
    height: 40px;
    background: #f9fafb;
    border-radius: 6px;
    overflow: hidden;
  }

  .minimap-thumbnail {
    position: absolute;
    top: 2px;
    width: 60px;
    height: 36px;
    transform: translateX(-50%);
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .minimap-thumbnail:hover {
    border-color: #2563eb;
    transform: translateX(-50%) scale(1.1);
    z-index: 5;
  }

  .minimap-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .timeline-legend {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .legend-marker {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .legend-marker.frame-marker {
    background-color: #93c5fd;
  }

  .legend-marker.keyframe-marker {
    background-color: #fbbf24;
    border: 1px solid #f59e0b;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sync-timeline {
      padding: 0.75rem;
    }

    .timeline-track {
      height: 32px;
    }

    .minimap-thumbnail {
      width: 40px;
      height: 24px;
    }

    .timeline-legend {
      flex-wrap: wrap;
    }
  }
`;

export default SyncTimeline;
