/**
 * Analysis Job Service
 * Manages job records in the database and queues frame extraction jobs
 */

const pool = require('./db');
const { frameExtractionQueue, defaultJobOptions } = require('../jobs/queue');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new job record in the database
 * @param {string} videoId - Video UUID
 * @param {string} jobType - Type of job (frame_extraction, frame_analysis, etc.)
 * @param {Object} metadata - Additional job metadata (optional)
 * @returns {Promise<Object>} Created job record
 */
async function createJobRecord(videoId, jobType, metadata = null) {
  try {
    const query = `
      INSERT INTO analysis_jobs (
        id,
        video_id,
        job_type,
        status,
        progress,
        result,
        error_message,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, 'pending', 0, $4, NULL, NOW(), NOW())
      RETURNING *
    `;

    const jobId = uuidv4();
    const values = [
      jobId,
      videoId,
      jobType,
      metadata ? JSON.stringify(metadata) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];

  } catch (error) {
    throw new Error(`Failed to create job record: ${error.message}`);
  }
}

/**
 * Queue a frame extraction job
 * @param {Object} video - Video object from database
 * @param {Object} options - Frame extraction options
 * @param {number} options.interval - Interval in seconds between frames (default: 5)
 * @param {number} options.width - Output width in pixels (default: 1280)
 * @param {number} options.quality - JPEG quality 1-31 (2 is high quality, default: 2)
 * @param {number} options.maxFrames - Maximum number of frames to extract (optional)
 * @param {number} options.startTime - Start time in seconds (default: 0)
 * @param {number} options.endTime - End time in seconds (optional)
 * @returns {Promise<Object>} Created job record with Bull job info
 */
async function queueFrameExtraction(video, options = {}) {
  try {
    // Create job record in database
    const jobRecord = await createJobRecord(video.id, 'frame_extraction', {
      options: options
    });

    // Add job to Bull queue
    const bullJob = await frameExtractionQueue.add(
      {
        videoId: video.id,
        jobId: jobRecord.id,
        options: options
      },
      {
        ...defaultJobOptions,
        jobId: jobRecord.id, // Use our UUID as Bull job ID
        priority: options.priority || 10 // Lower number = higher priority
      }
    );

    console.log(`Frame extraction job queued: ${jobRecord.id} for video ${video.id}`);

    return {
      ...jobRecord,
      bullJobId: bullJob.id,
      queuePosition: await bullJob.getQueuePosition()
    };

  } catch (error) {
    throw new Error(`Failed to queue frame extraction: ${error.message}`);
  }
}

/**
 * Update job progress
 * @param {string} jobId - Job UUID
 * @param {number} progress - Progress percentage (0-100)
 * @param {Object} partialResult - Partial result data (optional)
 * @returns {Promise<Object>} Updated job record
 */
async function updateJobProgress(jobId, progress, partialResult = null) {
  try {
    const updates = ['progress = $1', 'updated_at = NOW()'];
    const values = [progress];
    let paramIndex = 2;

    if (partialResult !== null) {
      updates.push(`result = $${paramIndex++}`);
      values.push(JSON.stringify(partialResult));
    }

    values.push(jobId);

    const query = `
      UPDATE analysis_jobs
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error(`Job ${jobId} not found`);
    }

    return result.rows[0];

  } catch (error) {
    throw new Error(`Failed to update job progress: ${error.message}`);
  }
}

/**
 * Get all jobs for a video
 * @param {string} videoId - Video UUID
 * @param {Object} options - Query options
 * @param {string} options.jobType - Filter by job type (optional)
 * @param {string} options.status - Filter by status (optional)
 * @param {number} options.limit - Maximum number of jobs to return (default: 50)
 * @returns {Promise<Array<Object>>} Array of job records
 */
async function getJobsByVideoId(videoId, options = {}) {
  try {
    const { jobType, status, limit = 50 } = options;

    let query = `
      SELECT
        id,
        video_id,
        job_type,
        status,
        progress,
        result,
        error_message,
        created_at,
        updated_at,
        completed_at
      FROM analysis_jobs
      WHERE video_id = $1
    `;

    const values = [videoId];
    let paramIndex = 2;

    if (jobType) {
      query += ` AND job_type = $${paramIndex++}`;
      values.push(jobType);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;

  } catch (error) {
    throw new Error(`Failed to get jobs: ${error.message}`);
  }
}

/**
 * Get a single job by ID
 * @param {string} jobId - Job UUID
 * @returns {Promise<Object|null>} Job record or null if not found
 */
async function getJobById(jobId) {
  try {
    const query = `
      SELECT
        j.id,
        j.video_id,
        j.job_type,
        j.status,
        j.progress,
        j.result,
        j.error_message,
        j.created_at,
        j.updated_at,
        j.completed_at,
        v.youtube_id,
        v.title as video_title,
        v.analysis_status as video_status
      FROM analysis_jobs j
      JOIN videos v ON j.video_id = v.id
      WHERE j.id = $1
    `;

    const result = await pool.query(query, [jobId]);
    return result.rows[0] || null;

  } catch (error) {
    throw new Error(`Failed to get job: ${error.message}`);
  }
}

/**
 * Get job status with Bull queue information
 * @param {string} jobId - Job UUID
 * @returns {Promise<Object|null>} Job status with queue info
 */
async function getJobStatus(jobId) {
  try {
    // Get job from database
    const dbJob = await getJobById(jobId);

    if (!dbJob) {
      return null;
    }

    // Try to get Bull job information
    let bullJobInfo = null;
    try {
      const bullJob = await frameExtractionQueue.getJob(jobId);

      if (bullJob) {
        bullJobInfo = {
          bullJobId: bullJob.id,
          state: await bullJob.getState(),
          progress: bullJob.progress(),
          attemptsMade: bullJob.attemptsMade,
          processedOn: bullJob.processedOn,
          finishedOn: bullJob.finishedOn,
          failedReason: bullJob.failedReason
        };
      }
    } catch (bullError) {
      console.warn(`Could not fetch Bull job info for ${jobId}:`, bullError.message);
    }

    return {
      ...dbJob,
      queueInfo: bullJobInfo
    };

  } catch (error) {
    throw new Error(`Failed to get job status: ${error.message}`);
  }
}

/**
 * Cancel a job
 * @param {string} jobId - Job UUID
 * @returns {Promise<boolean>} True if cancelled successfully
 */
async function cancelJob(jobId) {
  try {
    // Try to remove from Bull queue
    try {
      const bullJob = await frameExtractionQueue.getJob(jobId);
      if (bullJob) {
        await bullJob.remove();
      }
    } catch (bullError) {
      console.warn(`Could not remove Bull job ${jobId}:`, bullError.message);
    }

    // Update database status
    const query = `
      UPDATE analysis_jobs
      SET status = 'cancelled',
          updated_at = NOW(),
          completed_at = NOW()
      WHERE id = $1 AND status IN ('pending', 'processing')
      RETURNING *
    `;

    const result = await pool.query(query, [jobId]);
    return result.rows.length > 0;

  } catch (error) {
    throw new Error(`Failed to cancel job: ${error.message}`);
  }
}

/**
 * Retry a failed job
 * @param {string} jobId - Job UUID
 * @returns {Promise<Object>} New job record
 */
async function retryJob(jobId) {
  try {
    // Get original job
    const originalJob = await getJobById(jobId);

    if (!originalJob) {
      throw new Error('Job not found');
    }

    if (originalJob.status !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }

    // Get video
    const videoQuery = 'SELECT * FROM videos WHERE id = $1';
    const videoResult = await pool.query(videoQuery, [originalJob.video_id]);
    const video = videoResult.rows[0];

    if (!video) {
      throw new Error('Video not found');
    }

    // Extract options from original job
    let options = {};
    try {
      if (originalJob.result) {
        const result = typeof originalJob.result === 'string'
          ? JSON.parse(originalJob.result)
          : originalJob.result;
        options = result.options || {};
      }
    } catch (parseError) {
      console.warn('Could not parse original job options:', parseError.message);
    }

    // Create new job
    return await queueFrameExtraction(video, options);

  } catch (error) {
    throw new Error(`Failed to retry job: ${error.message}`);
  }
}

module.exports = {
  createJobRecord,
  queueFrameExtraction,
  updateJobProgress,
  getJobsByVideoId,
  getJobById,
  getJobStatus,
  cancelJob,
  retryJob
};
