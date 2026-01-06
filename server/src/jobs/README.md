# Frame Extraction Background Jobs

This directory contains the Bull queue configuration and workers for background job processing.

## Overview

The frame extraction worker processes video frame extraction jobs asynchronously using Bull queues. Jobs are tracked in the `analysis_jobs` database table.

## Components

### 1. queue.js
- Configures Bull queues for frame extraction and analysis
- Supports Redis (localhost:6379) or falls back to in-memory mode
- Provides health check and cleanup functions
- Default job options: 3 retry attempts with exponential backoff

### 2. frameExtractionWorker.js
- Processes frame extraction jobs from the queue
- Updates video status during processing (extracting_frames, frames_complete, frames_failed)
- Reports job progress to database
- Handles job failures with automatic retries

## Usage Example

```javascript
const analysisJobService = require('../services/analysisJobService');
const videoService = require('../services/videoService');

// Get video
const video = await videoService.findVideoById(videoId);

// Queue frame extraction job
const job = await analysisJobService.queueFrameExtraction(video, {
  interval: 5,        // Extract frame every 5 seconds
  width: 1280,        // Output width in pixels
  quality: 2,         // JPEG quality (2 = high quality)
  maxFrames: 100,     // Optional: limit number of frames
  startTime: 0,       // Optional: start time in seconds
  endTime: null       // Optional: end time in seconds
});

console.log('Job queued:', job.id);

// Check job status
const status = await analysisJobService.getJobStatus(job.id);
console.log('Progress:', status.progress, '%');

// Get all jobs for a video
const jobs = await analysisJobService.getJobsByVideoId(videoId);

// Cancel a job
await analysisJobService.cancelJob(jobId);

// Retry a failed job
await analysisJobService.retryJob(jobId);
```

## API Endpoints

### Get all jobs for a video
```
GET /api/videos/:id/jobs?jobType=frame_extraction&status=processing
```

### Get specific job details
```
GET /api/videos/:id/jobs/:jobId
```

### Cancel a job
```
POST /api/videos/:id/jobs/:jobId/cancel
```

### Retry a failed job
```
POST /api/videos/:id/jobs/:jobId/retry
```

## Video Status Flow

1. `pending` - Video created, not yet processing
2. `processing` - Fetching metadata
3. `metadata_complete` - Metadata fetched, fetching transcript
4. `transcript_complete` - Transcript fetched
5. `extracting_frames` - Frame extraction in progress
6. `frames_complete` - Frame extraction completed
7. `completed` - All processing complete

Error states:
- `frames_failed` - Frame extraction failed
- `failed` - General failure

## Queue Health

Check queue health:
```javascript
const { getQueueHealth } = require('./queue');
const health = await getQueueHealth();
console.log(health);
```

## Environment Variables

- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)

If Redis is not available, Bull will use in-memory mode (jobs won't persist across restarts).

## Graceful Shutdown

The queues are automatically closed on server shutdown (SIGTERM/SIGINT) to ensure jobs complete gracefully.
