/**
 * Frame Analysis Pipeline Worker
 * Processes complete frame analysis pipeline jobs from the Bull queue
 */

const { analysisQueue } = require('./queue');
const frameAnalysisPipeline = require('../services/frameAnalysisPipeline');
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
          started_at = CASE WHEN $1 = 'processing' AND started_at IS NULL THEN NOW() ELSE started_at END,
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
 * Process frame analysis pipeline job
 */
analysisQueue.process('frame-analysis-pipeline', async (job) => {
  const { videoId, jobId, options = {} } = job.data;

  console.log(`[PipelineWorker] Processing frame analysis pipeline for video ${videoId}, job ${jobId}`);

  try {
    // Update video status to analyzing_frames
    await videoService.updateVideoStatus(videoId, 'analyzing_frames');

    // Update job status to processing
    await updateJobStatus(jobId, 'processing', 0);

    // Get video details
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Prepare pipeline options with callbacks
    const pipelineOptions = {
      ...options,
      onProgress: async (progress, step, message) => {
        // Update Bull job progress
        await job.progress(progress);

        // Update database job progress
        await updateJobStatus(jobId, 'processing', progress);

        console.log(`[PipelineWorker] ${video.id} - ${step}: ${progress}% - ${message}`);
      },
      onStepChange: async (step, stepLabel) => {
        console.log(`[PipelineWorker] ${video.id} - Starting step: ${stepLabel}`);
      }
    };

    // Run the complete pipeline
    const pipelineResult = await frameAnalysisPipeline.runPipeline(video, pipelineOptions);

    // Update video status to frames_analyzed
    await videoService.updateVideoStatus(videoId, 'frames_analyzed');

    // Prepare job result
    const jobResult = {
      videoId: videoId,
      stats: pipelineResult.stats,
      steps: {
        extraction: pipelineResult.steps.extraction,
        ocr: pipelineResult.steps.ocr,
        vision: pipelineResult.steps.vision,
        postProcess: pipelineResult.steps.postProcess
      },
      startTime: pipelineResult.startTime,
      endTime: pipelineResult.endTime,
      duration: (new Date(pipelineResult.endTime) - new Date(pipelineResult.startTime)) / 1000,
      completedAt: new Date().toISOString()
    };

    // Mark job as completed
    await updateJobStatus(jobId, 'completed', 100, jobResult);
    await job.progress(100);

    console.log(`[PipelineWorker] Frame analysis pipeline completed for video ${videoId}`);
    console.log(`[PipelineWorker] Stats:`, pipelineResult.stats);

    return jobResult;

  } catch (error) {
    console.error(`[PipelineWorker] Frame analysis pipeline failed for video ${videoId}:`, error.message);
    console.error(error.stack);

    // Update video status to frame_analysis_failed
    try {
      await videoService.updateVideoStatus(videoId, 'frame_analysis_failed');
    } catch (statusError) {
      console.error('[PipelineWorker] Failed to update video status:', statusError.message);
    }

    // Update job status to failed
    try {
      await updateJobStatus(
        jobId,
        'failed',
        job.progress() || 0,
        null,
        error.message
      );
    } catch (jobError) {
      console.error('[PipelineWorker] Failed to update job status:', jobError.message);
    }

    // Re-throw error so Bull can handle retry logic
    throw error;
  }
});

// Event handlers for job lifecycle
analysisQueue.on('completed', async (job, result) => {
  if (job.data.jobId) {
    console.log(`[PipelineWorker] Frame analysis pipeline job ${job.id} completed successfully`);
    console.log(`[PipelineWorker] Processed ${result.stats.framesExtracted} frames`);
  }
});

analysisQueue.on('failed', async (job, error) => {
  if (job.data.jobId) {
    console.error(`[PipelineWorker] Frame analysis pipeline job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);

    // If all retries exhausted, ensure job is marked as failed
    if (job.attemptsMade >= job.opts.attempts) {
      console.error(`[PipelineWorker] Job ${job.id} exhausted all retry attempts`);
      try {
        const { jobId, videoId } = job.data;
        await updateJobStatus(
          jobId,
          'failed',
          job.progress() || 0,
          null,
          `Failed after ${job.attemptsMade} attempts: ${error.message}`
        );
        await videoService.updateVideoStatus(videoId, 'frame_analysis_failed');
      } catch (updateError) {
        console.error('[PipelineWorker] Failed to mark job as permanently failed:', updateError.message);
      }
    }
  }
});

analysisQueue.on('progress', (job, progress) => {
  if (job.data.jobId) {
    console.log(`[PipelineWorker] Frame analysis pipeline job ${job.id} progress: ${progress}%`);
  }
});

analysisQueue.on('stalled', (job) => {
  if (job.data.jobId) {
    console.warn(`[PipelineWorker] Frame analysis pipeline job ${job.id} has stalled`);
  }
});

analysisQueue.on('active', (job) => {
  if (job.data.jobId) {
    console.log(`[PipelineWorker] Frame analysis pipeline job ${job.id} started processing`);
  }
});

// Log when worker is ready
console.log('[PipelineWorker] Frame analysis pipeline worker initialized and ready to process jobs');

module.exports = analysisQueue;
