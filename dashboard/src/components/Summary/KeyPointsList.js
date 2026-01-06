import React, { useState, useEffect } from 'react';
import {
  Lightning,
  CheckSquare,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
  Export,
  CaretDown
} from '@phosphor-icons/react';
import keyPointsService from '../../services/keyPointsService';
import { exportKeyPoints, copyToClipboard } from '../../utils/exportKeyPoints';
import { formatTimestamp } from '../../utils/formatters';

/**
 * KeyPointsList Component
 * Displays extracted key points with timestamps, categories, and export options
 */
function KeyPointsList({ videoId, onSeek }) {
  const [keyPoints, setKeyPoints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Fetch key points on mount and when filter changes
  useEffect(() => {
    fetchKeyPoints();
  }, [videoId, filter]);

  const fetchKeyPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await keyPointsService.getByVideoId(videoId, filter);
      setKeyPoints(response.data.keyPoints || []);
    } catch (err) {
      console.error('Failed to fetch key points:', err);
      setError(err.response?.data?.message || 'Failed to load key points');
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    try {
      setExtracting(true);
      setError(null);
      await keyPointsService.extract(videoId);
      await fetchKeyPoints();
    } catch (err) {
      console.error('Failed to extract key points:', err);
      setError(err.response?.data?.message || 'Failed to extract key points');
    } finally {
      setExtracting(false);
    }
  };

  const handleCopy = async (format = 'markdown') => {
    const text = exportKeyPoints(keyPoints, format);
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSeek = (timestamp) => {
    if (onSeek) {
      onSeek(parseFloat(timestamp));
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'action':
        return <CheckSquare size={16} weight="fill" />;
      case 'definition':
        return <BookOpen size={16} weight="fill" />;
      case 'example':
        return <Lightbulb size={16} weight="fill" />;
      default:
        return <Lightning size={16} weight="fill" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'action':
        return 'category-action';
      case 'definition':
        return 'category-definition';
      case 'example':
        return 'category-example';
      default:
        return 'category-insight';
    }
  };

  // Loading state
  if (loading && keyPoints.length === 0) {
    return (
      <div className="keypoints-loading">
        <div className="loading-spinner"></div>
        <p>Loading key points...</p>
        <style>{styles}</style>
      </div>
    );
  }

  // Empty state - no key points yet
  if (!loading && keyPoints.length === 0 && !error) {
    return (
      <div className="keypoints-empty">
        <Lightning size={32} weight="duotone" />
        <p>No key points extracted yet</p>
        <button
          className="extract-button"
          onClick={handleExtract}
          disabled={extracting}
        >
          {extracting ? 'Extracting...' : 'Extract Key Points'}
        </button>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="keypoints-list-container">
      {/* Header with filter and actions */}
      <div className="keypoints-header">
        <div className="filter-group">
          <select
            className="category-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="insight">Insights</option>
            <option value="action">Action Items</option>
            <option value="definition">Definitions</option>
            <option value="example">Examples</option>
          </select>
          <CaretDown size={16} className="filter-icon" />
        </div>

        <div className="action-buttons">
          <button
            className="action-button"
            onClick={handleExtract}
            disabled={extracting}
            title="Re-extract key points"
          >
            <Export size={16} />
            {extracting ? 'Extracting...' : 'Re-extract'}
          </button>
          <button
            className="action-button"
            onClick={() => handleCopy('markdown')}
            disabled={copied}
            title="Copy as Markdown"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Key points list */}
      <div className="keypoints-list">
        {keyPoints.map((kp) => (
          <div key={kp.id} className="keypoint-card">
            <div className="keypoint-header">
              <button
                className="timestamp-button"
                onClick={() => handleSeek(kp.timestamp_seconds)}
                title="Jump to timestamp"
              >
                {formatTimestamp(parseFloat(kp.timestamp_seconds))}
              </button>
              <span className={`category-badge ${getCategoryColor(kp.category)}`}>
                {getCategoryIcon(kp.category)}
                <span>{kp.category}</span>
              </span>
            </div>

            <p className="keypoint-text">{kp.point_text}</p>

            {kp.context && (
              <blockquote className="keypoint-context">
                "{kp.context}"
              </blockquote>
            )}

            {kp.section_title && (
              <div className="keypoint-section">
                Section: {kp.section_title}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .keypoints-list-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .keypoints-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .filter-group {
    position: relative;
    flex: 1;
    max-width: 200px;
  }

  .category-filter {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    font-size: 0.875rem;
    cursor: pointer;
    appearance: none;
  }

  .filter-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #6b7280;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-button:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .extract-button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .extract-button:hover:not(:disabled) {
    background: #2563eb;
  }

  .extract-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #991b1b;
    font-size: 0.875rem;
  }

  .keypoints-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .keypoint-card {
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .keypoint-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .keypoint-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .timestamp-button {
    padding: 0.25rem 0.625rem;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: 'Monaco', 'Courier New', monospace;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .timestamp-button:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }

  .category-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .category-insight {
    background: #dbeafe;
    color: #1e40af;
  }

  .category-action {
    background: #d1fae5;
    color: #065f46;
  }

  .category-definition {
    background: #f3e8ff;
    color: #6b21a8;
  }

  .category-example {
    background: #fed7aa;
    color: #9a3412;
  }

  .keypoint-text {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: #111827;
    margin: 0 0 0.75rem 0;
    font-weight: 500;
  }

  .keypoint-context {
    margin: 0 0 0.75rem 0;
    padding: 0.75rem;
    background: #f9fafb;
    border-left: 3px solid #d1d5db;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #6b7280;
    font-style: italic;
  }

  .keypoint-section {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .keypoints-loading,
  .keypoints-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: #9ca3af;
    gap: 1rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default KeyPointsList;
