import { useCallback } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * Hook for video player keyboard shortcuts
 * @param {Object} playerRef - Ref to the YouTube player instance
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 * @returns {Object} - Object with shortcut handlers
 */
export function useVideoShortcuts(playerRef, enabled = true) {
  // Play/Pause
  const handlePlayPause = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const playerState = player.getPlayerState?.();

    if (playerState === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [playerRef]);

  // Seek backward 10 seconds
  const handleSeekBackward = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const currentTime = player.getCurrentTime?.();
    if (currentTime !== undefined) {
      player.seekTo(Math.max(0, currentTime - 10), true);
    }
  }, [playerRef]);

  // Seek forward 10 seconds
  const handleSeekForward = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const currentTime = player.getCurrentTime?.();
    if (currentTime !== undefined) {
      const duration = player.getDuration?.();
      player.seekTo(Math.min(duration || currentTime + 10, currentTime + 10), true);
    }
  }, [playerRef]);

  // Seek backward 5 seconds
  const handleSeekBackward5 = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const currentTime = player.getCurrentTime?.();
    if (currentTime !== undefined) {
      player.seekTo(Math.max(0, currentTime - 5), true);
    }
  }, [playerRef]);

  // Seek forward 5 seconds
  const handleSeekForward5 = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const currentTime = player.getCurrentTime?.();
    if (currentTime !== undefined) {
      const duration = player.getDuration?.();
      player.seekTo(Math.min(duration || currentTime + 5, currentTime + 5), true);
    }
  }, [playerRef]);

  // Mute/Unmute
  const handleToggleMute = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const isMuted = player.isMuted?.();

    if (isMuted) {
      player.unMute();
    } else {
      player.mute();
    }
  }, [playerRef]);

  // Fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!playerRef?.current) return;

    const iframe = playerRef.current.getIframe?.();
    if (!iframe) return;

    if (!document.fullscreenElement) {
      iframe.requestFullscreen?.() ||
        iframe.webkitRequestFullscreen?.() ||
        iframe.mozRequestFullScreen?.() ||
        iframe.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
        document.webkitExitFullscreen?.() ||
        document.mozCancelFullScreen?.() ||
        document.msExitFullscreen?.();
    }
  }, [playerRef]);

  // Decrease playback speed
  const handleDecreaseSpeed = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const currentRate = player.getPlaybackRate?.();
    const availableRates = player.getAvailablePlaybackRates?.() || [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    if (currentRate !== undefined) {
      // Find the next lower rate
      const lowerRates = availableRates.filter(rate => rate < currentRate);
      if (lowerRates.length > 0) {
        const newRate = lowerRates[lowerRates.length - 1];
        player.setPlaybackRate(newRate);
      }
    }
  }, [playerRef]);

  // Increase playback speed
  const handleIncreaseSpeed = useCallback(() => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const currentRate = player.getPlaybackRate?.();
    const availableRates = player.getAvailablePlaybackRates?.() || [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    if (currentRate !== undefined) {
      // Find the next higher rate
      const higherRates = availableRates.filter(rate => rate > currentRate);
      if (higherRates.length > 0) {
        const newRate = higherRates[0];
        player.setPlaybackRate(newRate);
      }
    }
  }, [playerRef]);

  // Seek to percentage (0-9 keys)
  const handleSeekToPercentage = useCallback((percentage) => {
    if (!playerRef?.current) return;

    const player = playerRef.current;
    const duration = player.getDuration?.();

    if (duration !== undefined) {
      const seekTime = (duration * percentage) / 100;
      player.seekTo(seekTime, true);
    }
  }, [playerRef]);

  // Define shortcuts
  const shortcuts = [
    // Play/Pause
    {
      key: ' ',
      callback: handlePlayPause,
      enabled,
      preventDefault: true
    },
    {
      key: 'k',
      callback: handlePlayPause,
      enabled,
      preventDefault: true
    },
    // Seek backward/forward 10s
    {
      key: 'j',
      callback: handleSeekBackward,
      enabled,
      preventDefault: true
    },
    {
      key: 'l',
      callback: handleSeekForward,
      enabled,
      preventDefault: true
    },
    // Seek backward/forward 5s (arrow keys)
    {
      key: 'arrowleft',
      callback: handleSeekBackward5,
      enabled,
      preventDefault: true
    },
    {
      key: 'arrowright',
      callback: handleSeekForward5,
      enabled,
      preventDefault: true
    },
    // Mute
    {
      key: 'm',
      callback: handleToggleMute,
      enabled,
      preventDefault: true
    },
    // Fullscreen
    {
      key: 'f',
      callback: handleToggleFullscreen,
      enabled,
      preventDefault: true
    },
    // Speed control
    {
      key: 'shift+,',
      callback: handleDecreaseSpeed,
      enabled,
      preventDefault: true
    },
    {
      key: 'shift+.',
      callback: handleIncreaseSpeed,
      enabled,
      preventDefault: true
    },
    // Seek to percentage (0-9 keys)
    {
      key: '0',
      callback: () => handleSeekToPercentage(0),
      enabled,
      preventDefault: true
    },
    {
      key: '1',
      callback: () => handleSeekToPercentage(10),
      enabled,
      preventDefault: true
    },
    {
      key: '2',
      callback: () => handleSeekToPercentage(20),
      enabled,
      preventDefault: true
    },
    {
      key: '3',
      callback: () => handleSeekToPercentage(30),
      enabled,
      preventDefault: true
    },
    {
      key: '4',
      callback: () => handleSeekToPercentage(40),
      enabled,
      preventDefault: true
    },
    {
      key: '5',
      callback: () => handleSeekToPercentage(50),
      enabled,
      preventDefault: true
    },
    {
      key: '6',
      callback: () => handleSeekToPercentage(60),
      enabled,
      preventDefault: true
    },
    {
      key: '7',
      callback: () => handleSeekToPercentage(70),
      enabled,
      preventDefault: true
    },
    {
      key: '8',
      callback: () => handleSeekToPercentage(80),
      enabled,
      preventDefault: true
    },
    {
      key: '9',
      callback: () => handleSeekToPercentage(90),
      enabled,
      preventDefault: true
    }
  ];

  // Register all shortcuts
  useKeyboardShortcuts(shortcuts);

  return {
    handlePlayPause,
    handleSeekBackward,
    handleSeekForward,
    handleSeekBackward5,
    handleSeekForward5,
    handleToggleMute,
    handleToggleFullscreen,
    handleDecreaseSpeed,
    handleIncreaseSpeed,
    handleSeekToPercentage
  };
}

export default useVideoShortcuts;
