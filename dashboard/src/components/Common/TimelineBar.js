import React, { useMemo } from 'react';

/**
 * TimelineBar Component
 * Visual timeline showing section distribution across video duration
 */
function TimelineBar({
  sections = [],
  totalDuration = 0,
  currentTime = 0,
  onSeek,
  height = 32
}) {
  // Helper to get section times (support both snake_case and camelCase)
  const getSectionTimes = (section) => ({
    start: section.start_time ?? section.startTime ?? 0,
    end: section.end_time ?? section.endTime ?? 0
  });

  // Calculate section positions and widths
  const sectionBars = useMemo(() => {
    if (!totalDuration || !sections.length) return [];

    return sections.map((section, index) => {
      const { start, end } = getSectionTimes(section);
      const nextSection = sections[index + 1];
      const startPercent = (start / totalDuration) * 100;
      const endTime = end || (nextSection ? getSectionTimes(nextSection).start : totalDuration);
      const widthPercent = ((endTime - start) / totalDuration) * 100;

      return {
        ...section,
        _start: start, // Store for legend click
        startPercent,
        widthPercent,
        isImportant: section.importance >= 4,
        color: getSectionColor(index, section.importance)
      };
    });
  }, [sections, totalDuration]);

  // Current position indicator
  const currentPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const handleClick = (e) => {
    if (!totalDuration || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * totalDuration;
    onSeek(Math.max(0, Math.min(time, totalDuration)));
  };

  if (!sections.length) {
    return (
      <div className="timeline-bar-empty" style={{ height }}>
        <span>No sections available</span>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="timeline-bar-container">
      <div
        className="timeline-bar"
        style={{ height }}
        onClick={handleClick}
        role="slider"
        aria-label="Video timeline"
        aria-valuemin={0}
        aria-valuemax={totalDuration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        {/* Section segments */}
        {sectionBars.map((section, i) => (
          <div
            key={section.id || i}
            className={`timeline-section ${section.isImportant ? 'important' : ''}`}
            style={{
              left: `${section.startPercent}%`,
              width: `${section.widthPercent}%`,
              backgroundColor: section.color
            }}
            title={section.title}
          >
            {section.widthPercent > 8 && (
              <span className="section-label">{truncateLabel(section.title, section.widthPercent)}</span>
            )}
          </div>
        ))}

        {/* Current position indicator */}
        <div
          className="timeline-cursor"
          style={{ left: `${currentPercent}%` }}
        />

        {/* Hover preview */}
        <div className="timeline-hover-track" />
      </div>

      {/* Section legend */}
      <div className="timeline-legend">
        {sectionBars.slice(0, 6).map((section, i) => (
          <button
            key={section.id || i}
            className="legend-item"
            onClick={() => onSeek?.(section._start)}
            style={{ '--legend-color': section.color }}
          >
            <span className="legend-dot" />
            <span className="legend-text">{truncateLabel(section.title, 100)}</span>
          </button>
        ))}
        {sectionBars.length > 6 && (
          <span className="legend-more">+{sectionBars.length - 6} more</span>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

// Get color for section based on index and importance
function getSectionColor(index, importance = 3) {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16'  // lime
  ];

  const baseColor = colors[index % colors.length];

  // Slightly brighter for important sections
  if (importance >= 4) {
    return baseColor;
  }

  return baseColor + 'cc'; // Add transparency for less important
}

// Truncate label based on available width
function truncateLabel(label, widthPercent) {
  if (!label) return '';
  const maxChars = Math.floor(widthPercent / 2);
  if (label.length <= maxChars) return label;
  return label.substring(0, maxChars - 1) + '...';
}

const styles = `
  .timeline-bar-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .timeline-bar-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border-radius: 6px;
    color: #9ca3af;
    font-size: 0.75rem;
  }

  .timeline-bar {
    position: relative;
    background: #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    overflow: hidden;
  }

  .timeline-bar:hover .timeline-hover-track {
    opacity: 1;
  }

  .timeline-hover-track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.05);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  .timeline-section {
    position: absolute;
    top: 2px;
    bottom: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s, filter 0.15s;
    overflow: hidden;
  }

  .timeline-section:hover {
    transform: scaleY(1.1);
    filter: brightness(1.1);
    z-index: 10;
  }

  .timeline-section.important {
    top: 0;
    bottom: 0;
    border-radius: 6px;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }

  .section-label {
    font-size: 0.625rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    padding: 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .timeline-cursor {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 3px;
    background: #1f2937;
    border-radius: 2px;
    transform: translateX(-50%);
    z-index: 20;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    transition: left 0.1s ease-out;
  }

  .timeline-cursor::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #1f2937;
  }

  .timeline-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.1875rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .legend-item:hover {
    background: #f3f4f6;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--legend-color);
    flex-shrink: 0;
  }

  .legend-text {
    font-size: 0.6875rem;
    color: #4b5563;
    font-weight: 500;
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .legend-more {
    font-size: 0.6875rem;
    color: #9ca3af;
    font-style: italic;
  }

  @media (max-width: 640px) {
    .timeline-legend {
      display: none;
    }
  }
`;

export default TimelineBar;
