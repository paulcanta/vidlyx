import React, { useState } from 'react';
import {
  ArrowsClockwise,
  X,
  Warning,
  Camera,
  FileText,
  CircleNotch,
  CheckCircle
} from '@phosphor-icons/react';

/**
 * RegenerationModal Component
 * Confirms regeneration and shows what will be included
 */
function RegenerationModal({
  isOpen,
  onClose,
  onRegenerate,
  frameCount = 0,
  newFramesSinceLastAnalysis = 0,
  lastAnalysisDate = null,
  isRegenerating = false
}) {
  const [regenerateStatus, setRegenerateStatus] = useState(null);

  if (!isOpen) return null;

  const handleRegenerate = async () => {
    try {
      setRegenerateStatus('regenerating');
      await onRegenerate?.();
      setRegenerateStatus('success');
      setTimeout(() => {
        onClose();
        setRegenerateStatus(null);
      }, 1500);
    } catch (err) {
      setRegenerateStatus('error');
      console.error('Regeneration failed:', err);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="regeneration-modal-overlay" onClick={onClose}>
      <div className="regeneration-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-icon">
            <ArrowsClockwise size={24} weight="duotone" />
          </div>
          <h3>Regenerate Analysis</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {regenerateStatus === 'success' ? (
            <div className="status-message success">
              <CheckCircle size={48} weight="fill" />
              <p>Analysis regenerated successfully!</p>
            </div>
          ) : regenerateStatus === 'regenerating' || isRegenerating ? (
            <div className="status-message loading">
              <CircleNotch size={48} weight="bold" className="spinning" />
              <p>Regenerating analysis...</p>
              <span>This may take a minute</span>
            </div>
          ) : (
            <>
              <p className="intro-text">
                Your analysis will be regenerated with:
              </p>

              <div className="include-list">
                <div className="include-item">
                  <FileText size={18} weight="duotone" />
                  <span>Original transcript data</span>
                </div>
                <div className="include-item">
                  <Camera size={18} weight="duotone" />
                  <span>
                    {frameCount} captured frames
                    {newFramesSinceLastAnalysis > 0 && (
                      <span className="new-badge">
                        +{newFramesSinceLastAnalysis} new
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {lastAnalysisDate && (
                <div className="last-analysis">
                  Last analyzed: {formatDate(lastAnalysisDate)}
                </div>
              )}

              <div className="billing-notice">
                <Warning size={16} weight="fill" />
                <span>This action will be charged when billing is enabled</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!regenerateStatus && !isRegenerating && (
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="regenerate-btn" onClick={handleRegenerate}>
              <ArrowsClockwise size={18} />
              Regenerate All
            </button>
          </div>
        )}

        <style>{styles}</style>
      </div>
    </div>
  );
}

const styles = `
  .regeneration-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .regeneration-modal {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 420px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
    overflow: hidden;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #dbeafe;
    border-radius: 10px;
    color: #2563eb;
  }

  .modal-header h3 {
    flex: 1;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    text-align: left;
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
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.15s;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .status-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  .status-message.success {
    color: #059669;
  }

  .status-message.success p {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .status-message.loading {
    color: #2563eb;
  }

  .status-message.loading p {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .status-message.loading span {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .intro-text {
    margin: 0 0 1rem;
    font-size: 0.9375rem;
    color: #374151;
    text-align: left;
  }

  .include-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .include-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #f9fafb;
    border-radius: 8px;
    font-size: 0.9375rem;
    color: #374151;
  }

  .include-item svg {
    color: #6366f1;
  }

  .new-badge {
    margin-left: 0.5rem;
    padding: 0.125rem 0.5rem;
    background: #dcfce7;
    color: #16a34a;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 4px;
  }

  .last-analysis {
    font-size: 0.8125rem;
    color: #9ca3af;
    margin-bottom: 1rem;
    text-align: left;
  }

  .billing-notice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    font-size: 0.8125rem;
    color: #92400e;
  }

  .billing-notice svg {
    color: #d97706;
    flex-shrink: 0;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .cancel-btn {
    padding: 0.625rem 1.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .cancel-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .regenerate-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #2563eb;
    border: none;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.15s;
  }

  .regenerate-btn:hover {
    background: #1d4ed8;
  }
`;

export default RegenerationModal;
