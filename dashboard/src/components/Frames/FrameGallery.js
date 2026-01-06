import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SquaresFour,
  ClockCounterClockwise,
  Funnel,
  Star,
  TextAa,
  Sparkle,
  CircleNotch,
  Warning,
  Camera,
  Trash,
  CameraPlus
} from '@phosphor-icons/react';
import frameService from '../../services/frameService';
import FrameCard from './FrameCard';
import FrameDetail from './FrameDetail';
import FrameTimeline from './FrameTimeline';

/**
 * FrameGallery Component
 * Manual frame capture gallery - users capture frames at interesting moments
 */
function FrameGallery({ videoId, currentTime = 0, onFrameClick }) {
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedFrame, setLastClickedFrame] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('');

  // Load captured frames from localStorage
  useEffect(() => {
    if (!videoId) return;

    const loadCapturedFrames = () => {
      try {
        setLoading(true);
        setError(null);

        const storageKey = `capturedFrames_${videoId}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const frames = JSON.parse(stored);
          setCapturedFrames(frames);
        } else {
          setCapturedFrames([]);
        }
      } catch (err) {
        console.error('Error loading captured frames:', err);
        setError('Failed to load captured frames');
        setCapturedFrames([]);
      } finally {
        setLoading(false);
      }
    };

    loadCapturedFrames();
  }, [videoId]);

  // Save captured frames to localStorage
  const saveCapturedFrames = useCallback((frames) => {
    try {
      const storageKey = `capturedFrames_${videoId}`;
      localStorage.setItem(storageKey, JSON.stringify(frames));
    } catch (err) {
      console.error('Error saving captured frames:', err);
    }
  }, [videoId]);

  // Find active frame based on current time
  const activeFrameIndex = useMemo(() => {
    return capturedFrames.findIndex((frame, index) => {
      const nextFrame = capturedFrames[index + 1];
      return (
        currentTime >= frame.timestamp &&
        (!nextFrame || currentTime < nextFrame.timestamp)
      );
    });
  }, [capturedFrames, currentTime]);

  // Handle frame click with double-click support
  const handleFrameClick = (frame) => {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;

    // Check for double-click (within 300ms and same frame)
    if (
      timeSinceLastClick < 300 &&
      lastClickedFrame?.id === frame.id
    ) {
      // Double-click: Open frame detail modal
      setSelectedFrame(frame);
    } else {
      // Single click: Seek to frame
      onFrameClick?.(frame);
    }

    setLastClickTime(currentTime);
    setLastClickedFrame(frame);
  };

  // Handle seek to timestamp
  const handleSeek = (timestamp) => {
    onFrameClick?.({ timestamp });
  };

  // Capture current frame at current timestamp
  const handleCaptureFrame = async () => {
    if (!videoId || capturing) return;

    try {
      setCapturing(true);
      setCaptureMessage('Capturing frame...');

      // Generate a unique ID for the captured frame
      const frameId = `captured_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create a new captured frame object
      const newFrame = {
        id: frameId,
        timestamp: currentTime,
        capturedAt: new Date().toISOString(),
        videoId: videoId,
        // We'll use a YouTube thumbnail URL based on the timestamp
        // This is a workaround since we don't have actual frame extraction
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        is_manual_capture: true
      };

      // Add to captured frames (sorted by timestamp)
      const updatedFrames = [...capturedFrames, newFrame].sort((a, b) => a.timestamp - b.timestamp);
      setCapturedFrames(updatedFrames);
      saveCapturedFrames(updatedFrames);

      setCaptureMessage('Frame captured!');
      setTimeout(() => {
        setCaptureMessage('');
        setCapturing(false);
      }, 2000);
    } catch (err) {
      console.error('Error capturing frame:', err);
      setCaptureMessage('Failed to capture frame');
      setCapturing(false);
      setTimeout(() => setCaptureMessage(''), 3000);
    }
  };

  // Delete a captured frame
  const handleDeleteFrame = useCallback((frameId) => {
    const updatedFrames = capturedFrames.filter(f => f.id !== frameId);
    setCapturedFrames(updatedFrames);
    saveCapturedFrames(updatedFrames);
  }, [capturedFrames, saveCapturedFrames]);

  // Stats for captured frames
  const stats = useMemo(() => {
    return {
      total: capturedFrames.length
    };
  }, [capturedFrames]);

  // Loading state
  if (loading) {
    return (
      <div className="frame-gallery">
        <div className="gallery-header">
          <h3>Frames</h3>
        </div>
        <div className="gallery-loading">
          <CircleNotch size={32} weight="bold" className="spinning" />
          <p>Loading frames...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="frame-gallery">
        <div className="gallery-header">
          <h3>Frames</h3>
        </div>
        <div className="gallery-error">
          <Warning size={32} weight="duotone" />
          <p>{error}</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Empty state - no captured frames yet
  if (!capturedFrames.length) {
    return (
      <div className="frame-gallery">
        <div className="gallery-header">
          <h3>Captured Frames</h3>
        </div>
        <div className="gallery-empty">
          <Camera size={48} weight="duotone" />
          <p>No frames captured yet</p>
          <p className="empty-hint">Capture interesting moments while watching the video</p>
          {captureMessage ? (
            <div className="capture-status">
              <CircleNotch size={16} weight="bold" className="spinning" />
              <span>{captureMessage}</span>
            </div>
          ) : (
            <button
              className="capture-btn primary"
              onClick={handleCaptureFrame}
              disabled={capturing}
            >
              <CameraPlus size={20} weight="fill" />
              Capture Current Frame
            </button>
          )}
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="frame-gallery">
      {/* Header with Capture Button */}
      <div className="gallery-header">
        <h3>Captured Frames ({stats.total})</h3>
        <div className="header-actions">
          {captureMessage ? (
            <div className="capture-status-inline">
              {capturing && <CircleNotch size={16} weight="bold" className="spinning" />}
              <span>{captureMessage}</span>
            </div>
          ) : (
            <button
              className="capture-btn"
              onClick={handleCaptureFrame}
              disabled={capturing}
              title="Capture frame at current timestamp"
            >
              <CameraPlus size={18} weight="fill" />
              Capture Frame
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="gallery-content">
        <div className="frames-grid">
          {capturedFrames.map((frame, index) => (
            <CapturedFrameCard
              key={frame.id || index}
              frame={frame}
              isActive={index === activeFrameIndex}
              onClick={handleFrameClick}
              onTimestampClick={handleSeek}
              onDelete={handleDeleteFrame}
            />
          ))}
        </div>
      </div>

      {/* Frame Detail Modal */}
      {selectedFrame && (
        <FrameDetail
          frame={selectedFrame}
          onClose={() => setSelectedFrame(null)}
          onSeek={handleSeek}
        />
      )}

      <style>{styles}</style>
    </div>
  );
}

/**
 * CapturedFrameCard Component
 * Individual captured frame card with delete button
 */
function CapturedFrameCard({ frame, isActive, onClick, onTimestampClick, onDelete }) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    onClick?.(frame);
  };

  const handleTimestampClick = (e) => {
    e.stopPropagation();
    onTimestampClick?.(frame.timestamp);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this captured frame?')) {
      onDelete?.(frame.id);
    }
  };

  const formatTimestamp = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`captured-frame-card ${isActive ? 'active' : ''} ${isClicked ? 'clicked' : ''}`}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="frame-thumbnail">
        <img
          src={frame.thumbnail_url || frame.image_url}
          alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
          loading="lazy"
        />

        {/* Delete Button */}
        <button
          className="delete-btn"
          onClick={handleDelete}
          title="Delete captured frame"
        >
          <Trash size={16} weight="fill" />
        </button>
      </div>

      {/* Info */}
      <div className="frame-info">
        <button
          className="frame-timestamp"
          onClick={handleTimestampClick}
          title="Jump to this time"
        >
          {formatTimestamp(frame.timestamp)}
        </button>
      </div>
    </div>
  );
}

const styles = `
  .frame-gallery {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
  }

  .gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(to bottom, #f9fafb, white);
  }

  .gallery-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .capture-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  }

  .capture-btn:hover:not(:disabled) {
    background: #1d4ed8;
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
    transform: translateY(-1px);
  }

  .capture-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  }

  .capture-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .capture-btn.primary {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }

  .capture-status-inline {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: #dbeafe;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1d4ed8;
  }

  .gallery-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .frames-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .gallery-loading,
  .gallery-error,
  .gallery-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: #9ca3af;
    text-align: center;
    padding: 3rem 2rem;
  }

  .gallery-error {
    color: #dc2626;
  }

  .gallery-empty p:first-of-type {
    font-size: 1.125rem;
    font-weight: 500;
    color: #374151;
    margin: 0.5rem 0 0 0;
  }

  .empty-hint {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1rem 0;
  }

  .capture-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: #dbeafe;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #1d4ed8;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Captured Frame Card Styles */
  .captured-frame-card {
    border-radius: 8px;
    overflow: hidden;
    background: white;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .captured-frame-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
  }

  .captured-frame-card.active {
    border-color: #2563eb;
    box-shadow: 0 2px 12px rgba(37, 99, 235, 0.2);
  }

  .captured-frame-card.clicked {
    animation: clickPulse 0.3s ease-out;
  }

  @keyframes clickPulse {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  .captured-frame-card .frame-thumbnail {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    background: #f3f4f6;
    overflow: hidden;
  }

  .captured-frame-card .frame-thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .delete-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(220, 38, 38, 0.9);
    backdrop-filter: blur(4px);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
    z-index: 10;
  }

  .captured-frame-card:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    background: rgba(185, 28, 28, 1);
    transform: scale(1.1);
  }

  .delete-btn:active {
    transform: scale(0.95);
  }

  .captured-frame-card .frame-info {
    padding: 0.5rem;
    background: white;
  }

  .captured-frame-card .frame-timestamp {
    display: inline-block;
    background: none;
    border: none;
    color: #2563eb;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.375rem 0.625rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .captured-frame-card .frame-timestamp:hover {
    background: #dbeafe;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .frames-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .gallery-header {
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }

    .header-actions {
      justify-content: stretch;
    }

    .capture-btn {
      width: 100%;
      justify-content: center;
    }

    .delete-btn {
      opacity: 1;
    }
  }
`;

export default FrameGallery;
