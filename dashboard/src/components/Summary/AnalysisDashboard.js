import React, { useState, useEffect } from 'react';
import {
  Download,
  ArrowsClockwise,
  Copy,
  Check,
  CircleNotch,
  Sparkle,
  FileText,
  GraduationCap,
  GameController,
  Star as StarIcon,
  Microphone
} from '@phosphor-icons/react';
import { summaryService } from '../../services/summaryService';
import VisualAnalysis from './VisualAnalysis';
import TranscriptAnalysis from './TranscriptAnalysis';
import QualityAssessment from './QualityAssessment';
import RelatedTopics from './RelatedTopics';
import RegenerationModal from './RegenerationModal';
import { detectVideoType } from './VideoTypeDetector';
import { GeneratingOverlay } from '../Loading';

/**
 * AnalysisDashboard Component
 * Full Analysis tab with comprehensive dashboard layout
 */
function AnalysisDashboard({
  videoId,
  frames = [],
  transcript = '',
  duration = 0,
  videoTitle = '',
  videoDescription = '',
  videoTags = [],
  onSeek,
  onFrameClick
}) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect video type
  const videoType = detectVideoType({
    title: videoTitle,
    description: videoDescription,
    tags: videoTags,
    transcript
  });

  // Fetch comprehensive analysis
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!videoId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await summaryService.getComprehensiveAnalysis(videoId);
        setAnalysis(response.data);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Failed to fetch analysis:', err);
          setError(err.response?.data?.message || 'Failed to load analysis');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [videoId]);

  // Generate analysis
  const handleGenerate = async () => {
    if (!videoId) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await summaryService.generateComprehensiveAnalysis(videoId);
      setAnalysis(response.data);
    } catch (err) {
      console.error('Failed to generate analysis:', err);
      setError(err.response?.data?.message || 'Failed to generate analysis');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate analysis
  const handleRegenerate = async () => {
    await handleGenerate();
  };

  // Export as markdown
  const handleExport = () => {
    if (!analysis?.comprehensive_analysis) return;

    const blob = new Blob([analysis.comprehensive_analysis], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${videoId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy all
  const handleCopyAll = async () => {
    if (!analysis?.comprehensive_analysis) return;

    try {
      await navigator.clipboard.writeText(analysis.comprehensive_analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get video type icon
  const getTypeIcon = () => {
    switch (videoType.type) {
      case 'educational': return GraduationCap;
      case 'entertainment': return GameController;
      case 'review': return StarIcon;
      case 'podcast': return Microphone;
      default: return GraduationCap;
    }
  };

  const TypeIcon = getTypeIcon();

  // Calculate metrics from transcript and frames
  const metrics = {
    duration,
    speechPercent: Math.round((transcript.split(/\s+/).length / (duration / 60 * 150)) * 100) || 85,
    visualPercent: frames.length > 0 ? Math.min(Math.round((frames.length / (duration / 60)) * 20), 100) : 0,
    codeMinutes: frames.filter(f =>
      (f.scene_description || '').toLowerCase().includes('code') ||
      (f.on_screen_text || '').includes('function')
    ).length * 2,
    wordCount: transcript.split(/\s+/).filter(w => w.length > 0).length,
    frameCount: frames.length
  };

  // Loading state
  if (loading) {
    return (
      <div className="analysis-dashboard">
        <div className="dashboard-loading">
          <CircleNotch size={32} weight="bold" className="spinning" />
          <p>Loading analysis...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Empty state - no analysis yet
  if (!analysis?.comprehensive_analysis) {
    return (
      <>
        <GeneratingOverlay
          isVisible={generating}
          title="Generating Full Analysis"
          subtitle="Claude AI is creating your comprehensive analysis"
        />
        <div className="analysis-dashboard">
          <div className="dashboard-empty">
            <FileText size={48} weight="duotone" />
            <div className="empty-content">
              <h4>Full Analysis Not Generated</h4>
              <p>Generate a comprehensive analysis dashboard that includes content metrics, visual analysis, transcript insights, and quality assessment.</p>

              {error && (
                <div className="error-message">{error}</div>
              )}

              {!generating && (
                <button className="generate-btn" onClick={handleGenerate}>
                  <Sparkle size={18} weight="fill" />
                  Generate Full Analysis
                </button>
              )}
            </div>
          </div>
          <style>{styles}</style>
        </div>
      </>
    );
  }

  return (
    <div className="analysis-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h3>Full Analysis</h3>
          <span className="video-type-badge" style={{ '--type-color': videoType.color }}>
            <TypeIcon size={14} weight="fill" />
            {videoType.label}
          </span>
        </div>
      </div>

      {/* Dashboard Sections */}
      <div className="dashboard-sections">
        {/* Section 1: Visual Analysis */}
        <div className="analysis-section" style={{ '--section-delay': '0s' }}>
          <VisualAnalysis
            frames={frames}
            onFrameClick={onFrameClick}
            onSeek={onSeek}
          />
        </div>

        {/* Section 2: Transcript Analysis */}
        <div className="analysis-section" style={{ '--section-delay': '0.1s' }}>
          <TranscriptAnalysis
            wordCount={metrics.wordCount}
            transcript={transcript}
            glossary={analysis.glossary || []}
            speakers={analysis.speakers || []}
          />
        </div>

        {/* Section 3: Quality Assessment */}
        <div className="analysis-section" style={{ '--section-delay': '0.2s' }}>
          <QualityAssessment
            contentQuality={analysis.quality?.content || 8}
            productionValue={analysis.quality?.production || 7}
            informationDensity={analysis.quality?.density || 8}
            practicalValue={analysis.quality?.practical || 9}
            suitableFor={analysis.suitableFor || []}
            notIdealFor={analysis.notIdealFor || []}
            videoType={videoType.type}
          />
        </div>

        {/* Section 4: Related Topics */}
        <div className="analysis-section" style={{ '--section-delay': '0.3s' }}>
          <RelatedTopics
            topics={analysis.relatedTopics || []}
            videoType={videoType.type}
          />
        </div>
      </div>

      {/* Actions Footer */}
      <div className="dashboard-actions">
        <button className="action-btn icon-only" onClick={handleExport} title="Export Analysis">
          <Download size={18} />
          <span className="tooltip">Export</span>
        </button>
        <button className="action-btn icon-only" onClick={() => setShowRegenerationModal(true)} title="Regenerate Analysis">
          <ArrowsClockwise size={18} />
          <span className="tooltip">Regenerate</span>
        </button>
        <button className="action-btn icon-only" onClick={handleCopyAll} title="Copy All">
          {copied ? (
            <Check size={18} weight="bold" />
          ) : (
            <Copy size={18} />
          )}
          <span className="tooltip">{copied ? 'Copied!' : 'Copy All'}</span>
        </button>
      </div>

      <div className="billing-notice">
        Regeneration will be charged when billing is enabled
      </div>

      {/* Regeneration Modal */}
      <RegenerationModal
        isOpen={showRegenerationModal}
        onClose={() => setShowRegenerationModal(false)}
        onRegenerate={handleRegenerate}
        frameCount={frames.length}
        newFramesSinceLastAnalysis={0}
        lastAnalysisDate={analysis?.updated_at}
        isRegenerating={generating}
      />

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .analysis-dashboard {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    min-height: 0;
  }

  .dashboard-loading,
  .dashboard-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
    gap: 1rem;
    color: #9ca3af;
    flex: 1;
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 400px;
  }

  .empty-content h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .empty-content p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
    text-align: center;
  }

  .generate-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .generate-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .generating-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    background: #f3f4f6;
    border-radius: 8px;
    color: #4b5563;
    font-size: 0.875rem;
  }

  .error-message {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.875rem;
    width: 100%;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .dashboard-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .video-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    background: color-mix(in srgb, var(--type-color) 10%, white);
    color: var(--type-color);
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .dashboard-sections {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 0.25rem;
  }

  .analysis-section {
    opacity: 0;
    transform: translateY(15px);
    animation: fadeSlideIn 0.4s ease forwards;
    animation-delay: var(--section-delay, 0s);
  }

  @keyframes fadeSlideIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dashboard-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
  }

  .action-btn.icon-only {
    padding: 0.625rem;
    width: 40px;
    height: 40px;
  }

  .action-btn .tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 0.375rem 0.625rem;
    background: #1f2937;
    color: white;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s;
  }

  .action-btn .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #1f2937;
  }

  .action-btn:hover .tooltip {
    opacity: 1;
  }

  .action-btn:hover {
    background: #e5e7eb;
    color: #1f2937;
  }

  .billing-notice {
    font-size: 0.6875rem;
    color: #d97706;
    text-align: center;
    padding: 0.5rem;
    background: #fffbeb;
    border-radius: 6px;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .dashboard-actions {
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      justify-content: center;
      min-width: 100px;
    }
  }
`;

export default AnalysisDashboard;
