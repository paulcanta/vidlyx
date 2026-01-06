import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CircleNotch,
  Warning,
  CaretDown,
  CaretUp,
  Aperture,
  Check
} from '@phosphor-icons/react';
import './VideoAnalysis.css';
import videoService from '../../services/videoService';
import frameService from '../../services/frameService';
import { useTranscript } from '../../hooks/useTranscript';
import { useVideoShortcuts } from '../../hooks/useVideoShortcuts';
import { TranscriptPanel } from '../../components/Transcript';
import { FrameGallery, FrameStrip, FrameCaptureModal } from '../../components/Frames';
import { SummaryPanel } from '../../components/Summary';
import { SelectionToolbar } from '../../components/Save';
import { SelectionProvider } from '../../contexts/SelectionContext';
import { CompactHeader } from '../../components/Common';
import { findSegmentIndexAtTimestamp, scrollToSegment } from '../../utils/videoSeek';

/**
 * VideoAnalysis Page
 * Split-pane layout with compact header and view modes
 */
function VideoAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Video state
  const [video, setVideo] = useState(location.state?.video || null);
  const [loading, setLoading] = useState(!location.state?.video);
  const [error, setError] = useState(null);

  // View mode: 'default' | 'theater' | 'fullscreen'
  const [viewMode, setViewMode] = useState('default');

  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Transcript collapse state (for mobile)
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(false);

  // Refs
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const timeUpdateRef = useRef(null);
  const pageRef = useRef(null);

  // Transcript hook
  const { segments, loading: transcriptLoading, error: transcriptError } = useTranscript(id);

  // Frames state (used by FrameGallery/FrameStrip components)
  const [frames, setFrames] = useState([]);
  const [framesLoading, setFramesLoading] = useState(false);

  // Save creator state
  // eslint-disable-next-line no-unused-vars
  const [showSaveCreator, setShowSaveCreator] = useState(false);

  // Floating capture button state
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureTimestamp, setCaptureTimestamp] = useState(null);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);

  // Polling for status updates
  useEffect(() => {
    if (!video || ['completed', 'failed'].includes(video.analysis_status)) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await videoService.getById(id);
        setVideo(response.data.video);
      } catch (err) {
        console.error('Error polling video status:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, video?.analysis_status]);

  /**
   * Fetch video data
   */
  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await videoService.getById(id);
      setVideo(response.data.video);
    } catch (err) {
      console.error('Error fetching video:', err);
      if (err.response?.status === 404) {
        setError('Video not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to load video');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Fetch frames for timeline
   */
  const fetchFrames = useCallback(async () => {
    try {
      setFramesLoading(true);
      const response = await frameService.getFrames(id);
      setFrames(response.data.frames || []);
    } catch (err) {
      console.error('Error fetching frames:', err);
    } finally {
      setFramesLoading(false);
    }
  }, [id]);

  /**
   * Initialize YouTube IFrame API
   */
  useEffect(() => {
    if (!video?.youtube_id) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          window.onYouTubeIframeAPIReady = resolve;
          return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = resolve;
      });
    };

    const initPlayer = async () => {
      await loadYouTubeAPI();

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: video.youtube_id,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          playsinline: 1,
          controls: 1  // Enable YouTube's native controls
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
          }
        }
      });
    };

    initPlayer();

    timeUpdateRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 100);

    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [video?.youtube_id]);

  // Fetch video if not in state
  useEffect(() => {
    if (!location.state?.video) {
      fetchVideo();
    }
  }, [fetchVideo, location.state?.video]);

  // Frames are now manually captured only - don't auto-fetch
  // useEffect(() => {
  //   if (id) {
  //     fetchFrames();
  //   }
  // }, [id, fetchFrames]);

  // Enable video keyboard shortcuts
  useVideoShortcuts(playerRef, playerRef.current !== null);

  // Keyboard shortcuts for view modes
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'd':
          setViewMode('default');
          break;
        case 't':
          setViewMode('theater');
          break;
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (document.fullscreenElement) {
              document.exitFullscreen();
              setViewMode('default');
            } else {
              document.documentElement.requestFullscreen();
              setViewMode('fullscreen');
            }
          }
          break;
        case 'c':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleFloatingCapture();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime]);

  /**
   * Handle seek to time
   */
  const seekTo = (time) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  /**
   * Handle view mode change
   */
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  /**
   * Handle save
   */
  const handleSave = () => {
    setShowSaveCreator(true);
  };

  /**
   * Handle export (placeholder)
   */
  const handleExport = () => {
    console.log('Export clicked');
    // TODO: Implement export functionality
  };

  /**
   * Handle floating capture button click
   */
  const handleFloatingCapture = () => {
    // Trigger flash animation
    setCaptureFlash(true);
    setCaptureTimestamp(currentTime);

    // Remove flash after animation
    setTimeout(() => {
      setCaptureFlash(false);
      setShowCaptureModal(true);
    }, 300);
  };

  /**
   * Handle frame save from capture modal
   */
  const handleSaveCapture = (frameData) => {
    setFrames(prev => [...prev, {
      ...frameData,
      id: frameData.id || `captured_${Date.now()}`
    }]);
    setShowCaptureModal(false);
    setCaptureTimestamp(null);

    // Show success indicator
    setCaptureSuccess(true);
    setTimeout(() => setCaptureSuccess(false), 2000);
  };

  /**
   * Get linked transcript segments for timestamp (±15 seconds)
   */
  const getLinkedTranscript = (timestamp) => {
    return segments.filter(segment => {
      const segmentTime = segment.start_time || segment.timestamp || 0;
      return Math.abs(segmentTime - timestamp) <= 15;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="video-analysis-page">
        <div className="loading-container">
          <CircleNotch size={48} weight="bold" className="spinning" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="video-analysis-page">
        <div className="error-container">
          <Warning size={48} weight="fill" />
          <h2>{error}</h2>
          <button onClick={() => navigate('/app')} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <SelectionProvider>
      <div
        className={`video-analysis-page view-mode-${viewMode}`}
        ref={pageRef}
      >
        {/* Compact Header */}
        <CompactHeader
          title={video?.title}
          onBack={() => navigate('/app')}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onSave={handleSave}
          onExport={handleExport}
        />

        {/* Main Content - Split Pane Layout */}
        <div className="video-content">
          {/* Left Column: Video + Transcript */}
          <div className="left-column">
            {/* Video Player */}
            <div className="video-player-container">
              <div className="player-wrapper">
                <div ref={playerContainerRef} className="youtube-player"></div>

                {/* Capture Flash Effect */}
                <div className={`capture-flash ${captureFlash ? 'active' : ''}`} />

                {/* Floating Capture Button */}
                <button
                  className={`floating-capture-btn ${captureSuccess ? 'success' : ''}`}
                  onClick={handleFloatingCapture}
                  title="Capture frame (C)"
                >
                  {captureSuccess ? (
                    <>
                      <Check size={18} weight="bold" />
                      <span>Captured!</span>
                    </>
                  ) : (
                    <>
                      <Aperture size={18} weight="fill" />
                      <span>Capture</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transcript Panel */}
            <div className={`transcript-container ${transcriptCollapsed ? 'collapsed' : ''}`}>
              <button
                className="transcript-toggle"
                onClick={() => setTranscriptCollapsed(!transcriptCollapsed)}
              >
                <span>Transcript</span>
                {transcriptCollapsed ? <CaretDown size={16} /> : <CaretUp size={16} />}
              </button>

              {!transcriptCollapsed && (
                <div className="transcript-content">
                  <TranscriptPanel
                    segments={segments}
                    currentTime={currentTime}
                    onSeek={seekTo}
                    loading={transcriptLoading}
                    error={transcriptError}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="right-column">
            <SummaryPanel
              videoId={id}
              currentTime={currentTime}
              totalDuration={duration}
              frames={frames}
              videoTitle={video?.title}
              videoDescription={video?.description}
              videoTags={video?.tags || []}
              transcript={segments.map(s => s.text).join(' ')}
              onSeek={seekTo}
            />
          </div>

          {/* Bottom: Frames Strip */}
          <div className="frames-strip-container">
            <FrameStrip
              videoId={video?.youtube_id}
              currentTime={currentTime}
              frames={frames}
              transcriptSegments={segments}
              loading={framesLoading}
              onFrameClick={(frame) => {
                if (frame.timestamp !== undefined) {
                  seekTo(frame.timestamp);
                  const segmentIndex = findSegmentIndexAtTimestamp(segments, frame.timestamp);
                  if (segmentIndex !== -1) {
                    scrollToSegment(segmentIndex, {
                      behavior: 'smooth',
                      block: 'center'
                    });
                  }
                }
              }}
              onCaptureFrame={(frameData) => {
                console.log('Frame captured:', frameData);
                // Add to frames state (would normally save to backend)
                setFrames(prev => [...prev, {
                  ...frameData,
                  id: frameData.id || `captured_${Date.now()}`
                }]);
              }}
            />
          </div>
        </div>

        {/* Selection Toolbar */}
        <SelectionToolbar onSaveClick={() => setShowSaveCreator(true)} />

        {/* Capture Modal */}
        {showCaptureModal && (
          <FrameCaptureModal
            videoId={video?.youtube_id}
            timestamp={captureTimestamp}
            linkedTranscript={getLinkedTranscript(captureTimestamp)}
            onSave={handleSaveCapture}
            onClose={() => {
              setShowCaptureModal(false);
              setCaptureTimestamp(null);
            }}
          />
        )}
      </div>
    </SelectionProvider>
  );
}

export default VideoAnalysis;
