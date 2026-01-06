import React, { useState } from 'react';
import { Article, ListBullets, Star, CircleNotch, ChartPieSlice } from '@phosphor-icons/react';
import { useVideoSummary } from '../../hooks/useVideoSummary';
import { useSections } from '../../hooks/useSections';
import OverviewTab from './OverviewTab';
import SectionsTab from './SectionsTab';
import KeyPointsTab from './KeyPointsTab';
import AnalysisDashboard from './AnalysisDashboard';

/**
 * SummaryPanel Component
 * Tabbed interface for viewing video summaries, sections, and key points
 */
function SummaryPanel({
  videoId,
  currentTime = 0,
  totalDuration = 0,
  frames = [],
  videoTitle = '',
  videoDescription = '',
  videoTags = [],
  transcript = '',
  onSeek
}) {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data using hooks
  const { summary, loading: summaryLoading } = useVideoSummary(videoId);
  const { sections, loading: sectionsLoading } = useSections(videoId);

  // Define tabs
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Article
    },
    {
      id: 'sections',
      label: 'Sections',
      icon: ListBullets,
      count: sections.length
    },
    {
      id: 'keypoints',
      label: 'Key Points',
      icon: Star
    },
    {
      id: 'analysis',
      label: 'Full Analysis',
      icon: ChartPieSlice
    }
  ];

  // Loading state for initial load (only show if both are loading AND we have no data yet)
  const isLoading = (summaryLoading || sectionsLoading) && !summary && sections.length === 0;

  if (isLoading) {
    return (
      <div className="summary-panel">
        <div className="panel-header">
          <h3>Summary</h3>
        </div>
        <div className="panel-loading">
          <CircleNotch size={32} weight="bold" className="spinning" />
          <p>Loading summary...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="summary-panel">
      {/* Header */}
      <div className="panel-header">
        <h3>Summary</h3>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} weight={activeTab === tab.id ? 'fill' : 'regular'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="panel-content">
        {activeTab === 'overview' && (
          <OverviewTab
            summary={summary}
            videoId={videoId}
            videoTitle={videoTitle}
            videoDescription={videoDescription}
            videoTags={videoTags}
            transcript={transcript}
            duration={totalDuration}
            frames={frames}
          />
        )}
        {activeTab === 'sections' && (
          <SectionsTab
            sections={sections}
            frames={frames}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onSeek={onSeek}
            loading={sectionsLoading}
          />
        )}
        {activeTab === 'keypoints' && (
          <KeyPointsTab
            summary={summary}
            sections={sections}
            onSeek={onSeek}
          />
        )}
        {activeTab === 'analysis' && (
          <AnalysisDashboard
            videoId={videoId}
            frames={frames}
            transcript={transcript}
            duration={totalDuration}
            videoTitle={videoTitle}
            videoDescription={videoDescription}
            videoTags={videoTags}
            onSeek={onSeek}
          />
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .summary-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .panel-tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 1rem;
    background: #fafafa;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6b7280;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    position: relative;
  }

  .tab:hover {
    color: #374151;
    background: rgba(0, 0, 0, 0.02);
  }

  .tab.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
    background: white;
  }

  .tab-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    background: #e5e7eb;
    color: #6b7280;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
  }

  .tab.active .tab-count {
    background: #dbeafe;
    color: #2563eb;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1rem;
    min-height: 0;
  }

  .panel-loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    gap: 0.5rem;
    padding: 3rem 1rem;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default SummaryPanel;
