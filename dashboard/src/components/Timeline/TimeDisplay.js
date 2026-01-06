import React from 'react';
import { formatTimestamp } from '../../utils/formatters';

/**
 * TimeDisplay Component
 * Displays current and total time in MM:SS / MM:SS format
 */
function TimeDisplay({ current = 0, total = 0 }) {
  return (
    <div className="time-display">
      <span className="current-time">{formatTimestamp(current)}</span>
      <span className="separator">/</span>
      <span className="total-time">{formatTimestamp(total)}</span>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .time-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    color: #374151;
    white-space: nowrap;
  }

  .current-time {
    font-weight: 600;
    color: #2563eb;
  }

  .separator {
    color: #9ca3af;
  }

  .total-time {
    color: #6b7280;
  }
`;

export default TimeDisplay;
