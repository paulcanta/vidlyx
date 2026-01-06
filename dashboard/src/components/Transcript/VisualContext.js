import React, { useState, useEffect, useRef } from 'react';
import { Eye, TextT, Image as ImageIcon, CircleNotch } from '@phosphor-icons/react';

const API_BASE = 'http://localhost:4051/api';

/**
 * VisualContext Component
 * Displays visual context for the current timestamp in the video
 */
function VisualContext({ videoId, currentTime = 0 }) {
  const [frameData, setFrameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedSecond = useRef(-1);

  // Fetch frame data when currentTime changes (debounced to whole seconds)
  useEffect(() => {
    if (!videoId) return;

    const currentSecond = Math.floor(currentTime);

    // Only fetch if the second has changed
    if (currentSecond === lastFetchedSecond.current) {
      return;
    }

    lastFetchedSecond.current = currentSecond;

    const fetchFrameData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/videos/${videoId}/frames/at/${currentSecond}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setFrameData(null);
            setError('No frame data available');
          } else {
            throw new Error('Failed to fetch frame data');
          }
          return;
        }

        const data = await response.json();
        setFrameData(data.frame || null);
      } catch (err) {
        console.error('Error fetching frame data:', err);
        setError('Failed to load visual context');
        setFrameData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFrameData();
  }, [videoId, currentTime]);

  // Loading state
  if (loading && !frameData) {
    return (
      <div className="visual-context">
        <div className="context-header">
          <Eye size={16} weight="duotone" />
          <h4>Visual Context</h4>
        </div>
        <div className="context-loading">
          <CircleNotch size={24} weight="bold" className="spinning" />
          <p>Loading...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Error state (no data available)
  if (error && !frameData) {
    return (
      <div className="visual-context">
        <div className="context-header">
          <Eye size={16} weight="duotone" />
          <h4>Visual Context</h4>
        </div>
        <div className="context-empty">
          <ImageIcon size={32} weight="duotone" />
          <p>No frames available</p>
          <p className="context-hint">Extract frames to see visual context synchronized with the transcript</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // No data state
  if (!frameData) {
    return (
      <div className="visual-context">
        <div className="context-header">
          <Eye size={16} weight="duotone" />
          <h4>Visual Context</h4>
        </div>
        <div className="context-empty">
          <ImageIcon size={32} weight="duotone" />
          <p>No frame data</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="visual-context">
      <div className="context-header">
        <Eye size={16} weight="duotone" />
        <h4>Visual Context</h4>
      </div>

      <div className="context-content">
        {/* Frame Image */}
        {frameData.frame_path && (
          <div className="frame-image-container">
            <img
              src={`${API_BASE}/videos/${videoId}/frames/${frameData.frame_path}`}
              alt={`Frame at ${Math.floor(currentTime)}s`}
              className="frame-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Scene Description */}
        {frameData.scene_description && (
          <div className="context-section">
            <h5>Scene</h5>
            <p className="scene-text">{frameData.scene_description}</p>
          </div>
        )}

        {/* On-screen Text */}
        {frameData.ocr_text && frameData.ocr_text.length > 0 && (
          <div className="context-section">
            <h5>
              <TextT size={14} weight="duotone" />
              On-screen Text
            </h5>
            <div className="text-items">
              {frameData.ocr_text.map((text, index) => (
                <div key={index} className="text-item">
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Elements */}
        {frameData.visual_elements && frameData.visual_elements.length > 0 && (
          <div className="context-section">
            <h5>Visual Elements</h5>
            <div className="element-tags">
              {frameData.visual_elements.map((element, index) => (
                <span key={index} className="element-tag">
                  {element}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp Info */}
        <div className="context-section timestamp-info">
          <span className="timestamp-label">Timestamp:</span>
          <span className="timestamp-value">{Math.floor(currentTime)}s</span>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .visual-context {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-left: 1px solid #e5e7eb;
  }

  .context-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .context-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .context-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .context-loading,
  .context-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    color: #9ca3af;
    gap: 0.5rem;
    text-align: center;
  }

  .context-empty p,
  .context-loading p {
    margin: 0;
    font-size: 0.75rem;
  }

  .context-hint {
    font-size: 0.6875rem;
    color: #9ca3af;
    margin-top: 0.5rem;
  }

  .frame-image-container {
    width: 100%;
    margin-bottom: 0.75rem;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
  }

  .frame-image {
    width: 100%;
    height: auto;
    display: block;
  }

  .context-section {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .context-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .context-section h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .scene-text {
    margin: 0;
    font-size: 0.8125rem;
    color: #374151;
    line-height: 1.5;
  }

  .text-items {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .text-item {
    padding: 0.375rem 0.5rem;
    background: #f3f4f6;
    border-radius: 6px;
    font-size: 0.75rem;
    color: #374151;
    border-left: 2px solid #2563eb;
  }

  .element-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .element-tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 500;
  }

  .timestamp-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.5rem;
  }

  .timestamp-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .timestamp-value {
    font-size: 0.75rem;
    color: #2563eb;
    font-family: 'Monaco', 'Courier New', monospace;
    font-weight: 600;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default VisualContext;
