import React, { useState } from 'react';
import {
  Play,
  Clock,
  CaretDown,
  CaretUp,
  Star,
  Copy,
  Check,
  Image
} from '@phosphor-icons/react';
import { formatTimestamp } from '../../utils/formatters';

/**
 * SectionCard Component
 * Individual section card with expandable details
 */
function SectionCard({
  section,
  isActive = false,
  frameCount = 0,
  onSeek,
  onCopy
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Support both snake_case and camelCase from backend
  const startTime = section.start_time ?? section.startTime ?? 0;
  const endTime = section.end_time ?? section.endTime ?? 0;
  const duration = endTime - startTime;
  const isKeySection = section.importance >= 4;

  // Parse key points if available
  const keyPoints = React.useMemo(() => {
    if (!section.key_points) return [];
    try {
      return Array.isArray(section.key_points)
        ? section.key_points
        : JSON.parse(section.key_points || '[]');
    } catch {
      return [];
    }
  }, [section.key_points]);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const text = `${section.title}\n${formatTimestamp(startTime)} - ${formatTimestamp(endTime)}\n\n${section.summary || section.transcript_text || ''}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    onSeek?.(startTime);
  };

  return (
    <div
      className={`section-card ${isActive ? 'active' : ''} ${isKeySection ? 'key-section' : ''} ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="section-card-header">
        <div className="section-info">
          {isKeySection && (
            <span className="key-badge">
              <Star size={10} weight="fill" />
              KEY
            </span>
          )}
          <h4 className="section-title">{section.title}</h4>
        </div>

        <div className="section-meta">
          <span className="section-time-range">
            {formatTimestamp(startTime)} - {formatTimestamp(endTime)}
          </span>
          <button
            className={`expand-btn ${expanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>
        </div>
      </div>

      {/* Summary preview (always visible) */}
      <p className="section-summary">
        {(section.summary || section.transcript_text || '').substring(0, expanded ? 500 : 120)}
        {!expanded && (section.summary || section.transcript_text || '').length > 120 && '...'}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div className="section-details">
          {/* Key points */}
          {keyPoints.length > 0 && (
            <div className="section-key-points">
              <h5>Key Points</h5>
              <ul>
                {keyPoints.slice(0, 4).map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Frame indicator */}
          {frameCount > 0 && (
            <div className="section-frames-indicator">
              <Image size={14} />
              <span>{frameCount} frame{frameCount !== 1 ? 's' : ''} captured</span>
            </div>
          )}
        </div>
      )}

      {/* Footer with actions */}
      <div className="section-card-footer">
        <button className="section-action play-btn" onClick={handlePlay}>
          <Play size={14} weight="fill" />
          Play
        </button>

        <button className="section-action copy-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={14} weight="bold" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>

        <span className="section-duration">
          <Clock size={12} />
          {formatDuration(duration)}
        </span>
      </div>

      <style>{styles}</style>
    </div>
  );
}

// Format duration in human readable format
function formatDuration(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const styles = `
  .section-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.875rem;
    background: white;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.2s;
  }

  .section-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .section-card.active {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border-color: #3b82f6;
    border-left: 3px solid #2563eb;
    padding-left: calc(0.875rem - 2px);
  }

  .section-card.key-section {
    border: 2px solid #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .section-card.key-section.active {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }

  .section-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .section-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .key-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.1875rem;
    padding: 0.125rem 0.375rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border-radius: 4px;
    font-size: 0.5625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  .section-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    line-height: 1.4;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .section-card.active .section-title {
    color: #1e40af;
  }

  .section-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .section-time-range {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 0.6875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .expand-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .expand-btn.expanded {
    background: #dbeafe;
    color: #2563eb;
  }

  .section-summary {
    margin: 0;
    font-size: 0.8125rem;
    color: #4b5563;
    line-height: 1.55;
  }

  .section-card.active .section-summary {
    color: #374151;
  }

  .section-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid #f3f4f6;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .section-key-points h5 {
    margin: 0 0 0.375rem 0;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-key-points ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .section-key-points li {
    font-size: 0.75rem;
    color: #374151;
    padding-left: 0.875rem;
    position: relative;
    line-height: 1.5;
  }

  .section-key-points li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #6366f1;
    font-weight: bold;
  }

  .section-frames-indicator {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    background: #f0fdf4;
    border-radius: 6px;
    font-size: 0.6875rem;
    color: #15803d;
    font-weight: 500;
    width: fit-content;
  }

  .section-card-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  .section-action {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .section-action.play-btn {
    color: #2563eb;
    border-color: #93c5fd;
    background: #eff6ff;
  }

  .section-action.play-btn:hover {
    background: #dbeafe;
    border-color: #60a5fa;
  }

  .section-action.copy-btn {
    color: #6b7280;
  }

  .section-action.copy-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }

  .section-duration {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: auto;
    font-size: 0.6875rem;
    color: #9ca3af;
    font-weight: 500;
  }

  @media (max-width: 480px) {
    .section-meta {
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .section-card-footer {
      flex-wrap: wrap;
    }
  }
`;

export default SectionCard;
