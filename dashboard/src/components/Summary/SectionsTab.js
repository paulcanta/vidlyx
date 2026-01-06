import React, { useMemo } from 'react';
import { Clock, CircleNotch, ListBullets } from '@phosphor-icons/react';
import SectionCard from './SectionCard';
import TimelineBar from '../Common/TimelineBar';

/**
 * SectionsTab Component
 * Displays video sections with timeline visualization
 */
function SectionsTab({
  sections = [],
  frames = [],
  currentTime = 0,
  totalDuration = 0,
  onSeek,
  loading = false
}) {
  // Helper to get section times (support both snake_case and camelCase)
  const getSectionTimes = (section) => ({
    start: section.start_time ?? section.startTime ?? 0,
    end: section.end_time ?? section.endTime ?? 0
  });

  // Find active section based on currentTime
  const activeSection = useMemo(() => {
    return sections.find(section => {
      const { start, end } = getSectionTimes(section);
      return currentTime >= start && currentTime < end;
    });
  }, [sections, currentTime]);

  // Count frames per section
  const frameCounts = useMemo(() => {
    const counts = {};
    sections.forEach(section => {
      const { start, end } = getSectionTimes(section);
      counts[section.id] = frames.filter(frame =>
        frame.timestamp >= start && frame.timestamp < end
      ).length;
    });
    return counts;
  }, [sections, frames]);

  // Key sections (importance >= 4)
  const keySectionsCount = useMemo(() => {
    return sections.filter(s => s.importance >= 4).length;
  }, [sections]);

  // Loading state
  if (loading) {
    return (
      <div className="sections-loading">
        <CircleNotch size={32} weight="bold" className="spinning" />
        <p>Loading sections...</p>
        <style>{styles}</style>
      </div>
    );
  }

  // Empty state
  if (!sections || sections.length === 0) {
    return (
      <div className="sections-empty">
        <div className="empty-icon-wrapper">
          <ListBullets size={32} weight="duotone" />
        </div>
        <p>No sections available yet</p>
        <span className="empty-hint">Generate a summary to detect video sections</span>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="sections-tab">
      {/* Header */}
      <div className="sections-header">
        <div className="sections-count">
          <span className="count-number">{sections.length}</span>
          <span className="count-label">sections</span>
          {keySectionsCount > 0 && (
            <span className="key-count">
              {keySectionsCount} key
            </span>
          )}
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="sections-timeline">
        <TimelineBar
          sections={sections}
          totalDuration={totalDuration || getSectionTimes(sections[sections.length - 1] || {}).end || 0}
          currentTime={currentTime}
          onSeek={onSeek}
          height={36}
        />
      </div>

      {/* Section cards */}
      <div className="sections-list">
        {sections.map((section, index) => (
          <SectionCard
            key={section.id || index}
            section={section}
            isActive={activeSection?.id === section.id}
            frameCount={frameCounts[section.id] || 0}
            onSeek={onSeek}
          />
        ))}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .sections-tab {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sections-loading,
  .sections-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1rem;
    gap: 0.5rem;
  }

  .sections-loading {
    color: #6b7280;
  }

  .sections-empty {
    color: #9ca3af;
  }

  .empty-icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .empty-icon-wrapper svg {
    color: #9ca3af;
  }

  .sections-empty p {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }

  .empty-hint {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .sections-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sections-count {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .count-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
  }

  .count-label {
    font-size: 0.8125rem;
    color: #6b7280;
    font-weight: 500;
  }

  .key-count {
    display: inline-flex;
    padding: 0.125rem 0.5rem;
    background: linear-gradient(135deg, #f3e8ff, #dbeafe);
    color: #6366f1;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  .sections-timeline {
    background: #f9fafb;
    border-radius: 10px;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .sections-list {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  @media (max-width: 640px) {
    .sections-timeline {
      display: none;
    }
  }
`;

export default SectionsTab;
