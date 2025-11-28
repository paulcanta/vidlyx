# Task 3 - Subtask 6: Frame Gallery UI with Analysis Display

## Objective
Build a visual frame gallery that displays extracted frames with their analysis data (OCR text, scene descriptions, visual elements).

## Prerequisites
- Task 3 - Subtask 5 completed (Frame analysis pipeline)
- Frames extracted and analyzed in database
- Backend API endpoints for frames working

## Instructions

### 1. Create Frame Gallery Component
Create `/home/pgc/vidlyx/dashboard/src/components/Frames/FrameGallery.js`:

```jsx
function FrameGallery({ videoId, currentTime, onFrameClick }) {
  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | timeline
  const [filter, setFilter] = useState('all'); // all | keyframes | with-text

  useEffect(() => {
    fetchFrames();
  }, [videoId, filter]);

  const fetchFrames = async () => {
    const params = new URLSearchParams();
    if (filter === 'keyframes') params.append('keyframes', 'true');
    if (filter === 'with-text') params.append('hasText', 'true');

    const response = await api.get(`/videos/${videoId}/frames?${params}`);
    setFrames(response.data);
  };

  // Find frame closest to current time
  const activeFrameIndex = useMemo(() => {
    return frames.findIndex((f, i) => {
      const next = frames[i + 1];
      return currentTime >= f.timestamp_seconds &&
             (!next || currentTime < next.timestamp_seconds);
    });
  }, [frames, currentTime]);

  return (
    <div className="frame-gallery">
      <div className="gallery-header">
        <h3>Frames ({frames.length})</h3>
        <div className="gallery-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Frames</option>
            <option value="keyframes">Key Frames Only</option>
            <option value="with-text">With On-Screen Text</option>
          </select>
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <GridFour />
            </button>
            <button
              className={viewMode === 'timeline' ? 'active' : ''}
              onClick={() => setViewMode('timeline')}
            >
              <List />
            </button>
          </div>
        </div>
      </div>

      <div className={`gallery-content ${viewMode}`}>
        {viewMode === 'grid' ? (
          <FrameGrid
            frames={frames}
            activeIndex={activeFrameIndex}
            onSelect={setSelectedFrame}
            onSeek={onFrameClick}
          />
        ) : (
          <FrameTimeline
            frames={frames}
            activeIndex={activeFrameIndex}
            onSelect={setSelectedFrame}
            onSeek={onFrameClick}
          />
        )}
      </div>

      {selectedFrame && (
        <FrameDetail
          frame={selectedFrame}
          onClose={() => setSelectedFrame(null)}
          onSeek={onFrameClick}
        />
      )}
    </div>
  );
}
```

### 2. Create Frame Grid Component
Create `/home/pgc/vidlyx/dashboard/src/components/Frames/FrameGrid.js`:

```jsx
function FrameGrid({ frames, activeIndex, onSelect, onSeek }) {
  return (
    <div className="frame-grid">
      {frames.map((frame, index) => (
        <FrameCard
          key={frame.id}
          frame={frame}
          isActive={index === activeIndex}
          onClick={() => onSelect(frame)}
          onSeek={() => onSeek(frame.timestamp_seconds)}
        />
      ))}
    </div>
  );
}
```

### 3. Create Frame Card Component
Create `/home/pgc/vidlyx/dashboard/src/components/Frames/FrameCard.js`:

```jsx
function FrameCard({ frame, isActive, onClick, onSeek }) {
  const hasText = frame.on_screen_text && frame.on_screen_text.trim();
  const hasAnalysis = frame.scene_description;

  return (
    <div
      className={`frame-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="frame-image">
        <img
          src={`/api/frames/${frame.id}/image`}
          alt={`Frame at ${formatTimestamp(frame.timestamp_seconds)}`}
          loading="lazy"
        />
        {frame.is_keyframe && (
          <span className="keyframe-badge" title="Key Frame">
            <Star weight="fill" />
          </span>
        )}
      </div>

      <div className="frame-info">
        <button
          className="timestamp"
          onClick={(e) => {
            e.stopPropagation();
            onSeek();
          }}
        >
          {formatTimestamp(frame.timestamp_seconds)}
        </button>

        <div className="frame-indicators">
          {hasText && (
            <span className="indicator text" title="Has on-screen text">
              <TextT />
            </span>
          )}
          {hasAnalysis && (
            <span className="indicator analysis" title="Analyzed">
              <Eye />
            </span>
          )}
        </div>
      </div>

      {frame.content_type && (
        <span className="content-type-badge">
          {frame.content_type}
        </span>
      )}
    </div>
  );
}
```

### 4. Create Frame Detail Modal
Create `/home/pgc/vidlyx/dashboard/src/components/Frames/FrameDetail.js`:

```jsx
function FrameDetail({ frame, onClose, onSeek }) {
  return (
    <Modal onClose={onClose} size="large">
      <div className="frame-detail">
        <div className="frame-detail-image">
          <img
            src={`/api/frames/${frame.id}/image`}
            alt={`Frame at ${formatTimestamp(frame.timestamp_seconds)}`}
          />
        </div>

        <div className="frame-detail-info">
          <div className="frame-detail-header">
            <h3>Frame Analysis</h3>
            <button onClick={() => onSeek(frame.timestamp_seconds)}>
              <Play /> Jump to {formatTimestamp(frame.timestamp_seconds)}
            </button>
          </div>

          {frame.scene_description && (
            <section>
              <h4>Scene Description</h4>
              <p>{frame.scene_description}</p>
            </section>
          )}

          {frame.visual_elements?.length > 0 && (
            <section>
              <h4>Visual Elements</h4>
              <ul className="visual-elements">
                {frame.visual_elements.map((el, i) => (
                  <li key={i}>{el}</li>
                ))}
              </ul>
            </section>
          )}

          {frame.on_screen_text && (
            <section>
              <h4>On-Screen Text</h4>
              <pre className="ocr-text">{frame.on_screen_text}</pre>
              <span className="confidence">
                Confidence: {frame.ocr_confidence?.toFixed(0)}%
              </span>
            </section>
          )}

          <section>
            <h4>Content Type</h4>
            <span className="content-type">{frame.content_type || 'Unknown'}</span>
          </section>

          <div className="frame-actions">
            <button onClick={() => saveFrame(frame)}>
              <BookmarkSimple /> Save Frame
            </button>
            <button onClick={() => copyText(frame.on_screen_text)}>
              <Copy /> Copy Text
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

### 5. Create Frame Timeline View
Create `/home/pgc/vidlyx/dashboard/src/components/Frames/FrameTimeline.js`:

```jsx
function FrameTimeline({ frames, activeIndex, onSelect, onSeek }) {
  const containerRef = useRef(null);

  // Auto-scroll to active frame
  useEffect(() => {
    if (activeIndex >= 0 && containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex];
      activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className="frame-timeline" ref={containerRef}>
      {frames.map((frame, index) => (
        <div
          key={frame.id}
          className={`timeline-item ${index === activeIndex ? 'active' : ''}`}
        >
          <div className="timeline-image" onClick={() => onSelect(frame)}>
            <img
              src={`/api/frames/${frame.id}/image`}
              alt=""
              loading="lazy"
            />
          </div>
          <div className="timeline-content">
            <button
              className="timestamp"
              onClick={() => onSeek(frame.timestamp_seconds)}
            >
              {formatTimestamp(frame.timestamp_seconds)}
            </button>
            {frame.scene_description && (
              <p className="description">{frame.scene_description}</p>
            )}
            {frame.on_screen_text && (
              <p className="ocr-preview">
                <TextT /> {truncate(frame.on_screen_text, 100)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 6. Style the Frame Gallery
Create `/home/pgc/vidlyx/dashboard/src/components/Frames/Frames.css`:

```css
.frame-gallery {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
}

.gallery-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

/* Grid View */
.frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-2);
}

.frame-card {
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.frame-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.frame-card.active {
  ring: 2px solid var(--color-primary);
}

.frame-image {
  position: relative;
  aspect-ratio: 16/9;
}

.frame-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.keyframe-badge {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  background: var(--color-warning);
  color: white;
  padding: 2px 4px;
  border-radius: var(--border-radius-sm);
  font-size: var(--text-xs);
}

.frame-info {
  padding: var(--space-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timestamp {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-primary);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.timestamp:hover {
  text-decoration: underline;
}

.frame-indicators {
  display: flex;
  gap: var(--space-1);
}

.indicator {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.indicator.text { color: var(--color-info); }
.indicator.analysis { color: var(--color-success); }

/* Timeline View */
.frame-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.timeline-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--border-radius-sm);
  transition: background var(--transition-fast);
}

.timeline-item:hover {
  background: var(--bg-tertiary);
}

.timeline-item.active {
  background: var(--color-primary-light);
}

.timeline-image {
  width: 160px;
  flex-shrink: 0;
  cursor: pointer;
}

.timeline-image img {
  width: 100%;
  border-radius: var(--border-radius-sm);
}

.timeline-content {
  flex: 1;
}

.description {
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.ocr-preview {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: var(--space-1);
}

/* Frame Detail Modal */
.frame-detail {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--space-4);
  max-height: 80vh;
}

.frame-detail-image img {
  width: 100%;
  border-radius: var(--border-radius-md);
}

.frame-detail-info {
  overflow-y: auto;
}

.frame-detail-info section {
  margin-bottom: var(--space-4);
}

.frame-detail-info h4 {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.visual-elements {
  list-style: disc;
  padding-left: var(--space-4);
}

.ocr-text {
  background: var(--bg-tertiary);
  padding: var(--space-3);
  border-radius: var(--border-radius-sm);
  white-space: pre-wrap;
  font-size: var(--text-sm);
}
```

### 7. Integrate into Video Analysis Page
Update `VideoAnalysis.js`:

```jsx
function VideoAnalysis() {
  // ... existing code

  return (
    <div className="video-analysis three-panel">
      <div className="panel video-panel">
        <YouTubePlayer ... />
        <PlayerControls ... />
      </div>

      <div className="panel transcript-panel">
        <TranscriptPanel ... />
      </div>

      <div className="panel analysis-panel">
        <FrameGallery
          videoId={video?.id}
          currentTime={currentTime}
          onFrameClick={handleSeek}
        />
      </div>
    </div>
  );
}
```

### 8. Add Frame Filtering Backend
Update frame routes:

```javascript
// GET /api/videos/:id/frames
router.get('/:id/frames', requireAuth, async (req, res) => {
  const { keyframes, hasText, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT * FROM frames
    WHERE video_id = $1
  `;
  const params = [req.params.id];

  if (keyframes === 'true') {
    query += ` AND is_keyframe = TRUE`;
  }

  if (hasText === 'true') {
    query += ` AND on_screen_text IS NOT NULL AND on_screen_text != ''`;
  }

  query += ` ORDER BY timestamp_seconds LIMIT $2 OFFSET $3`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  res.json(result.rows);
});
```

## Verification

### Visual Check:
1. Navigate to video with analyzed frames
2. Frame gallery should show thumbnail grid
3. Click frame to open detail modal
4. Click timestamp to seek video

### Filter Test:
1. Select "Key Frames Only" filter
2. Should show fewer frames
3. Select "With On-Screen Text"
4. Should show only frames with OCR text

### Sync Test:
1. Play video
2. Active frame should highlight in gallery
3. Timeline view should auto-scroll

## Next Steps
Task 3 Complete! Proceed to Task 4 - Subtask 1 (Correlation Algorithm Implementation)

## Estimated Time
3-4 hours

## Notes
- Lazy load images for performance
- Consider virtual scrolling for many frames
- Image optimization: use thumbnails for grid, full for detail
- Add loading skeletons while images load
- Consider frame comparison feature
