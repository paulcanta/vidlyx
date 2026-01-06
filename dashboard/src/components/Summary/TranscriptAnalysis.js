import React from 'react';
import {
  FileText,
  Hash,
  BookOpen,
  User,
  Lightning,
  TextAa
} from '@phosphor-icons/react';

/**
 * TranscriptAnalysis Component
 * Displays transcript statistics, terminology glossary, and speaker analysis
 */
function TranscriptAnalysis({
  wordCount = 0,
  uniqueWords = 0,
  technicalTerms = [],
  speakers = [],
  glossary = [],
  transcript = ''
}) {
  // Calculate stats from transcript if not provided
  const stats = React.useMemo(() => {
    if (wordCount > 0) {
      return { wordCount, uniqueWords, technicalCount: technicalTerms.length };
    }

    if (!transcript) return { wordCount: 0, uniqueWords: 0, technicalCount: 0 };

    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const unique = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));

    return {
      wordCount: words.length,
      uniqueWords: unique.size,
      technicalCount: technicalTerms.length
    };
  }, [wordCount, uniqueWords, technicalTerms, transcript]);

  // Calculate speaker percentages
  const speakerStats = React.useMemo(() => {
    if (speakers.length === 0) {
      return [{ name: 'Primary Speaker', percent: 100, isPrimary: true }];
    }

    const total = speakers.reduce((sum, s) => sum + (s.duration || s.words || 1), 0);
    return speakers.map((speaker, index) => ({
      name: speaker.name || `Speaker ${index + 1}`,
      percent: Math.round(((speaker.duration || speaker.words || 1) / total) * 100),
      isPrimary: index === 0
    }));
  }, [speakers]);

  return (
    <div className="transcript-analysis">
      <div className="analysis-header">
        <div className="header-title">
          <FileText size={16} weight="fill" />
          <span>Transcript Analysis</span>
        </div>
      </div>

      {/* Word Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <Hash size={14} />
          <span className="stat-label">Words:</span>
          <span className="stat-value">{stats.wordCount.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <TextAa size={14} />
          <span className="stat-label">Unique:</span>
          <span className="stat-value">{stats.uniqueWords.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <Lightning size={14} />
          <span className="stat-label">Technical:</span>
          <span className="stat-value">{stats.technicalCount}</span>
        </div>
        <div className="stat-item">
          <User size={14} />
          <span className="stat-label">Speakers:</span>
          <span className="stat-value">{speakerStats.length}</span>
        </div>
      </div>

      {/* Terminology Glossary */}
      {glossary.length > 0 && (
        <div className="glossary-section">
          <div className="section-title">
            <BookOpen size={14} weight="fill" />
            <span>Terminology Glossary</span>
          </div>
          <div className="glossary-list">
            {glossary.slice(0, 8).map((term, index) => (
              <div key={index} className="glossary-item">
                <span className="term-name">{term.term}</span>
                <span className="term-definition">{term.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speaker Analysis */}
      <div className="speaker-section">
        <div className="section-title">
          <User size={14} weight="fill" />
          <span>Speaker Analysis</span>
        </div>
        <div className="speaker-bars">
          {speakerStats.map((speaker, index) => (
            <div key={index} className="speaker-bar">
              <div className="speaker-label">
                <span className="speaker-name">
                  {speaker.name}
                  {speaker.isPrimary && <span className="primary-badge">Primary</span>}
                </span>
                <span className="speaker-percent">{speaker.percent}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${speaker.percent}%`,
                    '--bar-color': speaker.isPrimary ? '#2563eb' : '#9ca3af'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .transcript-analysis {
    display: flex;
    flex-direction: column;
    background: #f9fafb;
    border-radius: 10px;
    overflow: hidden;
  }

  .analysis-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: #6b7280;
  }

  .stat-label {
    font-weight: 500;
  }

  .stat-value {
    font-weight: 700;
    color: #374151;
    font-family: 'SF Mono', Monaco, monospace;
  }

  .glossary-section,
  .speaker-section {
    padding: 1rem;
  }

  .glossary-section {
    border-bottom: 1px solid #e5e7eb;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.75rem;
  }

  .glossary-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .glossary-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .term-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .term-definition {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
    text-align: left;
  }

  .speaker-bars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .speaker-bar {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .speaker-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
  }

  .speaker-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .primary-badge {
    padding: 0.125rem 0.375rem;
    background: #dbeafe;
    color: #2563eb;
    font-size: 0.5625rem;
    font-weight: 700;
    text-transform: uppercase;
    border-radius: 4px;
  }

  .speaker-percent {
    font-weight: 600;
    color: #6b7280;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 0.75rem;
  }

  .bar-track {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--bar-color, #2563eb);
    border-radius: 4px;
    transition: width 0.4s ease;
  }

  @media (max-width: 640px) {
    .stats-row {
      gap: 0.5rem 1rem;
    }

    .stat-item {
      font-size: 0.75rem;
    }
  }
`;

export default TranscriptAnalysis;
