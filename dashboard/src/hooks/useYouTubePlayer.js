import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for YouTube IFrame Player API
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Player options
 * @returns {object} - Player controls and state
 */
export function useYouTubePlayer(videoId, options = {}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);

  const {
    autoplay = false,
    onReady,
    onStateChange,
    onTimeUpdate
  } = options;

  // Initialize YouTube IFrame API
  useEffect(() => {
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
      if (!containerRef.current || !videoId) return;

      await loadYouTubeAPI();

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            setDuration(event.target.getDuration());
            setVolume(event.target.getVolume());
            setIsMuted(event.target.isMuted());
            onReady?.(event);
          },
          onStateChange: (event) => {
            const isPlayingNow = event.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(isPlayingNow);
            onStateChange?.(event);
          }
        }
      });
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, autoplay, onReady, onStateChange]);

  // Time update interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);

        // Update buffered
        if (playerRef.current.getVideoLoadedFraction) {
          setBuffered(playerRef.current.getVideoLoadedFraction() * 100);
        }
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onTimeUpdate]);

  // Player controls
  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((time, allowSeekAhead = true) => {
    playerRef.current?.seekTo(time, allowSeekAhead);
    setCurrentTime(time);
  }, []);

  const seekRelative = useCallback((delta) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + delta));
    seekTo(newTime);
  }, [currentTime, duration, seekTo]);

  const setVolumeLevel = useCallback((level) => {
    const newLevel = Math.max(0, Math.min(100, level));
    playerRef.current?.setVolume(newLevel);
    setVolume(newLevel);
    if (newLevel > 0 && isMuted) {
      playerRef.current?.unMute();
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      playerRef.current?.unMute();
      setIsMuted(false);
    } else {
      playerRef.current?.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  const setPlaybackRateValue = useCallback((rate) => {
    playerRef.current?.setPlaybackRate(rate);
    setPlaybackRate(rate);
  }, []);

  const getAvailablePlaybackRates = useCallback(() => {
    return playerRef.current?.getAvailablePlaybackRates() || [0.5, 0.75, 1, 1.25, 1.5, 2];
  }, []);

  return {
    containerRef,
    playerRef,
    isReady,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    buffered,
    play,
    pause,
    togglePlay,
    seekTo,
    seekRelative,
    setVolume: setVolumeLevel,
    toggleMute,
    setPlaybackRate: setPlaybackRateValue,
    getAvailablePlaybackRates
  };
}

export default useYouTubePlayer;
