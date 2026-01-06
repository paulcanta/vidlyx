import React from 'react';
import {
  Clock,
  Microphone,
  Image,
  Code,
  FileText,
  Hash,
  ChartBar
} from '@phosphor-icons/react';

/**
 * ContentMetrics Component
 * Displays key metrics about the video content in a card grid
 */
function ContentMetrics({
  duration = 0,
  speechPercent = 0,
  visualPercent = 0,
  codeMinutes = 0,
  wordCount = 0,
  frameCount = 0,
  speakerCount = 1,
  videoType = 'educational'
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const metrics = [
    {
      id: 'duration',
      icon: Clock,
      label: 'Duration',
      value: formatDuration(duration),
      subtext: 'total length',
      color: '#6366f1'
    },
    {
      id: 'speech',
      icon: Microphone,
      label: 'Speech',
      value: `${speechPercent}%`,
      subtext: 'talking time',
      color: '#2563eb'
    },
    {
      id: 'visuals',
      icon: Image,
      label: 'Visuals',
      value: `${visualPercent}%`,
      subtext: 'on-screen',
      color: '#059669'
    },
    {
      id: 'code',
      icon: Code,
      label: 'Code',
      value: codeMinutes > 0 ? `${codeMinutes} min` : 'N/A',
      subtext: 'visible',
      color: '#dc2626',
      hidden: videoType !== 'educational' && videoType !== 'tutorial' && codeMinutes === 0
    },
    {
      id: 'words',
      icon: FileText,
      label: 'Words',
      value: wordCount.toLocaleString(),
      subtext: 'transcript',
      color: '#7c3aed'
    },
    {
      id: 'frames',
      icon: Hash,
      label: 'Frames',
      value: frameCount.toString(),
      subtext: 'captured',
      color: '#0891b2'
    }
  ].filter(m => !m.hidden);

  return (
    <div className="content-metrics">
      <div className="metrics-header">
        <ChartBar size={16} weight="fill" />
        <span>Content Metrics</span>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className="metric-card"
              style={{ '--metric-color': metric.color }}
            >
              <div className="metric-icon">
                <Icon size={16} weight="duotone" />
              </div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          );
        })}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .content-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .metrics-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metrics-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.5rem;
    overflow-x: auto;
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    padding: 0.625rem 0.75rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
    flex: 1;
    min-width: 70px;
  }

  .metric-card:hover {
    border-color: var(--metric-color, #6366f1);
    background: white;
  }

  .metric-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: white;
    border-radius: 6px;
    color: var(--metric-color, #6366f1);
  }

  .metric-card:hover .metric-icon {
    background: color-mix(in srgb, var(--metric-color) 10%, white);
  }

  .metric-value {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    font-family: 'SF Mono', Monaco, monospace;
    line-height: 1.2;
  }

  .metric-label {
    font-size: 0.625rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  @media (max-width: 640px) {
    .metrics-grid {
      flex-wrap: wrap;
    }

    .metric-card {
      min-width: 60px;
      padding: 0.5rem;
    }

    .metric-value {
      font-size: 0.875rem;
    }
  }
`;

export default ContentMetrics;
