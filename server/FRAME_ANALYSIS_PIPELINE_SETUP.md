# Frame Analysis Pipeline Setup Guide

Quick setup guide for Task 3 Subtask 5: Frame Analysis Pipeline implementation.

## Installation Steps

### 1. Apply Database Migrations

Run the consolidated migration script to add all required columns:

```bash
# Navigate to project root
cd /home/pgc/vidlyx

# Apply migrations (adjust connection details as needed)
psql -U your_db_user -d vidlyx -f database/migrations/task3_subtask5_migrations.sql
```

Or apply individual migrations:
```bash
psql -U your_db_user -d vidlyx -f database/migrations/add_analysis_columns_to_frames.sql
psql -U your_db_user -d vidlyx -f database/migrations/add_result_to_analysis_jobs.sql
psql -U your_db_user -d vidlyx -f database/migrations/add_visual_overview_to_videos.sql
```

### 2. Verify Dependencies

Ensure all required services are available:
- Tesseract OCR (for OCR service)
- FFmpeg (for frame extraction)
- Redis (for Bull queue)
- PostgreSQL (for database)
- Gemini API key (for vision analysis)

### 3. Start the Worker

The frame analysis pipeline worker needs to be started to process jobs.

Add to your server startup (e.g., `server.js` or `index.js`):

```javascript
// Load the worker
require('./src/jobs/frameAnalysisPipelineWorker');
```

Or start it separately:
```bash
node -e "require('./src/jobs/frameAnalysisPipelineWorker')"
```

### 4. Configure Analysis Settings (Optional)

Edit `/server/src/config/analysisConfig.js` to customize:
- Frame extraction intervals and quality
- OCR settings and worker count
- Vision analysis sampling rate and limits
- Keyframe detection thresholds

## Usage

### Start Frame Analysis

```bash
# Using curl
curl -X POST http://localhost:4051/api/videos/{VIDEO_ID}/analyze-frames \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "frameInterval": 5,
    "maxFrames": 200,
    "ocrEnabled": true,
    "visionEnabled": true,
    "visionSampleRate": 3
  }'
```

### Check Analysis Status

```bash
curl http://localhost:4051/api/videos/{VIDEO_ID}/analysis-status \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Monitor Job Progress

```bash
# Get all jobs for a video
curl http://localhost:4051/api/videos/{VIDEO_ID}/jobs \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Get specific job details
curl http://localhost:4051/api/videos/{VIDEO_ID}/jobs/{JOB_ID} \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## Testing the Pipeline

### 1. Complete Pipeline Test

```javascript
const frameAnalysisPipeline = require('./src/services/frameAnalysisPipeline');
const videoService = require('./src/services/videoService');

// Get a video
const video = await videoService.findVideoById('your-video-id');

// Run pipeline with progress tracking
const result = await frameAnalysisPipeline.runPipeline(video, {
  frameInterval: 5,
  maxFrames: 50,  // Small number for testing
  ocrEnabled: true,
  visionEnabled: true,
  visionSampleRate: 3,
  onProgress: (progress, step, message) => {
    console.log(`${step}: ${progress}% - ${message}`);
  },
  onStepChange: (step, label) => {
    console.log(`Starting: ${label}`);
  }
});

console.log('Pipeline Results:', result);
```

### 2. Test Individual Components

```javascript
// Test keyframe identification
const keyframes = await frameAnalysisPipeline.identifyKeyframes('video-id');
console.log('Keyframes:', keyframes);

// Test visual overview generation
const overview = await frameAnalysisPipeline.generateVisualOverview('video-id');
console.log('Visual Overview:', overview);

// Test pipeline status
const status = await frameAnalysisPipeline.getPipelineStatus('video-id');
console.log('Status:', status);
```

### 3. Test Queue Processing

```javascript
const { analysisQueue } = require('./src/jobs/queue');
const { v4: uuidv4 } = require('uuid');

// Create a job
const jobId = uuidv4();
const job = await analysisQueue.add('frame-analysis-pipeline', {
  videoId: 'your-video-id',
  jobId: jobId,
  options: {
    frameInterval: 5,
    maxFrames: 50
  }
});

console.log('Job created:', job.id);

// Monitor job progress
job.on('progress', (progress) => {
  console.log('Progress:', progress);
});

job.on('completed', (result) => {
  console.log('Completed:', result);
});

job.on('failed', (error) => {
  console.error('Failed:', error);
});
```

## Configuration Options

### Pipeline Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frameInterval` | number | 5 | Seconds between frames |
| `maxFrames` | number | 200 | Maximum frames to extract |
| `ocrEnabled` | boolean | true | Enable OCR processing |
| `visionEnabled` | boolean | true | Enable vision analysis |
| `visionSampleRate` | number | 3 | Analyze every Nth frame |
| `onProgress` | function | null | Progress callback |
| `onStepChange` | function | null | Step change callback |

### Default Configuration

See `/server/src/config/analysisConfig.js` for all default settings.

## Verification

After installation, verify everything is working:

### 1. Check Database Schema

```sql
-- Verify frames table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'frames'
AND column_name IN ('ocr_confidence', 'ocr_words', 'content_type', 'raw_analysis');

-- Should return 4 rows
```

### 2. Check Routes

```bash
# Should return 200 OK (after authentication)
curl -I http://localhost:4051/api/videos/{VIDEO_ID}/analysis-status
```

### 3. Check Worker

Look for log message:
```
[PipelineWorker] Frame analysis pipeline worker initialized and ready to process jobs
```

### 4. Check Queue

```javascript
const { getQueueHealth } = require('./src/jobs/queue');
const health = await getQueueHealth();
console.log(health);
// Should show healthy: true
```

## Troubleshooting

### Worker Not Processing Jobs

1. Verify worker is running:
   ```bash
   ps aux | grep frameAnalysisPipelineWorker
   ```

2. Check Redis connection:
   ```bash
   redis-cli ping
   # Should return PONG
   ```

3. Check queue status:
   ```javascript
   const { analysisQueue } = require('./src/jobs/queue');
   const waiting = await analysisQueue.getWaitingCount();
   const active = await analysisQueue.getActiveCount();
   console.log({ waiting, active });
   ```

### OCR Not Working

1. Verify Tesseract installation:
   ```bash
   tesseract --version
   ```

2. Check OCR worker initialization:
   ```javascript
   const ocrService = require('./src/services/ocrService');
   await ocrService.initWorkers();
   console.log('Workers initialized:', ocrService.initialized);
   ```

### Vision Analysis Failing

1. Check Gemini API key:
   ```bash
   echo $GEMINI_API_KEY
   ```

2. Check daily limit:
   ```javascript
   const visionService = require('./src/services/visionAnalysisService');
   const stats = await visionService.getUsageStats();
   console.log(stats);
   ```

### Database Migration Issues

If migrations fail:

1. Check if columns already exist:
   ```sql
   \d frames
   \d videos
   \d analysis_jobs
   ```

2. Drop and recreate if needed:
   ```sql
   ALTER TABLE frames DROP COLUMN IF EXISTS ocr_confidence;
   -- Then rerun migration
   ```

## Performance Tips

1. **Adjust Frame Interval:** Increase `frameInterval` to extract fewer frames
2. **Reduce Vision Sampling:** Increase `visionSampleRate` to analyze fewer frames
3. **Disable OCR/Vision:** Set `ocrEnabled: false` or `visionEnabled: false` if not needed
4. **Limit Max Frames:** Set lower `maxFrames` for faster processing
5. **Monitor API Usage:** Check vision analysis usage regularly

## Next Steps

After successful setup:

1. Integrate with frontend UI
2. Add WebSocket for real-time progress updates
3. Implement thumbnail generation for keyframes
4. Add batch processing for multiple videos
5. Create analytics dashboard for pipeline metrics

## Support

For issues or questions:
- Check logs in console output
- Review error messages in `analysis_jobs.error_message`
- Consult `/server/FRAME_ANALYSIS_PIPELINE.md` for detailed documentation
