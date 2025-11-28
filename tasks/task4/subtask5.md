# Task 4 - Subtask 5: Click-to-Seek from Frames

## Objective
Enable clicking on any frame to seek the video to that timestamp, with visual feedback and smooth transitions.

## Prerequisites
- Task 4 - Subtask 4 completed (Visual context panel)
- Video player seek function working

## Instructions

### 1. Enhance Frame Click Handler
Create unified seek function that works from any frame component:

```javascript
// utils/videoSeek.js
export function seekToFrame(playerRef, frame, options = {}) {
  const {
    offset = 0,      // Seek slightly before frame
    highlight = true, // Highlight frame after seeking
    onSeek
  } = options;

  const targetTime = Math.max(0, frame.timestamp_seconds - offset);

  if (playerRef.current) {
    playerRef.current.seekTo(targetTime);
    onSeek?.(targetTime, frame);
  }
}
```

### 2. Add Visual Feedback on Click
```jsx
function FrameCard({ frame, onSeek, ... }) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onSeek(frame.timestamp_seconds);
    setTimeout(() => setIsClicked(false), 500);
  };

  return (
    <div
      className={`frame-card ${isClicked ? 'clicked' : ''}`}
      onClick={handleClick}
    >
      {/* frame content */}
    </div>
  );
}
```

### 3. Add Click Animation
```css
.frame-card.clicked {
  animation: clickPulse 0.3s ease-out;
}

@keyframes clickPulse {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.frame-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-primary);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.frame-card.clicked::after {
  animation: clickOverlay 0.3s ease-out;
}

@keyframes clickOverlay {
  0% { opacity: 0.3; }
  100% { opacity: 0; }
}
```

### 4. Add Play Icon on Hover
```jsx
<div className="frame-card" onClick={handleClick}>
  <div className="frame-image">
    <img src={...} />
    <div className="play-overlay">
      <Play size={32} weight="fill" />
    </div>
  </div>
</div>
```

```css
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.frame-card:hover .play-overlay {
  opacity: 1;
}

.play-overlay svg {
  color: white;
}
```

### 5. Scroll Transcript to Matching Segment
When seeking from frame, also scroll transcript:

```javascript
const handleFrameSeek = (timestamp) => {
  // Seek video
  playerRef.current.seekTo(timestamp);

  // Find matching transcript segment
  const segmentIndex = transcriptSegments.findIndex(s =>
    timestamp >= s.start && timestamp < s.end
  );

  // Scroll to segment
  if (segmentIndex >= 0) {
    transcriptRefs.current[segmentIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
};
```

### 6. Add Keyboard Shortcut for Frame Navigation
```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
      // Focus frame gallery
      frameGalleryRef.current?.focus();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### 7. Double-Click to Open Frame Detail
```jsx
const handleDoubleClick = () => {
  setSelectedFrame(frame);
  // Opens frame detail modal
};

<div
  className="frame-card"
  onClick={handleClick}
  onDoubleClick={handleDoubleClick}
>
```

## Verification
1. Click frame, video seeks to timestamp
2. Visual feedback shows on click
3. Transcript scrolls to matching segment
4. Double-click opens frame detail
5. Keyboard navigation works

## Next Steps
Task 4 Complete! Proceed to Task 5 - Subtask 1 (Section Detection Algorithm)

## Estimated Time
1-2 hours
