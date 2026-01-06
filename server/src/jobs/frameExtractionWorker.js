/**
 * Frame Extraction Worker
 * Processes frame extraction jobs from the queue
 */

const { frameExtractionQueue } = require('./queue');
const frameExtractionService = require('../services/frameExtractionService');
const videoService = require('../services/videoService');
const pool = require('../services/db');

/**
 * Update analysis job status and progress
 * @param {string} jobId - Job ID (UUID)
 * @param {string} status - Job status (pending, processing, completed, failed)
 * @param {number} progress - Progress percentage (0-100)
 * @param {Object} result - Job result data (optional)
 * @param {string} errorMessage - Error message (optional)
 */
async function updateJobStatus(jobId, status, progress = 0, result = null, errorMessage = null) {
  try {
    const query = `
      UPDATE analysis_jobs
      SET status = $1,
          progress = $2,
          result = $3,
          error_message = $4,
          updated_at = NOW(),
          completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE completed_at END
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      status,
      progress,
      result ? JSON.stringify(result) : null,
      errorMessage,
      jobId
    ];

    const queryResult = await pool.query(query, values);
    return queryResult.rows[0];
  } catch (error) {
    console.error(`Failed to update job ${jobId}:`, error.message);
    throw error;
  }
}

/**
 * Process frame extraction job
 */
frameExtractionQueue.process(async (job) => {
  const { videoId, jobId, options } = job.data;

  console.log(`Processing frame extraction for video ${videoId}, job ${jobId}`);

  try {
    // Update video status to extracting_frames
    await videoService.updateVideoStatus(videoId, 'extracting_frames');

    // Update job status to processing
    await updateJobStatus(jobId, 'processing', 10);

    // Get video details
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Report progress: Starting extraction
    await job.progress(20);
    await updateJobStatus(jobId, 'processing', 20);

    // Extract frames using frameExtractionService
    const extractedFrames = await frameExtractionService.extractVideoFrames(video, options);

    // Report progress: Extraction complete
    await job.progress(90);
    await updateJobStatus(jobId, 'processing', 90);

    // Update video status to frames_complete
    await videoService.updateVideoStatus(videoId, 'frames_complete');

    // Mark job as completed
    const result = {
      frameCount: extractedFrames.length,
      videoId: videoId,
      completedAt: new Date().toISOString()
    };

    await updateJobStatus(jobId, 'completed', 100, result);
    await job.progress(100);

    console.log(`Frame extraction completed for video ${videoId}: ${extractedFrames.length} frames`);

    return result;

  } catch (error) {
    console.error(`Frame extraction failed for video ${videoId}:`, error.message);

    // Update video status to frames_failed
    try {
      await videoService.updateVideoStatus(videoId, 'frames_failed');
    } catch (statusError) {
      console.error('Failed to update video status:', statusError.message);
    }

    // Update job status to failed
    try {
      await updateJobStatus(jobId, 'failed', job.progress() || 0, null, error.message);
    } catch (jobError) {
      console.error('Failed to update job status:', jobError.message);
    }

    // Re-throw error so Bull can handle retry logic
    throw error;
  }
});

// Event handlers for job lifecycle
frameExtractionQueue.on('completed', async (job, result) => {
  console.log(`Frame extraction job ${job.id} completed:`, result);
});

frameExtractionQueue.on('failed', async (job, error) => {
  console.error(`Frame extraction job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);

  // If all retries exhausted, ensure job is marked as failed
  if (job.attemptsMade >= job.opts.attempts) {
    console.error(`Job ${job.id} exhausted all retry attempts`);
    try {
      const { jobId, videoId } = job.data;
      await updateJobStatus(jobId, 'failed', job.progress() || 0, null, `Failed after ${job.attemptsMade} attempts: ${error.message}`);
      await videoService.updateVideoStatus(videoId, 'frames_failed');
    } catch (updateError) {
      console.error('Failed to mark job as permanently failed:', updateError.message);
    }
  }
});

frameExtractionQueue.on('progress', (job, progress) => {
  console.log(`Frame extraction job ${job.id} progress: ${progress}%`);
});

frameExtractionQueue.on('stalled', (job) => {
  console.warn(`Frame extraction job ${job.id} has stalled`);
});

// Log when worker is ready
console.log('Frame extraction worker initialized and ready to process jobs');

module.exports = frameExtractionQueue;
