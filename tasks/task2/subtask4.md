# Task 2 - Subtask 4: YouTube IFrame Player Integration

## Objective
Embed YouTube videos using the official IFrame Player API with custom controls.

## Prerequisites
- Task 2 - Subtask 3 completed (Video metadata displaying)
- Video analysis page created

## Instructions

### 1. Load YouTube IFrame API
Create `/home/pgc/vidlyx/dashboard/src/hooks/useYouTubePlayer.js`:

```javascript
import { useEffect, useRef, useState, useCallback } from 'react';

export function useYouTubePlayer(videoId, options = {}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = initPlayer;
  }, []);

  // ... implement initPlayer, event handlers, controls

  return {
    containerRef,
    isReady,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    setPlaybackRate
  };
}
```

### 2. Create YouTube Player Component
Create `/home/pgc/vidlyx/dashboard/src/components/Video/YouTubePlayer.js`:

**Props:**
- videoId (string)
- onTimeUpdate (function)
- onReady (function)
- onStateChange (function)

**Features:**
- Responsive container (16:9 aspect ratio)
- Player instance management
- Event handling for play, pause, seek
- Time update callback for transcript sync

### 3. Create Custom Player Controls
Create `/home/pgc/vidlyx/dashboard/src/components/Video/PlayerControls.js`:

**UI Elements:**
- Play/Pause button (Play/Pause icons from Phosphor)
- Seek bar (input type="range")
- Current time / Duration display
- Volume control (speaker icon + slider)
- Playback speed dropdown (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Fullscreen toggle

**Styling:**
- Overlay on bottom of video
- Semi-transparent background
- Show on hover, hide after 3 seconds
- Always visible when paused

### 4. Implement Seek Bar
Create seek bar with:
- Progress indicator (filled portion)
- Buffer indicator (lighter fill)
- Hover preview time display
- Click to seek
- Drag to seek

```jsx
<div className="seek-bar">
  <div className="seek-progress" style={{ width: `${progress}%` }} />
  <div className="seek-buffer" style={{ width: `${buffered}%` }} />
  <input
    type="range"
    min="0"
    max={duration}
    value={currentTime}
    onChange={(e) => seekTo(Number(e.target.value))}
  />
  <div className="seek-tooltip" style={{ left: `${hoverPosition}%` }}>
    {formatTime(hoverTime)}
  </div>
</div>
```

### 5. Implement Playback Speed Control
Create `/home/pgc/vidlyx/dashboard/src/components/Video/PlaybackSpeed.js`:

```jsx
const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

function PlaybackSpeed({ currentSpeed, onChange }) {
  return (
    <Dropdown
      trigger={<Button variant="ghost">{currentSpeed}x</Button>}
    >
      {speeds.map(speed => (
        <DropdownItem
          key={speed}
          active={currentSpeed === speed}
          onClick={() => onChange(speed)}
        >
          {speed}x
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
```

### 6. Implement Volume Control
Create volume control with:
- Mute/unmute button (SpeakerHigh, SpeakerLow, SpeakerX icons)
- Volume slider (0-100)
- Remember volume preference in localStorage

### 7. Create Time Display Component
Create `/home/pgc/vidlyx/dashboard/src/components/Video/TimeDisplay.js`:

```jsx
function TimeDisplay({ currentTime, duration }) {
  return (
    <span className="time-display">
      {formatDuration(currentTime)} / {formatDuration(duration)}
    </span>
  );
}
```

### 8. Integrate Player into Video Analysis Page
Update `VideoAnalysis.js`:

```jsx
function VideoAnalysis() {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    // This will be used for transcript sync later
  }, []);

  return (
    <div className="video-analysis">
      <div className="video-panel">
        <YouTubePlayer
          videoId={video?.youtube_id}
          onTimeUpdate={handleTimeUpdate}
        />
        <PlayerControls
          currentTime={currentTime}
          duration={video?.duration}
        />
      </div>
      {/* Other panels */}
    </div>
  );
}
```

### 9. Add Keyboard Shortcuts
Implement keyboard controls:
- Space: Play/Pause
- Left Arrow: Seek back 5 seconds
- Right Arrow: Seek forward 5 seconds
- Up Arrow: Volume up
- Down Arrow: Volume down
- M: Mute/Unmute
- F: Fullscreen
- 0-9: Seek to percentage (0 = 0%, 5 = 50%, etc.)

### 10. Style the Player
Create `/home/pgc/vidlyx/dashboard/src/components/Video/Video.css`:

- 16:9 aspect ratio container
- Responsive sizing
- Control bar styling
- Hover states
- Transition animations

## Verification

### Player Loading:
1. Navigate to video analysis page
2. YouTube player should embed and load
3. Video should be playable

### Custom Controls:
1. Play/Pause button works
2. Seek bar shows progress
3. Clicking seek bar jumps to position
4. Volume control works
5. Playback speed changes work

### Keyboard Shortcuts:
1. Press Space to play/pause
2. Arrow keys to seek
3. All shortcuts respond correctly

### Time Updates:
1. Open browser console
2. Verify `onTimeUpdate` callback fires
3. Current time updates smoothly

## Next Steps
Proceed to Task 2 - Subtask 5 (Transcription Extraction and Storage)

## Estimated Time
2-3 hours

## Notes
- YouTube IFrame API is loaded asynchronously
- Handle player errors gracefully
- Some features may be restricted by YouTube (fullscreen, etc.)
- Player state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering)
- Time updates should fire at 250ms intervals for smooth sync
