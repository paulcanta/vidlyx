import React, { useState } from 'react';
import {
  X,
  FloppyDisk,
  TextAa,
  Link,
  Clock,
  CircleNotch
} from '@phosphor-icons/react';

/**
 * FrameCaptureModal Component
 * Modal for capturing frames with OCR text and linked transcript
 */
function FrameCaptureModal({
  videoId,
  timestamp,
  linkedTranscript = [],
  onSave,
  onClose
}) {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate thumbnail URL (using YouTube thumbnail as placeholder)
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const frameData = {
        id: `captured_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        videoId,
        timestamp,
        thumbnail_url: thumbnailUrl,
        description: description.trim() || null,
        linkedTranscriptIds: linkedTranscript.map(s => s.id).filter(Boolean),
        capturedAt: new Date().toISOString(),
        is_manual_capture: true
      };

      onSave?.(frameData);
    } catch (err) {
      console.error('Error saving frame:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="capture-modal-overlay" onClick={onClose}>
      <div className="capture-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>
            <Clock size={20} />
            Frame Captured @ {formatTimestamp(timestamp)}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Frame Preview */}
          <div className="frame-preview">
            <img src={thumbnailUrl} alt="Captured frame" />
          </div>

          {/* Linked Transcript */}
          <div className="linked-section">
            <h4>
              <Link size={16} />
              Linked Transcript ({'\u00B1'}15s)
            </h4>
            <div className="transcript-preview">
              {linkedTranscript.length > 0 ? (
                linkedTranscript.slice(0, 5).map((segment, i) => {
                  const segmentTime = segment.start_time || segment.timestamp || 0;
                  const isCurrentTime = Math.abs(segmentTime - timestamp) < 1;
                  return (
                    <div
                      key={segment.id || i}
                      className={`transcript-line ${isCurrentTime ? 'current' : ''}`}
                    >
                      <span className="line-time">
                        [{formatTimestamp(segmentTime)}]
                      </span>
                      <span className="line-text">
                        {segment.text}
                        {isCurrentTime && <span className="current-marker"> {'\u2190'} NOW</span>}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="no-transcript">No transcript segments in this time range</p>
              )}
            </div>
          </div>

          {/* Description Input */}
          <div className="description-section">
            <h4>
              <TextAa size={16} />
              Add Description (optional)
            </h4>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's shown in this frame..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <CircleNotch size={18} className="spinning" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDisk size={18} />
                Save Frame
              </>
            )}
          </button>
        </div>

        <style>{styles}</style>
      </div>
    </div>
  );
}

const styles = `
  .capture-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .capture-modal {
    width: 100%;
    max-width: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .modal-header h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: 6px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .close-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .modal-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .frame-preview {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
  }

  .frame-preview img {
    width: 100%;
    display: block;
  }

  .linked-section,
  .description-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .linked-section h4,
  .description-section h4 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .transcript-preview {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    max-height: 150px;
    overflow-y: auto;
  }

  .transcript-line {
    display: flex;
    gap: 8px;
    padding: 4px 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .transcript-line.current {
    background: #dbeafe;
    margin: 0 -8px;
    padding: 6px 8px;
    border-radius: 4px;
  }

  .line-time {
    flex-shrink: 0;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
  }

  .line-text {
    color: #374151;
  }

  .current-marker {
    color: #2563eb;
    font-weight: 600;
    font-size: 11px;
  }

  .no-transcript {
    margin: 0;
    color: #9ca3af;
    font-size: 13px;
    font-style: italic;
  }

  .description-section textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.15s;
  }

  .description-section textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .cancel-btn,
  .save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .cancel-btn {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .cancel-btn:hover:not(:disabled) {
    background: #f3f4f6;
  }

  .save-btn {
    background: #2563eb;
    border: none;
    color: white;
  }

  .save-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .save-btn:disabled,
  .cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .capture-modal {
      max-height: 90vh;
    }

    .modal-content {
      max-height: 50vh;
    }
  }
`;

export default FrameCaptureModal;
