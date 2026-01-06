import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Clock,
  Sparkle,
  CircleNotch,
  Timer,
  Target,
  CheckCircle,
  XCircle,
  Lightbulb,
  Star,
  BookOpen,
  TrendUp,
  Info
} from '@phosphor-icons/react';
import { summaryService } from '../../services/summaryService';
import { detectVideoType, getTypeConfig, VIDEO_TYPES } from './VideoTypeDetector';
import ContentMetrics from './ContentMetrics';
import { GeneratingOverlay } from '../Loading';

/**
 * OverviewTab Component
 * Displays adaptive video summary based on detected video type
 */
function OverviewTab({
  summary,
  videoId,
  videoTitle = '',
  videoDescription = '',
  videoTags = [],
  transcript = '',
  duration = 0,
  frames = [],
  onSummaryGenerated
}) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  // Detect video type
  const videoTypeResult = useMemo(() => {
    return detectVideoType({
      title: videoTitle,
      description: videoDescription,
      tags: videoTags,
      transcript: transcript
    });
  }, [videoTitle, videoDescription, videoTags, transcript]);

  const typeConfig = videoTypeResult.typeConfig;

  // Calculate metrics
  const metrics = useMemo(() => {
    const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;
    return {
      duration,
      speechPercent: Math.round((wordCount / (duration / 60 * 150)) * 100) || 85,
      visualPercent: frames.length > 0 ? Math.min(Math.round((frames.length / (duration / 60)) * 20), 100) : 0,
      codeMinutes: frames.filter(f =>
        (f.scene_description || '').toLowerCase().includes('code') ||
        (f.on_screen_text || '').includes('function')
      ).length * 2,
      wordCount,
      frameCount: frames.length
    };
  }, [duration, frames, transcript]);

  // Parse key takeaways if present
  const keyTakeaways = useMemo(() => {
    if (!summary?.key_takeaways) return [];
    try {
      return Array.isArray(summary.key_takeaways)
        ? summary.key_takeaways
        : JSON.parse(summary.key_takeaways || '[]');
    } catch {
      return [];
    }
  }, [summary]);

  // Handle generate summary
  const handleGenerateSummary = async () => {
    if (!videoId) return;

    setGenerating(true);
    setError(null);

    try {
      setProgress('Detecting video sections...');
      await summaryService.detectSections(videoId);

      setProgress('Generating section summaries...');
      await summaryService.generateSummaries(videoId);

      setProgress('Creating full video summary...');
      await summaryService.generateFullSummary(videoId);

      setProgress('Extracting key points...');
      await summaryService.extractKeyPoints(videoId);

      setProgress('Complete!');

      if (onSummaryGenerated) {
        onSummaryGenerated();
      }

      window.location.reload();
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  // Empty state
  if (!summary) {
    return (
      <>
        <GeneratingOverlay
          isVisible={generating}
          title="Generating Summary"
          subtitle="Claude AI is analyzing your video"
        />
        <div className="overview-empty">
          <div className="empty-icon-wrapper">
            <Sparkle size={40} weight="duotone" />
          </div>
          <div className="empty-content">
            <h4>Generate AI Summary</h4>
            <p>Get an intelligent overview with sections, key points, and insights tailored to this video type.</p>

            {error && (
              <div className="error-message">
                <XCircle size={18} weight="fill" />
                <div className="error-content">
                  <strong>Generation Failed</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {!generating && (
              <button className="generate-btn" onClick={handleGenerateSummary}>
                <Sparkle size={18} weight="fill" />
                {error ? 'Retry Generation' : 'Generate Summary'}
              </button>
            )}

            <p className="generation-note">Uses local text analysis (no API required)</p>
          </div>
          <style>{styles}</style>
        </div>
      </>
    );
  }

  // Render type-specific content
  const renderTypeSpecificContent = () => {
    switch (videoTypeResult.type) {
      case 'review':
        return renderReviewContent();
      case 'tutorial':
        return renderTutorialContent();
      case 'podcast':
        return renderPodcastContent();
      default:
        return renderEducationalContent();
    }
  };

  // Educational content layout
  const renderEducationalContent = () => (
    <>
      {keyTakeaways.length > 0 && (
        <section className="content-section learning-objectives">
          <h4>
            <Target size={16} weight="fill" />
            Learning Objectives
          </h4>
          <ul className="objectives-list">
            {keyTakeaways.slice(0, 5).map((objective, i) => (
              <li key={i}>
                <CheckCircle size={16} weight="fill" className="objective-check" />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.estimated_value && (
        <section className="content-section what-youll-learn">
          <h4>
            <Lightbulb size={16} weight="fill" />
            What You'll Learn
          </h4>
          <p>{summary.estimated_value}</p>
        </section>
      )}
    </>
  );

  // Review content layout
  const renderReviewContent = () => {
    // Split takeaways into pros/cons based on keywords
    const pros = keyTakeaways.filter(t =>
      /good|great|excellent|best|love|amazing|pro|advantage|positive/i.test(t)
    );
    const cons = keyTakeaways.filter(t =>
      /bad|poor|worst|hate|terrible|con|disadvantage|negative|downside/i.test(t)
    );

    return (
      <>
        {(pros.length > 0 || cons.length > 0) && (
          <section className="content-section pros-cons">
            <h4>
              <Star size={16} weight="fill" />
              Quick Verdict
            </h4>
            <div className="pros-cons-grid">
              <div className="pros-column">
                <h5><CheckCircle size={14} weight="fill" /> Pros</h5>
                {pros.length > 0 ? (
                  <ul>
                    {pros.slice(0, 4).map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-items">See key points</p>
                )}
              </div>
              <div className="cons-column">
                <h5><XCircle size={14} weight="fill" /> Cons</h5>
                {cons.length > 0 ? (
                  <ul>
                    {cons.slice(0, 4).map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-items">See key points</p>
                )}
              </div>
            </div>
          </section>
        )}
      </>
    );
  };

  // Tutorial content layout
  const renderTutorialContent = () => (
    <>
      {keyTakeaways.length > 0 && (
        <section className="content-section tutorial-steps">
          <h4>
            <BookOpen size={16} weight="fill" />
            Key Steps
          </h4>
          <ol className="steps-list">
            {keyTakeaways.slice(0, 6).map((step, i) => (
              <li key={i}>
                <span className="step-number">{i + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );

  // Podcast content layout
  const renderPodcastContent = () => (
    <>
      {keyTakeaways.length > 0 && (
        <section className="content-section key-insights">
          <h4>
            <TrendUp size={16} weight="fill" />
            Key Insights
          </h4>
          <div className="insights-list">
            {keyTakeaways.slice(0, 5).map((insight, i) => (
              <div key={i} className="insight-item">
                <span className="insight-bullet">{'\u2022'}</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );

  return (
    <div className="overview-tab">
      {/* Type Badge + Quick Facts */}
      <div className="overview-header">
        <div
          className="type-badge"
          style={{
            '--type-color': typeConfig.color,
            '--type-bg': typeConfig.bgColor
          }}
        >
          <span className="type-icon">{getTypeIcon(typeConfig.icon)}</span>
          <span className="type-label">{typeConfig.label}</span>
        </div>

        <div className="quick-facts">
          {summary.difficulty_level && (
            <div className="fact-item">
              <GraduationCap size={14} />
              <span className={`difficulty difficulty-${summary.difficulty_level.toLowerCase()}`}>
                {summary.difficulty_level}
              </span>
            </div>
          )}
          {summary.target_audience && (
            <div className="fact-item">
              <Users size={14} />
              <span>{summary.target_audience}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Metrics */}
      <ContentMetrics
        duration={metrics.duration}
        speechPercent={metrics.speechPercent}
        visualPercent={metrics.visualPercent}
        codeMinutes={metrics.codeMinutes}
        wordCount={metrics.wordCount}
        frameCount={metrics.frameCount}
        videoType={videoTypeResult.type}
      />

      {/* Brief Summary Section */}
      {summary.full_summary && (
        <section className="tldr-section">
          <h4>
            <Timer size={16} weight="fill" />
            Brief Summary
          </h4>
          <p className="tldr-text">{summary.full_summary}</p>
        </section>
      )}

      {/* Topics */}
      {summary.topics && summary.topics.length > 0 && (
        <div className="topics-row">
          {summary.topics.slice(0, 6).map((topic, i) => (
            <span key={i} className="topic-chip">{topic}</span>
          ))}
        </div>
      )}

      {/* Type-specific content */}
      {renderTypeSpecificContent()}

      <style>{styles}</style>
    </div>
  );
}

// Helper to get icon component from name
function getTypeIcon(iconName) {
  const iconMap = {
    GraduationCap: <GraduationCap size={14} weight="fill" />,
    GameController: <Star size={14} weight="fill" />,
    Wrench: <BookOpen size={14} weight="fill" />,
    Star: <Star size={14} weight="fill" />,
    User: <Users size={14} weight="fill" />,
    Microphone: <TrendUp size={14} weight="fill" />,
    Newspaper: <Info size={14} weight="fill" />,
    Code: <Target size={14} weight="fill" />,
    MusicNote: <Star size={14} weight="fill" />,
    FilmStrip: <BookOpen size={14} weight="fill" />
  };
  return iconMap[iconName] || <Star size={14} weight="fill" />;
}

const styles = `
  .overview-tab {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Empty state */
  .overview-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1.5rem;
    text-align: center;
    gap: 1rem;
  }

  .empty-icon-wrapper {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f3e8ff, #dbeafe);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-icon-wrapper svg {
    color: #7c3aed;
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    max-width: 320px;
  }

  .empty-content h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .empty-content p {
    margin: 0;
    font-size: 0.8125rem;
    color: #6b7280;
    line-height: 1.5;
    text-align: left;
  }

  .generate-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  }

  .generate-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
  }

  .generating-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #f3f4f6;
    border-radius: 8px;
    color: #4b5563;
    font-size: 0.8125rem;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .error-message {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.8125rem;
    text-align: left;
    width: 100%;
    max-width: 400px;
  }

  .error-message svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .error-content strong {
    font-weight: 600;
  }

  .error-content span {
    color: #991b1b;
    font-size: 0.75rem;
    line-height: 1.4;
    word-break: break-word;
  }

  .generation-note {
    font-size: 0.6875rem;
    color: #9ca3af;
    margin-top: 0.5rem;
  }

  /* Header with type badge */
  .overview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: var(--type-bg);
    color: var(--type-color);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .quick-facts {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .fact-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .difficulty {
    font-weight: 600;
  }

  .difficulty-beginner { color: #059669; }
  .difficulty-intermediate { color: #d97706; }
  .difficulty-advanced { color: #dc2626; }

  /* Brief Summary Section */
  .tldr-section {
    background: #f8fafc;
    border-radius: 10px;
    padding: 1rem;
  }

  .tldr-section h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.625rem 0;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tldr-text {
    margin: 0;
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.6;
    text-align: left;
  }

  /* Topics */
  .topics-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .topic-chip {
    display: inline-flex;
    padding: 0.25rem 0.625rem;
    background: #e0e7ff;
    color: #4338ca;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 500;
  }

  /* Content sections */
  .content-section {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .content-section h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .content-section h4 svg {
    color: #6b7280;
  }

  .content-section p {
    margin: 0;
    font-size: 0.8125rem;
    color: #4b5563;
    line-height: 1.55;
    text-align: left;
  }

  /* Learning objectives */
  .objectives-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .objectives-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: #374151;
    line-height: 1.5;
    text-align: left;
  }

  .objective-check {
    flex-shrink: 0;
    color: #059669;
    margin-top: 2px;
  }

  /* Pros/Cons grid */
  .pros-cons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .pros-column,
  .cons-column {
    background: #f9fafb;
    border-radius: 8px;
    padding: 0.75rem;
  }

  .pros-column h5,
  .cons-column h5 {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0 0 0.5rem 0;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pros-column h5 {
    color: #059669;
  }

  .cons-column h5 {
    color: #dc2626;
  }

  .pros-column ul,
  .cons-column ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .pros-column li,
  .cons-column li {
    font-size: 0.75rem;
    color: #4b5563;
    line-height: 1.4;
    padding-left: 0.75rem;
    position: relative;
  }

  .pros-column li::before {
    content: '+';
    position: absolute;
    left: 0;
    color: #059669;
    font-weight: 600;
  }

  .cons-column li::before {
    content: '-';
    position: absolute;
    left: 0;
    color: #dc2626;
    font-weight: 600;
  }

  .no-items {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
    margin: 0;
  }

  /* Tutorial steps */
  .steps-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .steps-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
  }

  .step-number {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #dbeafe;
    color: #2563eb;
    border-radius: 50%;
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .step-text {
    font-size: 0.8125rem;
    color: #374151;
    line-height: 1.5;
  }

  /* Insights */
  .insights-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .insight-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: #374151;
    line-height: 1.5;
  }

  .insight-bullet {
    color: #6b7280;
    font-weight: bold;
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .pros-cons-grid {
      grid-template-columns: 1fr;
    }

    .overview-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

export default OverviewTab;
