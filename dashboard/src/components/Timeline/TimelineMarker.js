import React from 'react';
import { Star } from '@phosphor-icons/react';

/**
 * TimelineMarker Component
 * Renders a marker/dot at a specific position on the timeline
 */
function TimelineMarker({ position, type = 'frame', isKeyframe = false, onClick }) {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <>
      <div
        className={`timeline-marker ${type} ${isKeyframe ? 'keyframe' : ''}`}
        style={{ left: `${position}%` }}
        onClick={handleClick}
        title={isKeyframe ? 'Keyframe' : 'Frame'}
      >
        {isKeyframe && <Star size={8} weight="fill" />}
      </div>
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .timeline-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #93c5fd;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 2;
  }

  .timeline-marker:hover {
    transform: translate(-50%, -50%) scale(1.5);
    background-color: #2563eb;
  }

  .timeline-marker.keyframe {
    width: 10px;
    height: 10px;
    background-color: #fbbf24;
    border: 2px solid #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #78350f;
  }

  .timeline-marker.keyframe:hover {
    transform: translate(-50%, -50%) scale(1.3);
    background-color: #f59e0b;
  }
`;

export default TimelineMarker;
