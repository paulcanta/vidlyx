# Task 5 - Subtask 1: Section Detection Algorithm

## Objective
Automatically detect logical sections in videos based on content changes, transcript analysis, and visual transitions.

## Prerequisites
- Task 4 completed (Correlation and sync)
- Transcript and frames available with analysis

## Instructions

### 1. Create Section Detection Service
Create `/home/pgc/vidlyx/server/src/services/sectionDetectionService.js`:

```javascript
const db = require('./db');
const geminiService = require('./geminiService');

/**
 * Detect sections in a video using multiple signals
 */
async function detectSections(videoId) {
  // Get transcript
  const transcript = await getTranscript(videoId);
  if (!transcript) throw new Error('No transcript available');

  // Get keyframes (visual change points)
  const keyframes = await getKeyframes(videoId);

  // Analyze transcript for topic changes
  const topicChanges = await detectTopicChanges(transcript.segments);

  // Combine visual and topic signals
  const sectionBoundaries = mergeSignals(keyframes, topicChanges);

  // Generate section metadata
  const sections = await generateSectionMetadata(
    videoId,
    sectionBoundaries,
    transcript.segments
  );

  // Store sections
  for (const section of sections) {
    await storeSection(videoId, section);
  }

  return sections;
}

/**
 * Detect topic changes in transcript using AI
 */
async function detectTopicChanges(segments) {
  // Group segments into chunks (30 seconds each)
  const chunks = groupSegmentsIntoChunks(segments, 30);

  const prompt = `Analyze these transcript chunks and identify where major topic changes occur.
Return JSON array of timestamps where new topics begin:
${JSON.stringify(chunks.map(c => ({ time: c.startTime, text: c.text.substring(0, 200) })))}

Format: { "topic_changes": [{ "timestamp": 0, "topic": "Introduction" }, ...] }`;

  const result = await geminiService.generateText(prompt);
  return JSON.parse(result).topic_changes;
}

/**
 * Merge visual and topic signals to find section boundaries
 */
function mergeSignals(keyframes, topicChanges) {
  const boundaries = [];

  // Add topic changes as boundaries
  for (const tc of topicChanges) {
    boundaries.push({
      timestamp: tc.timestamp,
      confidence: 0.8,
      source: 'topic',
      topic: tc.topic
    });
  }

  // Add keyframes that are near topic changes (reinforcing)
  for (const kf of keyframes) {
    const nearTopic = topicChanges.find(tc =>
      Math.abs(tc.timestamp - kf.timestamp_seconds) < 5
    );

    if (nearTopic) {
      // Reinforce existing boundary
      const existing = boundaries.find(b =>
        Math.abs(b.timestamp - kf.timestamp_seconds) < 5
      );
      if (existing) {
        existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
      }
    } else if (kf.is_keyframe) {
      // Add as potential boundary
      boundaries.push({
        timestamp: kf.timestamp_seconds,
        confidence: 0.5,
        source: 'visual'
      });
    }
  }

  // Filter low confidence and merge nearby boundaries
  return boundaries
    .filter(b => b.confidence >= 0.5)
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc, b) => {
      const last = acc[acc.length - 1];
      if (!last || b.timestamp - last.timestamp > 10) {
        acc.push(b);
      }
      return acc;
    }, []);
}

/**
 * Generate metadata for each section
 */
async function generateSectionMetadata(videoId, boundaries, segments) {
  const sections = [];

  for (let i = 0; i < boundaries.length; i++) {
    const startTime = boundaries[i].timestamp;
    const endTime = boundaries[i + 1]?.timestamp || segments[segments.length - 1].end;

    // Get transcript text for this section
    const sectionSegments = segments.filter(s =>
      s.start >= startTime && s.start < endTime
    );
    const sectionText = sectionSegments.map(s => s.text).join(' ');

    // Generate title using AI
    const title = boundaries[i].topic || await generateSectionTitle(sectionText);

    sections.push({
      start_time: startTime,
      end_time: endTime,
      title: title,
      section_order: i,
      transcript_text: sectionText
    });
  }

  return sections;
}

async function generateSectionTitle(text) {
  const prompt = `Generate a concise title (3-6 words) for this video section:
"${text.substring(0, 500)}"
Return just the title, no quotes or extra text.`;

  return geminiService.generateText(prompt);
}

module.exports = { detectSections };
```

### 2. Store Sections in Database
```javascript
async function storeSection(videoId, section) {
  const query = `
    INSERT INTO sections (video_id, title, start_time, end_time, section_order)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (video_id, section_order)
    DO UPDATE SET title = $2, start_time = $3, end_time = $4
    RETURNING *
  `;
  const result = await db.query(query, [
    videoId,
    section.title,
    section.start_time,
    section.end_time,
    section.section_order
  ]);
  return result.rows[0];
}
```

### 3. Add API Endpoints
```javascript
// GET /api/videos/:id/sections
router.get('/:id/sections', async (req, res) => {
  const query = `
    SELECT * FROM sections
    WHERE video_id = $1
    ORDER BY section_order
  `;
  const result = await db.query(query, [req.params.id]);
  res.json(result.rows);
});

// POST /api/videos/:id/detect-sections
router.post('/:id/detect-sections', async (req, res) => {
  const sections = await sectionDetectionService.detectSections(req.params.id);
  res.json(sections);
});
```

## Verification
1. Run section detection on a video
2. Check that sections have logical boundaries
3. Verify section titles make sense

## Next Steps
Proceed to Task 5 - Subtask 2 (Gemini Summary Generation)

## Estimated Time
3-4 hours
