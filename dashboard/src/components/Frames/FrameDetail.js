import React, { useState } from 'react';
import {
  X,
  Clock,
  Download,
  Copy,
  Check,
  TextAa,
  Eye,
  Tag,
  Image as ImageIcon
} from '@phosphor-icons/react';
import { formatTimestamp } from '../../utils/formatters';

/**
 * FrameDetail Component
 * Modal showing full frame image and complete analysis
 */
function FrameDetail({ frame, onClose, onSeek }) {
  const [copiedText, setCopiedText] = useState(false);

  if (!frame) return null;

  const handleSeek = () => {
    onSeek?.(frame.timestamp);
    onClose?.();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = frame.image_url;
    link.download = `frame-${formatTimestamp(frame.timestamp)}.jpg`;
    link.click();
  };

  const handleCopyText = async () => {
    if (!frame.ocr_text) return;

    try {
      await navigator.clipboard.writeText(frame.ocr_text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="frame-detail-overlay" onClick={handleBackdropClick}>
      <div className="frame-detail-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>Frame Analysis</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Frame Image */}
          <div className="frame-image-section">
            <img
              src={frame.image_url}
              alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
            />
            <div className="image-info">
              <span className="timestamp">
                <Clock size={16} weight="fill" />
                {formatTimestamp(frame.timestamp)}
              </span>
              {frame.is_keyframe && (
                <span className="keyframe-label">Keyframe</span>
              )}
            </div>
          </div>

          {/* Analysis Sections */}
          <div className="analysis-sections">
            {/* Scene Description */}
            {frame.scene_description && (
              <div className="analysis-section">
                <div className="section-header">
                  <Eye size={18} weight="duotone" />
                  <h3>Scene Description</h3>
                </div>
                <p className="section-content">{frame.scene_description}</p>
              </div>
            )}

            {/* Visual Elements */}
            {frame.visual_elements && frame.visual_elements.length > 0 && (
              <div className="analysis-section">
                <div className="section-header">
                  <ImageIcon size={18} weight="duotone" />
                  <h3>Visual Elements</h3>
                </div>
                <div className="elements-list">
                  {frame.visual_elements.map((element, index) => (
                    <span key={index} className="element-tag">
                      {element}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* On-Screen Text (OCR) */}
            {frame.ocr_text && (
              <div className="analysis-section">
                <div className="section-header">
                  <TextAa size={18} weight="duotone" />
                  <h3>On-Screen Text (OCR)</h3>
                  <button
                    className="copy-text-btn"
                    onClick={handleCopyText}
                    title="Copy text"
                  >
                    {copiedText ? (
                      <Check size={16} weight="bold" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <p className="section-content ocr-text">{frame.ocr_text}</p>
              </div>
            )}

            {/* Content Type */}
            {frame.content_type && (
              <div className="analysis-section">
                <div className="section-header">
                  <Tag size={18} weight="duotone" />
                  <h3>Content Type</h3>
                </div>
                <p className="section-content">{frame.content_type}</p>
              </div>
            )}

            {/* No Analysis */}
            {!frame.scene_description &&
              !frame.visual_elements?.length &&
              !frame.ocr_text &&
              !frame.content_type && (
                <div className="no-analysis">
                  <p>No analysis data available for this frame.</p>
                </div>
              )}
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="action-btn secondary" onClick={onClose}>
            Close
          </button>
          <button className="action-btn secondary" onClick={handleDownload}>
            <Download size={18} />
            Save Frame
          </button>
          <button className="action-btn primary" onClick={handleSeek}>
            <Clock size={18} />
            Jump to Time
          </button>
        </div>

        <style>{styles}</style>
      </div>
    </div>
  );
}

const styles = `
  .frame-detail-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    overflow-y: auto;
  }

  .frame-detail-modal {
    background: white;
    border-radius: 12px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    gap: 1.5rem;
  }

  .frame-image-section {
    flex: 0 0 400px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .frame-image-section img {
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .image-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
  }

  .timestamp {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #2563eb;
    font-family: 'Monaco', 'Courier New', monospace;
    font-weight: 600;
  }

  .keyframe-label {
    padding: 0.25rem 0.75rem;
    background: #fef3c7;
    color: #92400e;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .analysis-sections {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .analysis-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #374151;
  }

  .section-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .copy-text-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding: 0.25rem;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .copy-text-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .section-content {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.6;
  }

  .ocr-text {
    font-family: 'Monaco', 'Courier New', monospace;
    background: #f9fafb;
    padding: 0.75rem;
    border-radius: 6px;
    white-space: pre-wrap;
  }

  .elements-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .element-tag {
    padding: 0.375rem 0.75rem;
    background: #f3f4f6;
    color: #374151;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .no-analysis {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #9ca3af;
    text-align: center;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .action-btn.primary {
    background: #2563eb;
    color: white;
  }

  .action-btn.primary:hover {
    background: #1d4ed8;
  }

  .action-btn.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .action-btn.secondary:hover {
    background: #e5e7eb;
  }

  @media (max-width: 768px) {
    .frame-detail-overlay {
      padding: 1rem;
    }

    .modal-content {
      flex-direction: column;
    }

    .frame-image-section {
      flex: 0 0 auto;
    }

    .modal-actions {
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
    }
  }
`;

export default FrameDetail;
