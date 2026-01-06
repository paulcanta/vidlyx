import React, { useState } from 'react';
import {
  Image,
  Play,
  Code,
  Monitor,
  ChartBar,
  Camera,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';

/**
 * VisualAnalysis Component
 * Displays captured frames gallery with content breakdown
 */
function VisualAnalysis({ frames = [], onFrameClick, onSeek }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Categorize frames by content type
  const categorizeFrames = () => {
    const categories = {
      code: { label: 'Code snippets', icon: Code, frames: [], color: '#dc2626' },
      ui: { label: 'UI/Interface', icon: Monitor, frames: [], color: '#2563eb' },
      diagram: { label: 'Diagrams/Charts', icon: ChartBar, frames: [], color: '#059669' },
      other: { label: 'Other visuals', icon: Image, frames: [], color: '#6b7280' }
    };

    frames.forEach(frame => {
      const desc = (frame.scene_description || '').toLowerCase();
      const text = (frame.on_screen_text || '').toLowerCase();

      if (desc.includes('code') || text.includes('function') || text.includes('const') || text.includes('import')) {
        categories.code.frames.push(frame);
      } else if (desc.includes('interface') || desc.includes('ui') || desc.includes('screen')) {
        categories.ui.frames.push(frame);
      } else if (desc.includes('diagram') || desc.includes('chart') || desc.includes('graph')) {
        categories.diagram.frames.push(frame);
      } else {
        categories.other.frames.push(frame);
      }
    });

    return Object.entries(categories).filter(([_, cat]) => cat.frames.length > 0);
  };

  const handlePrev = () => {
    setActiveIndex(prev => prev > 0 ? prev - 1 : frames.length - 1);
  };

  const handleNext = () => {
    setActiveIndex(prev => prev < frames.length - 1 ? prev + 1 : 0);
  };

  const handleFrameClick = (frame, index) => {
    setActiveIndex(index);
    if (frame.timestamp !== undefined) {
      onSeek?.(frame.timestamp);
    }
    onFrameClick?.(frame);
  };

  if (frames.length === 0) {
    return (
      <div className="visual-analysis empty">
        <Camera size={32} weight="duotone" />
        <p>No frames captured yet</p>
        <span className="hint">Capture frames while watching to analyze visual content</span>
        <style>{styles}</style>
      </div>
    );
  }

  const categories = categorizeFrames();
  const activeFrame = frames[activeIndex];

  return (
    <div className="visual-analysis">
      <div className="visual-header">
        <div className="header-title">
          <Camera size={16} weight="fill" />
          <span>{frames.length} Frames Captured</span>
        </div>
      </div>

      {/* Frame Gallery */}
      <div className="frame-gallery">
        <div className="gallery-main">
          {activeFrame && (
            <div className="main-frame">
              <img
                src={activeFrame.thumbnail_url || activeFrame.image_url || activeFrame.frame_path}
                alt={`Frame at ${formatTimestamp(activeFrame.timestamp)}`}
              />
              <div className="frame-overlay">
                <button className="nav-btn prev" onClick={handlePrev}>
                  <CaretLeft size={20} weight="bold" />
                </button>
                <button
                  className="play-btn"
                  onClick={() => onSeek?.(activeFrame.timestamp)}
                >
                  <Play size={24} weight="fill" />
                </button>
                <button className="nav-btn next" onClick={handleNext}>
                  <CaretRight size={20} weight="bold" />
                </button>
              </div>
              <div className="frame-time">@ {formatTimestamp(activeFrame.timestamp)}</div>
            </div>
          )}
        </div>

        <div className="gallery-strip">
          {frames.map((frame, index) => (
            <div
              key={frame.id || index}
              className={`strip-frame ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleFrameClick(frame, index)}
            >
              <img
                src={frame.thumbnail_url || frame.image_url || frame.frame_path}
                alt={`Frame ${index + 1}`}
                loading="lazy"
              />
              <span className="strip-time">{formatTimestamp(frame.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Breakdown */}
      {categories.length > 0 && (
        <div className="content-breakdown">
          <div className="breakdown-title">Visual Content Breakdown</div>
          <div className="breakdown-list">
            {categories.map(([key, category]) => {
              const Icon = category.icon;
              return (
                <div
                  key={key}
                  className="breakdown-item"
                  style={{ '--cat-color': category.color }}
                >
                  <Icon size={14} weight="fill" />
                  <span className="item-label">{category.label}:</span>
                  <span className="item-count">{category.frames.length} frames</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .visual-analysis {
    display: flex;
    flex-direction: column;
    background: #f9fafb;
    border-radius: 10px;
    overflow: hidden;
  }

  .visual-analysis.empty {
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #9ca3af;
    gap: 0.5rem;
    min-height: 150px;
    text-align: center;
  }

  .visual-analysis.empty p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .visual-analysis.empty .hint {
    font-size: 0.75rem;
  }

  .visual-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .frame-gallery {
    padding: 1rem;
  }

  .gallery-main {
    margin-bottom: 0.75rem;
  }

  .main-frame {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
  }

  .main-frame img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    display: block;
  }

  .frame-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .main-frame:hover .frame-overlay {
    opacity: 1;
  }

  .nav-btn, .play-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.15s;
    color: #1f2937;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .play-btn {
    width: 48px;
    height: 48px;
  }

  .nav-btn:hover, .play-btn:hover {
    background: white;
    transform: scale(1.1);
  }

  .frame-time {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    font-size: 0.6875rem;
    font-family: 'SF Mono', Monaco, monospace;
    font-weight: 600;
    border-radius: 4px;
  }

  .gallery-strip {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .strip-frame {
    flex-shrink: 0;
    width: 80px;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .strip-frame:hover {
    transform: scale(1.05);
  }

  .strip-frame img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 4px;
    border: 2px solid transparent;
    transition: border-color 0.15s;
  }

  .strip-frame.active img {
    border-color: #2563eb;
  }

  .strip-time {
    display: block;
    text-align: center;
    font-size: 0.625rem;
    font-family: 'SF Mono', Monaco, monospace;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .strip-frame.active .strip-time {
    color: #2563eb;
    font-weight: 600;
  }

  .content-breakdown {
    padding: 0 1rem 1rem;
  }

  .breakdown-title {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #9ca3af;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .breakdown-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--cat-color, #6b7280);
  }

  .item-label {
    color: #374151;
  }

  .item-count {
    color: #6b7280;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .strip-frame {
      width: 64px;
    }
  }
`;

export default VisualAnalysis;
