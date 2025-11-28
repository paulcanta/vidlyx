# Task 4 - Subtask 1: Correlation Algorithm Implementation

## Objective
Create an algorithm to correlate visual frame content with transcript segments based on timing and content similarity.

## Prerequisites
- Task 3 completed (Frames extracted and analyzed)
- Transcript with timestamped segments available
- OCR and vision analysis data in database

## Instructions

### 1. Create Correlation Service
Create `/home/pgc/vidlyx/server/src/services/correlationService.js`:

```javascript
const db = require('./db');
const geminiService = require('./geminiService');

/**
 * Correlate frames with transcript segments for a video
 */
async function correlateVideoContent(videoId) {
  // Get transcript segments
  const transcript = await getTranscriptSegments(videoId);
  if (!transcript.length) {
    throw new Error('No transcript available');
  }

  // Get analyzed frames
  const frames = await getAnalyzedFrames(videoId);
  if (!frames.length) {
    throw new Error('No analyzed frames available');
  }

  // Create correlations
  const correlations = [];

  for (const segment of transcript) {
    // Find frames that overlap with this segment's timespan
    const relevantFrames = findFramesInTimeRange(
      frames,
      segment.start,
      segment.end
    );

    if (relevantFrames.length > 0) {
      // Calculate content similarity
      const correlation = await calculateCorrelation(segment, relevantFrames);
      correlations.push(correlation);

      // Store correlation
      await storeCorrelation(videoId, correlation);
    }
  }

  return correlations;
}

/**
 * Find frames within a time range
 */
function findFramesInTimeRange(frames, startTime, endTime) {
  return frames.filter(frame =>
    frame.timestamp_seconds >= startTime - 2 && // 2 second buffer
    frame.timestamp_seconds <= endTime + 2
  );
}

/**
 * Calculate correlation score between segment and frames
 */
async function calculateCorrelation(segment, frames) {
  const correlation = {
    segment_start: segment.start,
    segment_end: segment.end,
    segment_text: segment.text,
    frames: [],
    correlation_score: 0
  };

  for (const frame of frames) {
    const score = calculateContentSimilarity(segment.text, frame);
    correlation.frames.push({
      frame_id: frame.id,
      timestamp: frame.timestamp_seconds,
      score,
      matching_elements: findMatchingElements(segment.text, frame)
    });
  }

  // Overall correlation score (average of frame scores)
  correlation.correlation_score = correlation.frames.length > 0
    ? correlation.frames.reduce((sum, f) => sum + f.score, 0) / correlation.frames.length
    : 0;

  return correlation;
}

/**
 * Calculate content similarity between transcript text and frame analysis
 */
function calculateContentSimilarity(transcriptText, frame) {
  let score = 0;
  const text = transcriptText.toLowerCase();

  // Check if transcript mentions content visible in frame
  if (frame.on_screen_text) {
    const ocrWords = frame.on_screen_text.toLowerCase().split(/\s+/);
    const transcriptWords = text.split(/\s+/);
    const matchingWords = ocrWords.filter(w => transcriptWords.includes(w));
    score += (matchingWords.length / ocrWords.length) * 30;
  }

  // Check visual elements mentioned in transcript
  if (frame.visual_elements) {
    for (const element of frame.visual_elements) {
      if (text.includes(element.toLowerCase())) {
        score += 15;
      }
    }
  }

  // Check scene description relevance
  if (frame.scene_description) {
    const descWords = frame.scene_description.toLowerCase().split(/\s+/);
    const commonWords = descWords.filter(w =>
      text.includes(w) && w.length > 3
    );
    score += (commonWords.length / descWords.length) * 20;
  }

  // Content type bonus
  if (frame.content_type === 'screencast' && text.includes('screen')) score += 10;
  if (frame.content_type === 'presentation' && text.includes('slide')) score += 10;
  if (frame.content_type === 'demo' && (text.includes('show') || text.includes('demo'))) score += 10;

  return Math.min(score, 100); // Cap at 100
}

/**
 * Find specific elements that match between transcript and frame
 */
function findMatchingElements(transcriptText, frame) {
  const matches = [];
  const text = transcriptText.toLowerCase();

  // Check OCR text matches
  if (frame.on_screen_text) {
    const words = frame.on_screen_text.split(/\s+/).filter(w => w.length > 3);
    for (const word of words) {
      if (text.includes(word.toLowerCase())) {
        matches.push({ type: 'ocr', value: word });
      }
    }
  }

  // Check visual element matches
  if (frame.visual_elements) {
    for (const element of frame.visual_elements) {
      if (text.includes(element.toLowerCase())) {
        matches.push({ type: 'visual', value: element });
      }
    }
  }

  return matches;
}

module.exports = {
  correlateVideoContent,
  calculateContentSimilarity,
  findFramesInTimeRange
};
```

### 2. Create Correlation Storage
Add correlation table:

```sql
CREATE TABLE IF NOT EXISTS frame_transcript_correlations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  frame_id UUID REFERENCES frames(id) ON DELETE CASCADE,
  segment_start DECIMAL(10, 2),
  segment_end DECIMAL(10, 2),
  correlation_score DECIMAL(5, 2),
  matching_elements JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_correlations_video ON frame_transcript_correlations(video_id);
CREATE INDEX idx_correlations_frame ON frame_transcript_correlations(frame_id);
CREATE INDEX idx_correlations_score ON frame_transcript_correlations(correlation_score DESC);
```

### 3. Store Correlations
```javascript
async function storeCorrelation(videoId, correlation) {
  for (const frame of correlation.frames) {
    const query = `
      INSERT INTO frame_transcript_correlations
        (video_id, frame_id, segment_start, segment_end, correlation_score, matching_elements)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `;
    await db.query(query, [
      videoId,
      frame.frame_id,
      correlation.segment_start,
      correlation.segment_end,
      frame.score,
      JSON.stringify(frame.matching_elements)
    ]);
  }
}
```

### 4. Add to Analysis Pipeline
Update the main analysis pipeline to include correlation step after vision analysis.

### 5. Create Correlation API Endpoints
```javascript
// GET /api/videos/:id/correlations
router.get('/:id/correlations', async (req, res) => {
  const query = `
    SELECT c.*, f.timestamp_seconds, f.frame_path
    FROM frame_transcript_correlations c
    JOIN frames f ON c.frame_id = f.id
    WHERE c.video_id = $1
    ORDER BY c.segment_start
  `;
  const result = await db.query(query, [req.params.id]);
  res.json(result.rows);
});

// GET /api/videos/:id/correlations/by-time/:timestamp
router.get('/:id/correlations/by-time/:timestamp', async (req, res) => {
  const timestamp = parseFloat(req.params.timestamp);
  const query = `
    SELECT c.*, f.timestamp_seconds, f.scene_description, f.on_screen_text
    FROM frame_transcript_correlations c
    JOIN frames f ON c.frame_id = f.id
    WHERE c.video_id = $1
      AND c.segment_start <= $2
      AND c.segment_end >= $2
    ORDER BY c.correlation_score DESC
    LIMIT 5
  `;
  const result = await db.query(query, [req.params.id, timestamp]);
  res.json(result.rows);
});
```

## Verification
1. Run correlation on a processed video
2. Check that correlations are stored in database
3. Query correlations API and verify results make sense

## Next Steps
Proceed to Task 4 - Subtask 2 (Link Frames to Transcript Segments)

## Estimated Time
3-4 hours
