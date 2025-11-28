# Task 4 - Subtask 4: Visual Context Panel in Transcript View

## Objective
Show relevant visual context (frames) alongside transcript segments as the video plays.

## Prerequisites
- Task 4 - Subtask 3 completed (Synchronized timeline)
- Frame-segment correlations working

## Instructions

### 1. Create Visual Context Panel
Create `/home/pgc/vidlyx/dashboard/src/components/Transcript/VisualContext.js`:

```jsx
function VisualContext({ videoId, currentTime }) {
  const [contextFrame, setContextFrame] = useState(null);

  useEffect(() => {
    const fetchContext = async () => {
      const response = await api.get(
        `/videos/${videoId}/frames/at/${Math.floor(currentTime)}`
      );
      setContextFrame(response.data);
    };

    fetchContext();
  }, [videoId, Math.floor(currentTime)]);

  if (!contextFrame) return null;

  return (
    <div className="visual-context">
      <div className="context-header">
        <Eye size={16} />
        <span>Visual Context</span>
      </div>

      <div className="context-frame">
        <img src={`/api/frames/${contextFrame.id}/image`} alt="" />
      </div>

      {contextFrame.scene_description && (
        <p className="context-description">
          {contextFrame.scene_description}
        </p>
      )}

      {contextFrame.on_screen_text && (
        <div className="context-text">
          <TextT size={14} />
          <span>{contextFrame.on_screen_text}</span>
        </div>
      )}

      {contextFrame.visual_elements?.length > 0 && (
        <div className="context-elements">
          {contextFrame.visual_elements.map((el, i) => (
            <span key={i} className="element-tag">{el}</span>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. Create API Endpoint for Frame at Time
```javascript
// GET /api/videos/:id/frames/at/:timestamp
router.get('/:id/frames/at/:timestamp', async (req, res) => {
  const timestamp = parseFloat(req.params.timestamp);
  const query = `
    SELECT * FROM frames
    WHERE video_id = $1
      AND timestamp_seconds <= $2
    ORDER BY timestamp_seconds DESC
    LIMIT 1
  `;
  const result = await db.query(query, [req.params.id, timestamp]);
  res.json(result.rows[0] || null);
});
```

### 3. Integrate into Transcript Panel
Update TranscriptPanel to include visual context:

```jsx
function TranscriptPanel({ videoId, currentTime, onSeek }) {
  return (
    <div className="transcript-panel-with-context">
      <div className="transcript-section">
        {/* Existing transcript content */}
        <TranscriptSegments ... />
      </div>

      <div className="context-section">
        <VisualContext videoId={videoId} currentTime={currentTime} />
      </div>
    </div>
  );
}
```

### 4. Style Visual Context
```css
.transcript-panel-with-context {
  display: flex;
  height: 100%;
}

.transcript-section {
  flex: 1;
  overflow-y: auto;
}

.context-section {
  width: 250px;
  border-left: 1px solid var(--border-color);
  padding: var(--space-3);
}

.visual-context {
  position: sticky;
  top: 0;
}

.context-frame img {
  width: 100%;
  border-radius: var(--border-radius-sm);
}

.context-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}

.context-text {
  background: var(--bg-tertiary);
  padding: var(--space-2);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.element-tag {
  display: inline-block;
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: var(--border-radius-full);
  font-size: var(--text-xs);
  margin: 2px;
}
```

### 5. Add Toggle for Context Panel
Allow users to show/hide context panel:

```jsx
const [showContext, setShowContext] = useState(true);

<button onClick={() => setShowContext(!showContext)}>
  {showContext ? 'Hide' : 'Show'} Visual Context
</button>
```

## Verification
1. Play video, visual context updates with playback
2. Scene description matches what's shown
3. On-screen text displays when present
4. Toggle hides/shows context panel

## Next Steps
Proceed to Task 4 - Subtask 5 (Click-to-Seek from Frames)

## Estimated Time
2-3 hours
