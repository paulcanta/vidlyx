import React, { useMemo, useState } from 'react';
import {
  Lightbulb,
  ChartBar,
  Quotes,
  Lightning,
  Warning,
  FunnelSimple,
  Clock
} from '@phosphor-icons/react';
import KeyPointCard, { POINT_CATEGORIES } from './KeyPointCard';

/**
 * KeyPointsTab Component
 * Displays key points with category filtering
 */
function KeyPointsTab({
  summary,
  sections = [],
  onSeek
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Combine and categorize all key points
  const allKeyPoints = useMemo(() => {
    const points = [];

    // Add video-level key takeaways
    if (summary?.key_takeaways) {
      const takeaways = Array.isArray(summary.key_takeaways)
        ? summary.key_takeaways
        : safeJsonParse(summary.key_takeaways, []);

      takeaways.forEach((point, i) => {
        points.push({
          id: `overview-${i}`,
          text: point,
          source: 'Overview',
          type: 'video',
          category: detectCategory(point),
          timestamp: null,
          sectionTitle: null
        });
      });
    }

    // Add section-level key points
    sections.forEach(section => {
      if (section.key_points) {
        const sectionPoints = Array.isArray(section.key_points)
          ? section.key_points
          : safeJsonParse(section.key_points, []);

        sectionPoints.forEach((point, i) => {
          points.push({
            id: `${section.id}-${i}`,
            text: point,
            source: section.title || `Section ${section.section_order + 1}`,
            type: 'section',
            category: detectCategory(point),
            timestamp: section.start_time,
            sectionTitle: section.title
          });
        });
      }
    });

    return points;
  }, [summary, sections]);

  // Filter points by category
  const filteredPoints = useMemo(() => {
    if (activeFilter === 'all') return allKeyPoints;
    return allKeyPoints.filter(p => p.category === activeFilter);
  }, [allKeyPoints, activeFilter]);

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts = { all: allKeyPoints.length };
    POINT_CATEGORIES.forEach(cat => {
      counts[cat.id] = allKeyPoints.filter(p => p.category === cat.id).length;
    });
    return counts;
  }, [allKeyPoints]);

  // Empty state
  if (allKeyPoints.length === 0) {
    return (
      <div className="keypoints-empty">
        <div className="empty-icon-wrapper">
          <Lightbulb size={32} weight="duotone" />
        </div>
        <p>No key points available yet</p>
        <span className="empty-hint">Generate a summary to extract key points</span>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="keypoints-tab">
      {/* Header with count */}
      <div className="keypoints-header">
        <div className="keypoints-count">
          <span className="count-number">{allKeyPoints.length}</span>
          <span className="count-label">key points</span>
        </div>
      </div>

      {/* Category filters */}
      <div className="category-filters">
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <FunnelSimple size={14} />
          All
          <span className="filter-count">{categoryCounts.all}</span>
        </button>

        {POINT_CATEGORIES.map(cat => {
          const count = categoryCounts[cat.id] || 0;
          if (count === 0) return null;

          return (
            <button
              key={cat.id}
              className={`filter-btn ${activeFilter === cat.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat.id)}
            >
              {cat.icon}
              {cat.label}
              <span className="filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filtered results info */}
      {activeFilter !== 'all' && (
        <div className="filter-info">
          Showing {filteredPoints.length} {getCategoryLabel(activeFilter).toLowerCase()}
          <button className="clear-filter" onClick={() => setActiveFilter('all')}>
            Clear filter
          </button>
        </div>
      )}

      {/* Key points list */}
      <div className="keypoints-list">
        {filteredPoints.map((point) => (
          <KeyPointCard
            key={point.id}
            point={point.text}
            category={point.category}
            timestamp={point.timestamp}
            sectionTitle={point.sectionTitle}
            onSeek={onSeek}
          />
        ))}
      </div>

      {/* No results for filter */}
      {filteredPoints.length === 0 && activeFilter !== 'all' && (
        <div className="no-filter-results">
          <p>No {getCategoryLabel(activeFilter).toLowerCase()} found</p>
          <button onClick={() => setActiveFilter('all')}>View all key points</button>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

// Safely parse JSON
function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Auto-detect category from point text
function detectCategory(text) {
  const lower = text.toLowerCase();

  // Check for quotes
  if (text.startsWith('"') || text.startsWith("'") || /said|stated|according to/i.test(lower)) {
    return 'quote';
  }

  // Check for warnings
  if (/warning|caution|danger|avoid|don't|beware|risk/i.test(lower)) {
    return 'warning';
  }

  // Check for actions/steps
  if (/^(step |first |then |next |finally |\d+\.|start by|begin with)/i.test(lower)) {
    return 'step';
  }

  // Check for facts/statistics
  if (/\d+%|\$\d+|\d+ (million|billion|thousand|percent)|statistics|data shows/i.test(lower)) {
    return 'fact';
  }

  // Check for tips
  if (/tip:|pro tip|hint:|trick:|shortcut/i.test(lower)) {
    return 'tip';
  }

  // Default to insight
  return 'insight';
}

// Get category label
function getCategoryLabel(categoryId) {
  const cat = POINT_CATEGORIES.find(c => c.id === categoryId);
  return cat?.label || 'Items';
}

const styles = `
  .keypoints-tab {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .keypoints-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1rem;
    gap: 0.5rem;
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

  .keypoints-empty p {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }

  .empty-hint {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .keypoints-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .keypoints-count {
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

  .category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filter-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }

  .filter-btn.active {
    background: #1f2937;
    border-color: #1f2937;
    color: white;
  }

  .filter-btn.active .filter-count {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .filter-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 0.25rem;
    background: #f3f4f6;
    border-radius: 9999px;
    font-size: 0.625rem;
    font-weight: 700;
  }

  .filter-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .clear-filter {
    background: none;
    border: none;
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .clear-filter:hover {
    text-decoration: underline;
  }

  .keypoints-list {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .no-filter-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    color: #9ca3af;
  }

  .no-filter-results p {
    margin: 0;
    font-size: 0.875rem;
  }

  .no-filter-results button {
    background: none;
    border: none;
    color: #2563eb;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
  }

  .no-filter-results button:hover {
    text-decoration: underline;
  }

  @media (max-width: 480px) {
    .category-filters {
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 0.25rem;
    }

    .filter-btn {
      white-space: nowrap;
    }
  }
`;

export default KeyPointsTab;
