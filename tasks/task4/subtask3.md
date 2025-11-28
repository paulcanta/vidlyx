# Task 4 - Subtask 3: Synchronized Timeline View

## Objective
Create a unified timeline that shows video progress, transcript, and frames in sync.

## Prerequisites
- Task 4 - Subtask 2 completed (Frame-segment linkage)
- Video player with time updates
- Transcript and frame data available

## Instructions

### 1. Create Timeline Component
Create `/home/pgc/vidlyx/dashboard/src/components/Timeline/SyncTimeline.js`:

```jsx
function SyncTimeline({ video, currentTime, onSeek }) {
  const [transcript, setTranscript] = useState([]);
  const [frames, setFrames] = useState([]);
  const [sections, setSections] = useState([]);

  return (
    <div className="sync-timeline">
      <div className="timeline-header">
        <TimeDisplay current={currentTime} total={video.duration} />
        <div className="timeline-controls">
          <button onClick={() => onSeek(currentTime - 10)}>-10s</button>
          <button onClick={() => onSeek(currentTime + 10)}>+10s</button>
        </div>
      </div>

      <div className="timeline-track">
        {/* Progress bar */}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(currentTime / video.duration) * 100}%` }}
          />
          <div
            className="playhead"
            style={{ left: `${(currentTime / video.duration) * 100}%` }}
          />
        </div>

        {/* Frame markers */}
        <div className="frame-markers">
          {frames.map(frame => (
            <TimelineMarker
              key={frame.id}
              position={(frame.timestamp_seconds / video.duration) * 100}
              type="frame"
              isKeyframe={frame.is_keyframe}
              onClick={() => onSeek(frame.timestamp_seconds)}
            />
          ))}
        </div>

        {/* Section markers */}
        <div className="section-markers">
          {sections.map(section => (
            <TimelineSection
              key={section.id}
              start={(section.start_time / video.duration) * 100}
              end={(section.end_time / video.duration) * 100}
              title={section.title}
              onClick={() => onSeek(section.start_time)}
            />
          ))}
        </div>
      </div>

      {/* Mini-map of frames */}
      <div className="timeline-minimap">
        {frames.filter((_, i) => i % 5 === 0).map(frame => (
          <img
            key={frame.id}
            src={`/api/frames/${frame.id}/thumbnail`}
            style={{ left: `${(frame.timestamp_seconds / video.duration) * 100}%` }}
            onClick={() => onSeek(frame.timestamp_seconds)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. Create Timeline Marker Component
```jsx
function TimelineMarker({ position, type, isKeyframe, hasText, onClick }) {
  return (
    <div
      className={`timeline-marker ${type} ${isKeyframe ? 'keyframe' : ''}`}
      style={{ left: `${position}%` }}
      onClick={onClick}
    >
      {isKeyframe && <Star weight="fill" size={8} />}
    </div>
  );
}
```

### 3. Create Timeline Section Component
```jsx
function TimelineSection({ start, end, title, onClick }) {
  return (
    <div
      className="timeline-section"
      style={{ left: `${start}%`, width: `${end - start}%` }}
      onClick={onClick}
      title={title}
    >
      <span className="section-title">{title}</span>
    </div>
  );
}
```

### 4. Style the Timeline
```css
.sync-timeline {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--space-3);
}

.timeline-track {
  position: relative;
  height: 60px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  margin: var(--space-2) 0;
}

.progress-track {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
}

.playhead {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: var(--shadow-sm);
}

.frame-markers {
  position: absolute;
  bottom: 4px;
  width: 100%;
  height: 20px;
}

.timeline-marker {
  position: absolute;
  width: 2px;
  height: 12px;
  background: var(--text-tertiary);
  cursor: pointer;
}

.timeline-marker.keyframe {
  background: var(--color-warning);
  height: 16px;
}

.timeline-minimap {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  padding: var(--space-2) 0;
}

.timeline-minimap img {
  height: 40px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.timeline-minimap img:hover {
  opacity: 1;
}
```

### 5. Integrate with Video Analysis Page
Add timeline below video player:

```jsx
<div className="video-section">
  <YouTubePlayer ... />
  <PlayerControls ... />
  <SyncTimeline
    video={video}
    currentTime={currentTime}
    onSeek={handleSeek}
  />
</div>
```

## Verification
1. Timeline shows video progress
2. Frame markers visible on timeline
3. Clicking marker seeks video
4. Playhead moves with video playback

## Next Steps
Proceed to Task 4 - Subtask 4 (Visual Context Panel in Transcript View)

## Estimated Time
3-4 hours
