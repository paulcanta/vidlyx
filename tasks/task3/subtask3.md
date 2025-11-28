# Task 3 - Subtask 3: Tesseract.js OCR Integration

## Objective
Extract on-screen text from video frames using Tesseract.js OCR (100% free, runs locally).

## Prerequisites
- Task 3 - Subtask 2 completed (Frame extraction worker)
- Frames being extracted successfully
- tesseract.js package available

## Instructions

### 1. Install Tesseract.js
```bash
cd /home/pgc/vidlyx/server
npm install tesseract.js
```

### 2. Create OCR Service
Create `/home/pgc/vidlyx/server/src/services/ocrService.js`:

```javascript
const Tesseract = require('tesseract.js');
const path = require('path');
const db = require('./db');

// Create a worker pool for parallel processing
let workers = [];
const WORKER_COUNT = 2; // Adjust based on CPU

/**
 * Initialize OCR workers
 */
async function initWorkers() {
  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = await Tesseract.createWorker('eng');
    workers.push(worker);
  }
  console.log(`Initialized ${WORKER_COUNT} OCR workers`);
}

/**
 * Get available worker
 */
function getWorker(index) {
  return workers[index % workers.length];
}

/**
 * Extract text from a single frame
 */
async function extractTextFromFrame(framePath, workerIndex = 0) {
  const worker = getWorker(workerIndex);

  try {
    const { data } = await worker.recognize(framePath);
    return {
      text: data.text.trim(),
      confidence: data.confidence,
      words: data.words?.map(w => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox
      })) || []
    };
  } catch (error) {
    console.error(`OCR failed for ${framePath}:`, error.message);
    return { text: '', confidence: 0, words: [] };
  }
}

/**
 * Process all frames for a video
 */
async function processVideoFrames(videoId, onProgress) {
  // Get all frames for video
  const frames = await getFramesByVideoId(videoId);

  if (frames.length === 0) {
    console.log(`No frames found for video ${videoId}`);
    return [];
  }

  // Initialize workers if needed
  if (workers.length === 0) {
    await initWorkers();
  }

  const results = [];
  const batchSize = WORKER_COUNT;

  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map((frame, idx) =>
        extractTextFromFrame(frame.frame_path, idx)
          .then(result => ({ frame, result }))
      )
    );

    // Update frames with OCR results
    for (const { frame, result } of batchResults) {
      if (result.text) {
        await updateFrameOCR(frame.id, result);
        results.push({ frameId: frame.id, ...result });
      }
    }

    // Report progress
    const progress = Math.round(((i + batchSize) / frames.length) * 100);
    onProgress?.(Math.min(progress, 100));
  }

  return results;
}

/**
 * Update frame with OCR results
 */
async function updateFrameOCR(frameId, ocrResult) {
  const query = `
    UPDATE frames
    SET on_screen_text = $1,
        ocr_confidence = $2,
        ocr_words = $3,
        updated_at = NOW()
    WHERE id = $4
  `;
  await db.query(query, [
    ocrResult.text,
    ocrResult.confidence,
    JSON.stringify(ocrResult.words),
    frameId
  ]);
}

/**
 * Get frames by video ID
 */
async function getFramesByVideoId(videoId) {
  const query = `
    SELECT id, frame_path, timestamp_seconds
    FROM frames
    WHERE video_id = $1
    ORDER BY timestamp_seconds
  `;
  const result = await db.query(query, [videoId]);
  return result.rows;
}

/**
 * Search frames by OCR text
 */
async function searchFramesByText(videoId, searchText) {
  const query = `
    SELECT * FROM frames
    WHERE video_id = $1
      AND on_screen_text ILIKE $2
    ORDER BY timestamp_seconds
  `;
  const result = await db.query(query, [videoId, `%${searchText}%`]);
  return result.rows;
}

/**
 * Cleanup workers
 */
async function terminateWorkers() {
  for (const worker of workers) {
    await worker.terminate();
  }
  workers = [];
}

module.exports = {
  initWorkers,
  extractTextFromFrame,
  processVideoFrames,
  searchFramesByText,
  terminateWorkers
};
```

### 3. Add OCR to Analysis Pipeline
Update `/home/pgc/vidlyx/server/src/jobs/analysisWorker.js`:

```javascript
const ocrService = require('../services/ocrService');

// In the analysis pipeline, after frame extraction:
job.progress(60);
await ocrService.processVideoFrames(videoId, (progress) => {
  // OCR is 60-70% of total progress
  job.progress(60 + Math.round(progress * 0.1));
});
```

### 4. Create OCR Worker
Create `/home/pgc/vidlyx/server/src/jobs/ocrWorker.js`:

```javascript
const Queue = require('bull');
const ocrService = require('../services/ocrService');
const videoService = require('../services/videoService');

const ocrQueue = new Queue('ocr-processing', {
  redis: process.env.REDIS_HOST ? {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379
  } : undefined
});

ocrQueue.process(async (job) => {
  const { videoId } = job.data;

  try {
    await videoService.updateVideoStatus(videoId, 'processing_ocr');

    await ocrService.processVideoFrames(videoId, (progress) => {
      job.progress(progress);
    });

    await videoService.updateVideoStatus(videoId, 'ocr_complete');
    return { success: true };
  } catch (error) {
    console.error(`OCR failed for video ${videoId}:`, error);
    throw error;
  }
});

module.exports = { ocrQueue };
```

### 5. Update Frames Table (if needed)
Add OCR columns to frames table:

```sql
ALTER TABLE frames
ADD COLUMN IF NOT EXISTS on_screen_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS ocr_words JSONB;

-- Create index for text search
CREATE INDEX IF NOT EXISTS idx_frames_ocr_text
ON frames USING gin(to_tsvector('english', on_screen_text));
```

### 6. Create OCR Routes
Add to frame routes:

```javascript
// GET /api/videos/:id/frames/ocr - Get frames with OCR text
router.get('/:id/frames/ocr', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT id, timestamp_seconds, on_screen_text, ocr_confidence
      FROM frames
      WHERE video_id = $1
        AND on_screen_text IS NOT NULL
        AND on_screen_text != ''
      ORDER BY timestamp_seconds
    `;
    const result = await db.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/videos/:id/frames/search?q=text
router.get('/:id/frames/search', requireAuth, async (req, res) => {
  try {
    const frames = await ocrService.searchFramesByText(
      req.params.id,
      req.query.q
    );
    res.json(frames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 7. Optimize OCR for Video Frames
Add preprocessing for better OCR results:

```javascript
const sharp = require('sharp');

async function preprocessForOCR(imagePath) {
  const outputPath = imagePath.replace('.jpg', '_ocr.jpg');

  await sharp(imagePath)
    // Increase contrast
    .normalize()
    // Sharpen text
    .sharpen()
    // Convert to grayscale
    .grayscale()
    // Increase size for better recognition
    .resize({ width: 1920, withoutEnlargement: true })
    .toFile(outputPath);

  return outputPath;
}
```

### 8. Handle Frames with No Text
Only process frames likely to contain text:

```javascript
async function shouldProcessForOCR(framePath) {
  // Quick check: if image is mostly uniform (no text likely)
  const stats = await sharp(framePath).stats();
  const avgContrast = stats.channels.reduce((sum, c) =>
    sum + c.stdev, 0) / stats.channels.length;

  // Low contrast images unlikely to have text
  return avgContrast > 20;
}
```

### 9. Test OCR Service
Create test script:

```javascript
// test-ocr.js
const ocrService = require('./src/services/ocrService');
const path = require('path');

async function test() {
  await ocrService.initWorkers();

  const result = await ocrService.extractTextFromFrame(
    path.join(__dirname, 'test-frame.jpg')
  );

  console.log('OCR Result:', result);
  await ocrService.terminateWorkers();
}

test().catch(console.error);
```

## Verification

### Single Frame Test:
```bash
node test-ocr.js
```

Should output extracted text from test image.

### Full Video Test:
1. Process a video with visible on-screen text
2. Check database for OCR results:
```sql
SELECT timestamp_seconds, LEFT(on_screen_text, 100), ocr_confidence
FROM frames
WHERE video_id = 'your-video-id'
  AND on_screen_text IS NOT NULL;
```

### API Test:
```bash
curl "http://localhost:4051/api/videos/VIDEO_ID/frames/search?q=hello" -b cookies.txt
```

## Next Steps
Proceed to Task 3 - Subtask 4 (Gemini Vision API Integration)

## Estimated Time
2-3 hours

## Notes
- Tesseract.js downloads language data on first run (~15MB)
- Worker initialization takes 2-3 seconds
- Processing speed: ~1-2 seconds per frame
- Confidence < 50 usually means no real text detected
- Consider skipping OCR for fast-moving video sections
- Preprocessing improves accuracy significantly
