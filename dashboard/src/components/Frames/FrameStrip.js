import React, { useState, useRef, useEffect } from 'react';
import {
  CaretLeft,
  CaretRight,
  Camera,
  CircleNotch,
  ImageSquare
} from '@phosphor-icons/react';
import FrameThumbnail from './FrameThumbnail';
import FrameCaptureModal from './FrameCaptureModal';
import './FrameStrip.css';

/**
 * FrameStrip Component
 * Horizontal carousel of captured frames at bottom of VideoAnalysis page
 */
function FrameStrip({
  videoId,
  currentTime = 0,
  frames = [],
  onFrameClick,
  onCaptureFrame,
  transcriptSegments = [],
  loading = false
}) {
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedTimestamp, setCapturedTimestamp] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [frames]);

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Handle capture button click
  const handleCaptureClick = () => {
    setCapturedTimestamp(currentTime);
    setShowCaptureModal(true);
  };

  // Handle frame save from modal
  const handleSaveFrame = (frameData) => {
    onCaptureFrame?.(frameData);
    setShowCaptureModal(false);
    setCapturedTimestamp(null);
  };

  // Find linked transcript segments for timestamp (±15 seconds)
  const getLinkedTranscript = (timestamp) => {
    return transcriptSegments.filter(segment => {
      const segmentTime = segment.start_time || segment.timestamp || 0;
      return Math.abs(segmentTime - timestamp) <= 15;
    });
  };

  // Find active frame index
  const activeFrameIndex = frames.findIndex((frame, index) => {
    const nextFrame = frames[index + 1];
    return (
      currentTime >= frame.timestamp &&
      (!nextFrame || currentTime < nextFrame.timestamp)
    );
  });

  if (loading) {
    return (
      <div className="frame-strip loading">
        <CircleNotch size={24} weight="bold" className="spinning" />
        <span>Loading frames...</span>
      </div>
    );
  }

  return (
    <>
      <div className="frame-strip">
        {/* Header */}
        <div className="strip-header">
          <div className="strip-title">
            <ImageSquare size={18} weight="duotone" />
            <span>Frames</span>
            {frames.length > 0 && (
              <span className="frame-count">{frames.length}</span>
            )}
          </div>

          <button
            className="capture-btn"
            onClick={handleCaptureClick}
            title="Capture frame at current timestamp"
          >
            <Camera size={18} weight="fill" />
            <span>Capture</span>
          </button>
        </div>

        {/* Carousel */}
        <div className="strip-carousel">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button className="scroll-btn left" onClick={scrollLeft}>
              <CaretLeft size={20} weight="bold" />
            </button>
          )}

          {/* Frames Container */}
          <div
            className="frames-scroll"
            ref={scrollRef}
            onScroll={checkScroll}
          >
            {frames.length === 0 ? (
              <div className="empty-strip">
                <p>No frames captured yet. Click "Capture" to save interesting moments.</p>
              </div>
            ) : (
              frames.map((frame, index) => (
                <FrameThumbnail
                  key={frame.id || index}
                  frame={frame}
                  isActive={index === activeFrameIndex}
                  onClick={() => onFrameClick?.(frame)}
                />
              ))
            )}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button className="scroll-btn right" onClick={scrollRight}>
              <CaretRight size={20} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Capture Modal */}
      {showCaptureModal && (
        <FrameCaptureModal
          videoId={videoId}
          timestamp={capturedTimestamp}
          linkedTranscript={getLinkedTranscript(capturedTimestamp)}
          onSave={handleSaveFrame}
          onClose={() => {
            setShowCaptureModal(false);
            setCapturedTimestamp(null);
          }}
        />
      )}
    </>
  );
}

export default FrameStrip;
