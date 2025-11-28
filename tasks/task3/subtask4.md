# Task 3 - Subtask 4: Gemini Vision API Integration

## Objective
Integrate Google Gemini Vision API (FREE tier) for advanced frame analysis - scene description, object detection, and visual understanding.

## Prerequisites
- Task 3 - Subtask 3 completed (OCR working)
- Google AI Studio account (free)
- Gemini API key

## Instructions

### 1. Get Gemini API Key
1. Go to https://aistudio.google.com/
2. Sign in with Google account
3. Click "Get API Key"
4. Create new API key
5. Copy the key

### 2. Add API Key to Environment
Update `/home/pgc/vidlyx/server/.env`:
```env
GEMINI_API_KEY=your-api-key-here
```

### 3. Install Gemini SDK
```bash
cd /home/pgc/vidlyx/server
npm install @google/generative-ai
```

### 4. Create Gemini Service
Create `/home/pgc/vidlyx/server/src/services/geminiService.js`:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Flash model for speed (free tier: 15 RPM, 1500 req/day)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Analyze a video frame for visual content
 */
async function analyzeFrame(framePath) {
  try {
    // Read image as base64
    const imageBuffer = await fs.readFile(framePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const prompt = `Analyze this video frame and provide:
1. Scene description (1-2 sentences)
2. Key visual elements (list up to 5)
3. Any on-screen text or graphics you can see
4. The type of content (presentation, demo, talking head, screencast, animation, etc.)

Format as JSON:
{
  "scene_description": "...",
  "visual_elements": ["element1", "element2"],
  "on_screen_text": "...",
  "content_type": "..."
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      }
    ]);

    const response = result.response.text();

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      scene_description: response,
      visual_elements: [],
      on_screen_text: '',
      content_type: 'unknown'
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error.message);
    throw error;
  }
}

/**
 * Analyze multiple frames in batch
 */
async function analyzeFramesBatch(framePaths) {
  // Process with rate limiting (15 RPM = 1 request per 4 seconds)
  const results = [];
  const delay = 4000; // 4 seconds between requests

  for (let i = 0; i < framePaths.length; i++) {
    const result = await analyzeFrame(framePaths[i]);
    results.push(result);

    // Rate limit delay (except for last item)
    if (i < framePaths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Check API quota/usage
 */
async function checkQuota() {
  // Gemini doesn't have a quota check API
  // Just track usage locally
  return {
    dailyLimit: 1500,
    rateLimit: '15 RPM'
  };
}

module.exports = {
  analyzeFrame,
  analyzeFramesBatch,
  checkQuota
};
```

### 5. Create Vision Analysis Service
Create `/home/pgc/vidlyx/server/src/services/visionAnalysisService.js`:

```javascript
const geminiService = require('./geminiService');
const db = require('./db');

// Rate limiting: Track API calls
let apiCallsToday = 0;
let lastCallDate = new Date().toDateString();
const DAILY_LIMIT = 1500;
const RATE_LIMIT_MS = 4000;

/**
 * Analyze frames for a video (with sampling)
 */
async function analyzeVideoFrames(videoId, options = {}) {
  const {
    sampleRate = 3, // Analyze every 3rd frame
    maxFrames = 50,  // Max frames to analyze
    onProgress
  } = options;

  // Get frames
  const allFrames = await getFramesByVideoId(videoId);

  // Sample frames
  const framesToAnalyze = allFrames
    .filter((_, i) => i % sampleRate === 0)
    .slice(0, maxFrames);

  if (framesToAnalyze.length === 0) {
    return [];
  }

  // Check daily limit
  resetDailyCounter();
  if (apiCallsToday + framesToAnalyze.length > DAILY_LIMIT) {
    throw new Error(`API limit would be exceeded. ${DAILY_LIMIT - apiCallsToday} calls remaining today.`);
  }

  const results = [];

  for (let i = 0; i < framesToAnalyze.length; i++) {
    const frame = framesToAnalyze[i];

    try {
      // Analyze with Gemini
      const analysis = await geminiService.analyzeFrame(frame.frame_path);
      apiCallsToday++;

      // Store results
      await updateFrameAnalysis(frame.id, analysis);
      results.push({ frameId: frame.id, analysis });

      // Progress callback
      onProgress?.(Math.round(((i + 1) / framesToAnalyze.length) * 100));

      // Rate limit (except last)
      if (i < framesToAnalyze.length - 1) {
        await sleep(RATE_LIMIT_MS);
      }
    } catch (error) {
      console.error(`Vision analysis failed for frame ${frame.id}:`, error);
      // Continue with next frame
    }
  }

  return results;
}

/**
 * Update frame with vision analysis
 */
async function updateFrameAnalysis(frameId, analysis) {
  const query = `
    UPDATE frames
    SET scene_description = $1,
        visual_elements = $2,
        content_type = $3,
        raw_analysis = $4,
        updated_at = NOW()
    WHERE id = $5
  `;
  await db.query(query, [
    analysis.scene_description,
    JSON.stringify(analysis.visual_elements),
    analysis.content_type,
    JSON.stringify(analysis),
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
 * Reset daily counter if new day
 */
function resetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== lastCallDate) {
    apiCallsToday = 0;
    lastCallDate = today;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get API usage stats
 */
function getUsageStats() {
  resetDailyCounter();
  return {
    callsToday: apiCallsToday,
    remaining: DAILY_LIMIT - apiCallsToday,
    dailyLimit: DAILY_LIMIT
  };
}

module.exports = {
  analyzeVideoFrames,
  updateFrameAnalysis,
  getUsageStats
};
```

### 6. Add to Analysis Pipeline
Update `analysisWorker.js`:

```javascript
const visionAnalysisService = require('../services/visionAnalysisService');

// After OCR step
job.progress(70);
await visionAnalysisService.analyzeVideoFrames(videoId, {
  sampleRate: 3, // Every 3rd frame
  maxFrames: 40,
  onProgress: (progress) => {
    job.progress(70 + Math.round(progress * 0.2));
  }
});
```

### 7. Update Frames Table
Add vision analysis columns:

```sql
ALTER TABLE frames
ADD COLUMN IF NOT EXISTS scene_description TEXT,
ADD COLUMN IF NOT EXISTS visual_elements JSONB,
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS raw_analysis JSONB;
```

### 8. Create Vision Routes
Add to frame routes:

```javascript
// GET /api/videos/:id/frames/analysis
router.get('/:id/frames/analysis', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT id, timestamp_seconds, scene_description,
             visual_elements, content_type
      FROM frames
      WHERE video_id = $1
        AND scene_description IS NOT NULL
      ORDER BY timestamp_seconds
    `;
    const result = await db.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/usage - Check API usage
router.get('/usage', requireAuth, async (req, res) => {
  const stats = visionAnalysisService.getUsageStats();
  res.json(stats);
});
```

### 9. Handle Rate Limiting
Create rate limit middleware:

```javascript
// middleware/rateLimitGemini.js
const visionService = require('../services/visionAnalysisService');

function checkGeminiQuota(req, res, next) {
  const stats = visionService.getUsageStats();

  if (stats.remaining < 10) {
    return res.status(429).json({
      error: 'Gemini API daily limit nearly reached',
      remaining: stats.remaining
    });
  }

  next();
}

module.exports = { checkGeminiQuota };
```

### 10. Test Vision Analysis
```javascript
// test-vision.js
const geminiService = require('./src/services/geminiService');
const path = require('path');

async function test() {
  const result = await geminiService.analyzeFrame(
    path.join(__dirname, 'test-frame.jpg')
  );
  console.log('Analysis:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
```

## Verification

### Single Frame Test:
```bash
node test-vision.js
```

Should return JSON with scene description, visual elements, etc.

### Video Analysis Test:
1. Process a video with varied content
2. Check database:
```sql
SELECT timestamp_seconds, scene_description, content_type
FROM frames
WHERE video_id = 'your-video-id'
  AND scene_description IS NOT NULL
LIMIT 10;
```

### API Limits:
```bash
curl http://localhost:4051/api/usage -b cookies.txt
```

Should show remaining API calls.

## Next Steps
Proceed to Task 3 - Subtask 5 (Frame Analysis Pipeline)

## Estimated Time
2-3 hours

## Notes
- Gemini Flash is optimized for speed (good for video frames)
- 15 RPM = must wait 4 seconds between calls
- 1500 requests/day = ~40 videos @ 40 frames each
- Sample frames to stay within limits
- Consider caching analysis results
- Fall back gracefully if API limit reached
