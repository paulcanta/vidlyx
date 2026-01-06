import React from 'react';

/**
 * TimelineSection Component
 * Renders a section/span on the timeline with a title
 */
function TimelineSection({ start, end, title, color = '#dbeafe', onClick }) {
  const width = end - start;

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <>
      <div
        className="timeline-section"
        style={{
          left: `${start}%`,
          width: `${width}%`,
          backgroundColor: color
        }}
        onClick={handleClick}
        title={title}
      >
        {title && width > 10 && (
          <span className="section-title">{title}</span>
        )}
      </div>
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .timeline-section {
    position: absolute;
    top: 0;
    height: 100%;
    border-left: 1px solid #93c5fd;
    border-right: 1px solid #93c5fd;
    cursor: pointer;
    transition: opacity 0.2s;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
  }

  .timeline-section:hover {
    opacity: 0.8;
  }

  .section-title {
    font-size: 0.625rem;
    color: #1e40af;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export default TimelineSection;
