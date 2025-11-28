# Task 3 - Subtask 5: Frame Analysis Pipeline

## Objective
Create a complete frame analysis pipeline that combines extraction, OCR, and vision analysis into a unified workflow.

## Prerequisites
- Task 3 - Subtask 4 completed (Gemini Vision working)
- All frame processing services functional
- Background job system working

## Instructions

### 1. Create Unified Analysis Service
Create `/home/pgc/vidlyx/server/src/services/frameAnalysisPipeline.js`:

```javascript
const frameExtractionService = require('./frameExtractionService');
const ocrService = require('./ocrService');
const visionAnalysisService = require('./visionAnalysisService');
const videoService = require('./videoService');
const db = require('./db');

const PIPELINE_STEPS = {
  EXTRACT: 'extract_frames',
  OCR: 'process_ocr',
  VISION: 'analyze_vision',
  COMPLETE: 'complete'
};

/**
 * Run complete frame analysis pipeline
 */
async function runPipeline(video, options = {}) {
  const {
    frameInterval = 5,
    maxFrames = 200,
    ocrEnabled = true,
    visionEnabled = true,
    visionSampleRate = 3,
    onProgress,
    onStepChange
  } = options;

  const progress = { current: 0, step: PIPELINE_STEPS.EXTRACT };
  const updateProgress = (percent, step) => {
    progress.current = percent;
    if (step) progress.step = step;
    onProgress?.(progress);
  };

  try {
    // Step 1: Extract frames (0-30%)
    onStepChange?.(PIPELINE_STEPS.EXTRACT);
    updateProgress(0, PIPELINE_STEPS.EXTRACT);

    const frames = await frameExtractionService.extractVideoFrames(video, {
      interval: frameInterval,
      maxFrames,
      onProgress: (p) => updateProgress(p * 0.3)
    });

    if (frames.length === 0) {
      throw new Error('No frames extracted');
    }

    // Step 2: OCR (30-60%)
    if (ocrEnabled) {
      onStepChange?.(PIPELINE_STEPS.OCR);
      updateProgress(30, PIPELINE_STEPS.OCR);

      await ocrService.processVideoFrames(video.id, (p) => {
        updateProgress(30 + p * 0.3);
      });
    }

    // Step 3: Vision Analysis (60-95%)
    if (visionEnabled) {
      onStepChange?.(PIPELINE_STEPS.VISION);
      updateProgress(60, PIPELINE_STEPS.VISION);

      await visionAnalysisService.analyzeVideoFrames(video.id, {
        sampleRate: visionSampleRate,
        maxFrames: 40, // Limit for API quota
        onProgress: (p) => updateProgress(60 + p * 0.35)
      });
    }

    // Step 4: Post-processing (95-100%)
    updateProgress(95, PIPELINE_STEPS.COMPLETE);
    await postProcessFrames(video.id);

    updateProgress(100, PIPELINE_STEPS.COMPLETE);
    onStepChange?.(PIPELINE_STEPS.COMPLETE);

    return {
      success: true,
      frameCount: frames.length,
      steps: {
        extraction: true,
        ocr: ocrEnabled,
        vision: visionEnabled
      }
    };
  } catch (error) {
    console.error('Frame analysis pipeline failed:', error);
    throw error;
  }
}

/**
 * Post-process frames after analysis
 */
async function postProcessFrames(videoId) {
  // Identify keyframes based on content changes
  await identifyKeyframes(videoId);

  // Generate visual overview
  await generateVisualOverview(videoId);
}

/**
 * Identify keyframes where content significantly changes
 */
async function identifyKeyframes(videoId) {
  const query = `
    WITH frame_changes AS (
      SELECT
        id,
        timestamp_seconds,
        content_type,
        LAG(content_type) OVER (ORDER BY timestamp_seconds) as prev_content_type,
        scene_description,
        LAG(scene_description) OVER (ORDER BY timestamp_seconds) as prev_scene
      FROM frames
      WHERE video_id = $1
    )
    UPDATE frames
    SET is_keyframe = TRUE
    FROM frame_changes fc
    WHERE frames.id = fc.id
      AND (
        fc.content_type != fc.prev_content_type
        OR fc.prev_content_type IS NULL
      )
  `;
  await db.query(query, [videoId]);
}

/**
 * Generate visual overview summary
 */
async function generateVisualOverview(videoId) {
  const query = `
    SELECT content_type, COUNT(*) as count
    FROM frames
    WHERE video_id = $1 AND content_type IS NOT NULL
    GROUP BY content_type
    ORDER BY count DESC
  `;
  const result = await db.query(query, [videoId]);

  const overview = {
    contentTypes: result.rows,
    primaryType: result.rows[0]?.content_type || 'unknown',
    analyzedAt: new Date().toISOString()
  };

  // Store in video_summaries or video table
  await db.query(
    `UPDATE videos SET visual_overview = $1 WHERE id = $2`,
    [JSON.stringify(overview), videoId]
  );
}

/**
 * Get pipeline status for a video
 */
async function getPipelineStatus(videoId) {
  const frameCount = await db.query(
    'SELECT COUNT(*) FROM frames WHERE video_id = $1',
    [videoId]
  );

  const ocrCount = await db.query(
    `SELECT COUNT(*) FROM frames
     WHERE video_id = $1 AND on_screen_text IS NOT NULL`,
    [videoId]
  );

  const visionCount = await db.query(
    `SELECT COUNT(*) FROM frames
     WHERE video_id = $1 AND scene_description IS NOT NULL`,
    [videoId]
  );

  return {
    frames: parseInt(frameCount.rows[0].count),
    ocrProcessed: parseInt(ocrCount.rows[0].count),
    visionAnalyzed: parseInt(visionCount.rows[0].count)
  };
}

module.exports = {
  runPipeline,
  getPipelineStatus,
  PIPELINE_STEPS
};
```

### 2. Create Pipeline Worker
Create `/home/pgc/vidlyx/server/src/jobs/frameAnalysisPipelineWorker.js`:

```javascript
const Queue = require('bull');
const frameAnalysisPipeline = require('../services/frameAnalysisPipeline');
const videoService = require('../services/videoService');

const pipelineQueue = new Queue('frame-analysis-pipeline', {
  redis: process.env.REDIS_HOST ? {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379
  } : undefined
});

pipelineQueue.process(async (job) => {
  const { videoId, youtubeId, duration, options } = job.data;

  const video = { id: videoId, youtube_id: youtubeId, duration };

  try {
    await videoService.updateVideoStatus(videoId, 'analyzing_frames');

    const result = await frameAnalysisPipeline.runPipeline(video, {
      ...options,
      onProgress: ({ current }) => job.progress(current),
      onStepChange: (step) => {
        console.log(`Video ${videoId}: ${step}`);
      }
    });

    await videoService.updateVideoStatus(videoId, 'frames_analyzed');
    return result;
  } catch (error) {
    await videoService.updateVideoStatus(videoId, 'frame_analysis_failed');
    throw error;
  }
});

pipelineQueue.on('completed', (job, result) => {
  console.log(`Frame pipeline completed: ${result.frameCount} frames`);
});

pipelineQueue.on('failed', (job, err) => {
  console.error(`Frame pipeline failed:`, err.message);
});

module.exports = { pipelineQueue };
```

### 3. Create Frame Analysis Configuration
Create `/home/pgc/vidlyx/server/src/config/analysisConfig.js`:

```javascript
module.exports = {
  frameExtraction: {
    interval: 5,        // Extract every 5 seconds
    maxFrames: 200,     // Limit total frames
    quality: 2,         // JPEG quality (1-31, lower is better)
    width: 1280         // Output width
  },

  ocr: {
    enabled: true,
    minConfidence: 30,  // Skip low confidence results
    preprocessImage: true
  },

  vision: {
    enabled: true,
    sampleRate: 3,      // Analyze every 3rd frame
    maxFramesPerVideo: 40, // API quota management
    dailyLimit: 1500    // Gemini free tier
  },

  pipeline: {
    retryAttempts: 3,
    retryDelay: 5000
  }
};
```

### 4. Add Pipeline Routes
Add to video routes:

```javascript
const { pipelineQueue } = require('../jobs/frameAnalysisPipelineWorker');
const frameAnalysisPipeline = require('../services/frameAnalysisPipeline');

// POST /api/videos/:id/analyze-frames
router.post('/:id/analyze-frames', requireAuth, async (req, res) => {
  try {
    const video = await videoService.findVideoById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Add to queue
    const job = await pipelineQueue.add({
      videoId: video.id,
      youtubeId: video.youtube_id,
      duration: video.duration,
      options: req.body.options || {}
    });

    res.json({
      jobId: job.id,
      message: 'Frame analysis started'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/videos/:id/analysis-status
router.get('/:id/analysis-status', requireAuth, async (req, res) => {
  try {
    const status = await frameAnalysisPipeline.getPipelineStatus(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. Create Analysis Progress Component (Frontend)
Create `/home/pgc/vidlyx/dashboard/src/components/Video/AnalysisProgress.js`:

```jsx
function AnalysisProgress({ videoId }) {
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const pollStatus = async () => {
      const response = await api.get(`/videos/${videoId}/analysis-status`);
      setStatus(response.data);
    };

    const interval = setInterval(pollStatus, 2000);
    pollStatus();

    return () => clearInterval(interval);
  }, [videoId]);

  const steps = [
    { key: 'frames', label: 'Extracting Frames', count: status?.frames },
    { key: 'ocr', label: 'OCR Processing', count: status?.ocrProcessed },
    { key: 'vision', label: 'Vision Analysis', count: status?.visionAnalyzed }
  ];

  return (
    <div className="analysis-progress">
      <h3>Analysis Progress</h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="steps">
        {steps.map(step => (
          <div key={step.key} className="step">
            <span className="step-label">{step.label}</span>
            <span className="step-count">{step.count || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. Test Complete Pipeline
```javascript
// test-pipeline.js
const frameAnalysisPipeline = require('./src/services/frameAnalysisPipeline');

const testVideo = {
  id: 'test-uuid',
  youtube_id: 'dQw4w9WgXcQ',
  duration: 212
};

frameAnalysisPipeline.runPipeline(testVideo, {
  frameInterval: 10, // Faster for testing
  maxFrames: 20,
  visionSampleRate: 2,
  onProgress: (p) => console.log(`Progress: ${p.current}% - ${p.step}`),
  onStepChange: (step) => console.log(`Step: ${step}`)
})
.then(result => console.log('Pipeline complete:', result))
.catch(err => console.error('Pipeline failed:', err));
```

## Verification

### Run Full Pipeline:
```bash
node test-pipeline.js
```

Watch progress through all steps.

### Check Database Results:
```sql
-- Frame counts
SELECT
  COUNT(*) as total_frames,
  COUNT(on_screen_text) as ocr_processed,
  COUNT(scene_description) as vision_analyzed,
  COUNT(CASE WHEN is_keyframe THEN 1 END) as keyframes
FROM frames
WHERE video_id = 'your-video-id';
```

### API Test:
```bash
# Start analysis
curl -X POST http://localhost:4051/api/videos/VIDEO_ID/analyze-frames \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Check status
curl http://localhost:4051/api/videos/VIDEO_ID/analysis-status -b cookies.txt
```

## Next Steps
Proceed to Task 3 - Subtask 6 (Frame Gallery UI with Analysis Display)

## Estimated Time
3-4 hours

## Notes
- Pipeline is designed to be resumable (can restart from any step)
- OCR and Vision can be disabled individually
- Rate limiting is built into Vision step
- Consider adding email notification when complete
- Log pipeline metrics for optimization
