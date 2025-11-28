# Task 4 - Subtask 2: Link Frames to Transcript Segments

## Objective
Create direct links between frames and transcript segments for bidirectional navigation.

## Prerequisites
- Task 4 - Subtask 1 completed (Correlation algorithm)
- Correlations stored in database

## Instructions

### 1. Update Database Schema
Add linkage table if not using correlations directly:

```sql
-- Direct frame-segment links (simplified view)
CREATE VIEW frame_segment_links AS
SELECT DISTINCT
  c.video_id,
  c.frame_id,
  c.segment_start,
  c.segment_end,
  f.timestamp_seconds as frame_timestamp,
  f.scene_description,
  f.on_screen_text,
  c.correlation_score
FROM frame_transcript_correlations c
JOIN frames f ON c.frame_id = f.id
WHERE c.correlation_score > 30; -- Only strong correlations
```

### 2. Create Linkage Service
Create `/home/pgc/vidlyx/server/src/services/linkageService.js`:

```javascript
const db = require('./db');

/**
 * Get frames linked to a specific transcript segment
 */
async function getFramesForSegment(videoId, startTime, endTime) {
  const query = `
    SELECT f.*, c.correlation_score, c.matching_elements
    FROM frames f
    JOIN frame_transcript_correlations c ON f.id = c.frame_id
    WHERE c.video_id = $1
      AND c.segment_start = $2
      AND c.segment_end = $3
    ORDER BY c.correlation_score DESC
  `;
  const result = await db.query(query, [videoId, startTime, endTime]);
  return result.rows;
}

/**
 * Get transcript segments linked to a specific frame
 */
async function getSegmentsForFrame(frameId) {
  const query = `
    SELECT DISTINCT segment_start, segment_end, correlation_score
    FROM frame_transcript_correlations
    WHERE frame_id = $1
    ORDER BY segment_start
  `;
  const result = await db.query(query, [frameId]);
  return result.rows;
}

/**
 * Get best matching frame for current video time
 */
async function getBestFrameForTime(videoId, timestamp) {
  const query = `
    SELECT f.*, c.correlation_score
    FROM frames f
    JOIN frame_transcript_correlations c ON f.id = c.frame_id
    WHERE c.video_id = $1
      AND c.segment_start <= $2
      AND c.segment_end >= $2
    ORDER BY c.correlation_score DESC
    LIMIT 1
  `;
  const result = await db.query(query, [videoId, timestamp]);
  return result.rows[0] || null;
}

module.exports = {
  getFramesForSegment,
  getSegmentsForFrame,
  getBestFrameForTime
};
```

### 3. Create API Endpoints
```javascript
// GET /api/videos/:id/segments/:start/:end/frames
router.get('/:id/segments/:start/:end/frames', async (req, res) => {
  const frames = await linkageService.getFramesForSegment(
    req.params.id,
    parseFloat(req.params.start),
    parseFloat(req.params.end)
  );
  res.json(frames);
});

// GET /api/frames/:id/segments
router.get('/:id/segments', async (req, res) => {
  const segments = await linkageService.getSegmentsForFrame(req.params.id);
  res.json(segments);
});
```

### 4. Frontend Hook for Linked Content
```javascript
// useLinkedContent.js
export function useLinkedContent(videoId, currentTime) {
  const [linkedFrames, setLinkedFrames] = useState([]);

  useEffect(() => {
    const fetchLinked = async () => {
      const response = await api.get(
        `/videos/${videoId}/correlations/by-time/${currentTime}`
      );
      setLinkedFrames(response.data);
    };

    if (videoId && currentTime !== undefined) {
      fetchLinked();
    }
  }, [videoId, Math.floor(currentTime)]); // Update every second

  return linkedFrames;
}
```

### 5. Display Linked Frames in Transcript
Update TranscriptSegment to show linked frame indicator:

```jsx
function TranscriptSegment({ segment, videoId, ... }) {
  const [linkedFrames, setLinkedFrames] = useState([]);

  // Fetch linked frames on hover or expand
  const fetchLinkedFrames = async () => {
    const frames = await api.get(
      `/videos/${videoId}/segments/${segment.start}/${segment.end}/frames`
    );
    setLinkedFrames(frames.data);
  };

  return (
    <div className="transcript-segment">
      {/* existing content */}
      {linkedFrames.length > 0 && (
        <div className="linked-frames-preview">
          {linkedFrames.slice(0, 3).map(frame => (
            <img key={frame.id} src={`/api/frames/${frame.id}/image`} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Verification
1. Click transcript segment, verify linked frames appear
2. Click frame, verify linked transcript segments highlighted
3. Test bidirectional navigation

## Next Steps
Proceed to Task 4 - Subtask 3 (Synchronized Timeline View)

## Estimated Time
2-3 hours
