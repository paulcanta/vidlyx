# Task 3 - Subtask 2: Frame Extraction Worker (Background Job)

## Objective
Create a background job system to handle frame extraction without blocking the main server.

## Prerequisites
- Task 3 - Subtask 1 completed (FFmpeg integration working)
- Redis installed (optional but recommended)
- Bull package installed

## Instructions

### 1. Setup Redis (Optional)
For production, use Redis. For development, Bull can use in-memory queue.

Install Redis:
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Verify
redis-cli ping  # Should return PONG
```

### 2. Create Job Queue Configuration
Create `/home/pgc/vidlyx/server/src/jobs/queue.js`:

```javascript
const Queue = require('bull');

const REDIS_CONFIG = process.env.REDIS_HOST
  ? {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    }
  : undefined;

// Create queues
const frameExtractionQueue = new Queue('frame-extraction', {
  redis: REDIS_CONFIG,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50
  }
});

const analysisQueue = new Queue('video-analysis', {
  redis: REDIS_CONFIG
});

module.exports = {
  frameExtractionQueue,
  analysisQueue
};
```

### 3. Create Frame Extraction Worker
Create `/home/pgc/vidlyx/server/src/jobs/frameExtractionWorker.js`:

```javascript
const { frameExtractionQueue } = require('./queue');
const frameExtractionService = require('../services/frameExtractionService');
const videoService = require('../services/videoService');
const db = require('../services/db');

// Process frame extraction jobs
frameExtractionQueue.process(async (job) => {
  const { videoId, youtubeId, duration, options } = job.data;

  console.log(`Starting frame extraction for video ${videoId}`);

  try {
    // Update status
    await videoService.updateVideoStatus(videoId, 'extracting_frames');

    // Extract frames with progress reporting
    const frames = await frameExtractionService.extractVideoFrames(
      { id: videoId, youtube_id: youtubeId, duration },
      {
        ...options,
        onProgress: (percent) => {
          job.progress(percent);
        }
      }
    );

    // Update status
    await videoService.updateVideoStatus(videoId, 'frames_complete');

    return { frameCount: frames.length };
  } catch (error) {
    console.error(`Frame extraction failed for ${videoId}:`, error);
    await videoService.updateVideoStatus(videoId, 'frames_failed');
    throw error;
  }
});

// Event handlers
frameExtractionQueue.on('completed', (job, result) => {
  console.log(`Frame extraction completed for job ${job.id}: ${result.frameCount} frames`);
});

frameExtractionQueue.on('failed', (job, err) => {
  console.error(`Frame extraction failed for job ${job.id}:`, err.message);
});

frameExtractionQueue.on('progress', (job, progress) => {
  console.log(`Frame extraction progress for job ${job.id}: ${progress}%`);
});

module.exports = { frameExtractionQueue };
```

### 4. Create Analysis Job Service
Create `/home/pgc/vidlyx/server/src/services/analysisJobService.js`:

```javascript
const { frameExtractionQueue, analysisQueue } = require('../jobs/queue');
const db = require('./db');

/**
 * Start the full video analysis pipeline
 */
async function startVideoAnalysis(video) {
  // Create job record
  const job = await createJobRecord(video.id, 'full_analysis');

  // Add to queue
  await analysisQueue.add({
    videoId: video.id,
    youtubeId: video.youtube_id,
    duration: video.duration,
    jobId: job.id
  });

  return job;
}

/**
 * Queue frame extraction job
 */
async function queueFrameExtraction(video, options = {}) {
  const job = await createJobRecord(video.id, 'frames');

  await frameExtractionQueue.add({
    videoId: video.id,
    youtubeId: video.youtube_id,
    duration: video.duration,
    options
  }, {
    jobId: job.id
  });

  return job;
}

/**
 * Create job record in database
 */
async function createJobRecord(videoId, jobType) {
  const query = `
    INSERT INTO analysis_jobs (video_id, job_type, status)
    VALUES ($1, $2, 'pending')
    RETURNING *
  `;
  const result = await db.query(query, [videoId, jobType]);
  return result.rows[0];
}

/**
 * Update job progress
 */
async function updateJobProgress(jobId, progress) {
  const query = `
    UPDATE analysis_jobs
    SET progress = $1, updated_at = NOW()
    WHERE id = $2
  `;
  await db.query(query, [progress, jobId]);
}

/**
 * Get job status
 */
async function getJobStatus(videoId) {
  const query = `
    SELECT * FROM analysis_jobs
    WHERE video_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [videoId]);
  return result.rows;
}

module.exports = {
  startVideoAnalysis,
  queueFrameExtraction,
  createJobRecord,
  updateJobProgress,
  getJobStatus
};
```

### 5. Create Analysis Pipeline
Create `/home/pgc/vidlyx/server/src/jobs/analysisWorker.js`:

```javascript
const { analysisQueue, frameExtractionQueue } = require('./queue');
const videoService = require('../services/videoService');
const transcriptionService = require('../services/transcriptionService');
const analysisJobService = require('../services/analysisJobService');

// Main analysis pipeline
analysisQueue.process(async (job) => {
  const { videoId, youtubeId, duration } = job.data;

  try {
    // Step 1: Transcript (if not already done)
    job.progress(10);
    await transcriptionService.extractAndStoreTranscript(videoId, youtubeId);

    // Step 2: Frame extraction
    job.progress(20);
    const frameJob = await frameExtractionQueue.add({
      videoId,
      youtubeId,
      duration,
      options: { interval: 5 }
    });
    await frameJob.finished(); // Wait for frames
    job.progress(50);

    // Step 3: OCR (next subtask)
    job.progress(60);
    // await ocrService.processFrames(videoId);

    // Step 4: Vision analysis (next subtask)
    job.progress(70);
    // await visionService.analyzeFrames(videoId);

    // Step 5: Correlation (Task 4)
    job.progress(80);
    // await correlationService.correlate(videoId);

    // Step 6: Summary generation (Task 5)
    job.progress(90);
    // await summaryService.generate(videoId);

    // Done
    await videoService.updateVideoStatus(videoId, 'completed');
    job.progress(100);

    return { success: true };
  } catch (error) {
    await videoService.updateVideoStatus(videoId, 'failed');
    throw error;
  }
});
```

### 6. Start Workers on Server Startup
Update `app.js`:

```javascript
// Start background workers
require('./jobs/frameExtractionWorker');
require('./jobs/analysisWorker');

console.log('Background workers started');
```

### 7. Create Job Status API
Add to video routes:

```javascript
// GET /api/videos/:id/jobs
router.get('/:id/jobs', requireAuth, async (req, res) => {
  try {
    const jobs = await analysisJobService.getJobStatus(req.params.id);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/videos/:id/jobs/:jobId
router.get('/:id/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const job = await frameExtractionQueue.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({
      id: job.id,
      progress: job.progress(),
      state: await job.getState(),
      data: job.returnvalue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 8. Trigger Analysis on Video Creation
Update video creation flow:

```javascript
// In videoRoutes.js POST /api/videos
const video = await videoService.createVideo(userId, youtubeId);

// Start async analysis pipeline
analysisJobService.startVideoAnalysis(video)
  .catch(err => console.error('Failed to start analysis:', err));

res.json(video);
```

### 9. Frontend: Poll for Job Status
Create hook to poll job status:

```javascript
// useJobStatus.js
export function useJobStatus(videoId, interval = 2000) {
  const [jobs, setJobs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const poll = async () => {
      const response = await api.get(`/videos/${videoId}/jobs`);
      setJobs(response.data);

      const allComplete = response.data.every(
        j => j.status === 'completed' || j.status === 'failed'
      );
      setIsProcessing(!allComplete);
    };

    poll();
    const timer = setInterval(poll, interval);
    return () => clearInterval(timer);
  }, [videoId, interval]);

  return { jobs, isProcessing };
}
```

## Verification

### Queue Test:
```javascript
// Test adding a job
const { frameExtractionQueue } = require('./jobs/queue');
await frameExtractionQueue.add({ test: true });
console.log('Job added');
```

### Worker Test:
1. Start server with workers
2. Create new video analysis
3. Watch console for worker logs
4. Check job progress

### API Test:
```bash
curl http://localhost:4051/api/videos/VIDEO_ID/jobs -b cookies.txt
```

Should return array of job statuses.

### Redis Check (if using):
```bash
redis-cli
> KEYS bull:*
> LLEN bull:frame-extraction:wait
```

## Next Steps
Proceed to Task 3 - Subtask 3 (Tesseract.js OCR Integration)

## Estimated Time
2-3 hours

## Notes
- Bull queues persist jobs in Redis
- Without Redis, jobs are lost on server restart
- Consider adding job dashboard (bull-board)
- Set reasonable retry limits for failed jobs
- Clean up old jobs to prevent memory bloat
