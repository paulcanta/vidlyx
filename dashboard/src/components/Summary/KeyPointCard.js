import React, { useState } from 'react';
import {
  Lightbulb,
  ChartBar,
  Quotes,
  Lightning,
  Warning,
  CheckCircle,
  Play,
  Copy,
  Check,
  Clock
} from '@phosphor-icons/react';
import { formatTimestamp } from '../../utils/formatters';

/**
 * KeyPointCard Component
 * Individual key point with category, timestamp, and actions
 */
function KeyPointCard({
  point,
  category = 'insight',
  timestamp,
  sectionTitle,
  onSeek,
  onCopy
}) {
  const [copied, setCopied] = useState(false);

  const categoryConfig = getCategoryConfig(category);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(point);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleJump = (e) => {
    e.stopPropagation();
    if (timestamp !== undefined && timestamp !== null) {
      onSeek?.(timestamp);
    }
  };

  return (
    <div
      className="keypoint-card"
      style={{ '--category-color': categoryConfig.color, '--category-bg': categoryConfig.bgColor }}
    >
      {/* Category badge */}
      <div className="keypoint-header">
        <span className="category-badge">
          {categoryConfig.icon}
          <span>{categoryConfig.label}</span>
        </span>

        {timestamp !== undefined && timestamp !== null && (
          <span className="keypoint-time">
            <Clock size={10} />
            @ {formatTimestamp(timestamp)}
          </span>
        )}
      </div>

      {/* Point text */}
      <p className="keypoint-text">{point}</p>

      {/* Section reference */}
      {sectionTitle && (
        <span className="keypoint-section">
          Section: {sectionTitle}
        </span>
      )}

      {/* Actions */}
      <div className="keypoint-actions">
        {timestamp !== undefined && timestamp !== null && (
          <button className="keypoint-action jump-btn" onClick={handleJump}>
            <Play size={12} weight="fill" />
            Jump
          </button>
        )}

        <button className="keypoint-action copy-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={12} weight="bold" />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Get category configuration
function getCategoryConfig(category) {
  const configs = {
    insight: {
      label: 'Insight',
      icon: <Lightbulb size={12} weight="fill" />,
      color: '#7c3aed',
      bgColor: '#f3e8ff'
    },
    fact: {
      label: 'Fact',
      icon: <ChartBar size={12} weight="fill" />,
      color: '#2563eb',
      bgColor: '#dbeafe'
    },
    quote: {
      label: 'Quote',
      icon: <Quotes size={12} weight="fill" />,
      color: '#059669',
      bgColor: '#ecfdf5'
    },
    action: {
      label: 'Action',
      icon: <Lightning size={12} weight="fill" />,
      color: '#dc2626',
      bgColor: '#fef2f2'
    },
    warning: {
      label: 'Warning',
      icon: <Warning size={12} weight="fill" />,
      color: '#d97706',
      bgColor: '#fffbeb'
    },
    tip: {
      label: 'Tip',
      icon: <Lightbulb size={12} weight="fill" />,
      color: '#0891b2',
      bgColor: '#ecfeff'
    },
    concept: {
      label: 'Concept',
      icon: <ChartBar size={12} weight="fill" />,
      color: '#6366f1',
      bgColor: '#e0e7ff'
    },
    pro: {
      label: 'Pro',
      icon: <CheckCircle size={12} weight="fill" />,
      color: '#059669',
      bgColor: '#ecfdf5'
    },
    con: {
      label: 'Con',
      icon: <Warning size={12} weight="fill" />,
      color: '#dc2626',
      bgColor: '#fef2f2'
    },
    step: {
      label: 'Step',
      icon: <Lightning size={12} weight="fill" />,
      color: '#0891b2',
      bgColor: '#ecfeff'
    }
  };

  return configs[category.toLowerCase()] || configs.insight;
}

// Export for filter options
export const POINT_CATEGORIES = [
  { id: 'insight', label: 'Insights', icon: <Lightbulb size={14} weight="fill" /> },
  { id: 'fact', label: 'Facts', icon: <ChartBar size={14} weight="fill" /> },
  { id: 'quote', label: 'Quotes', icon: <Quotes size={14} weight="fill" /> },
  { id: 'action', label: 'Actions', icon: <Lightning size={14} weight="fill" /> },
  { id: 'warning', label: 'Warnings', icon: <Warning size={14} weight="fill" /> }
];

const styles = `
  .keypoint-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.875rem;
    background: white;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
  }

  .keypoint-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .keypoint-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--category-bg);
    color: var(--category-color);
    border-radius: 6px;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .keypoint-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 0.625rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .keypoint-text {
    margin: 0;
    font-size: 0.8125rem;
    color: #374151;
    line-height: 1.55;
    text-align: left;
  }

  .keypoint-section {
    font-size: 0.6875rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .keypoint-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.25rem;
  }

  .keypoint-action {
    display: flex;
    align-items: center;
    gap: 0.1875rem;
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    font-size: 0.625rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .keypoint-action.jump-btn {
    color: #2563eb;
    border-color: #93c5fd;
    background: #eff6ff;
  }

  .keypoint-action.jump-btn:hover {
    background: #dbeafe;
    border-color: #60a5fa;
  }

  .keypoint-action.copy-btn {
    color: #6b7280;
  }

  .keypoint-action.copy-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
if (typeof document !== 'undefined' && !document.querySelector('[data-keypoint-card-styles]')) {
  styleSheet.setAttribute('data-keypoint-card-styles', '');
  document.head.appendChild(styleSheet);
}

export default KeyPointCard;
