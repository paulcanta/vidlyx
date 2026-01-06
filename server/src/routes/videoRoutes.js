/**
 * Video routes for managing video analysis
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const videoService = require('../services/videoService');
const youtubeService = require('../services/youtubeService');
const analysisJobService = require('../services/analysisJobService');
const linkageService = require('../services/linkageService');
const correlationService = require('../services/correlationService');
const summaryService = require('../services/summaryService');
const sectionDetectionService = require('../services/sectionDetectionService');
const { extractVideoId, isValidYouTubeUrl, buildYouTubeUrl, getThumbnailUrl } = require('../utils/youtube');

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/videos
 * Create a new video for analysis
 */
router.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;

    // Validate URL is provided
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Validate URL format and extract video ID
    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({
        error: 'Invalid YouTube URL',
        message: 'Please provide a valid YouTube URL in one of these formats: youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID, youtube.com/embed/VIDEO_ID, or youtube.com/v/VIDEO_ID'
      });
    }

    const youtubeId = extractVideoId(url);

    // Check if video already exists for this user
    const existingVideo = await videoService.findVideoByYoutubeId(req.user.id, youtubeId);
    if (existingVideo) {
      return res.status(200).json({
        message: 'Video already exists',
        video: existingVideo,
        existing: true
      });
    }

    // Create new video record
    const video = await videoService.createVideo(req.user.id, youtubeId, url);

    // Add computed fields
    const videoWithExtras = {
      ...video,
      youtube_url: buildYouTubeUrl(youtubeId),
      thumbnail_url: video.thumbnail_url || getThumbnailUrl(youtubeId)
    };

    res.status(201).json({
      message: 'Video created successfully',
      video: videoWithExtras,
      existing: false
    });

    // Trigger async video processing (don't await - runs in background)
    youtubeService.processVideo(video)
      .then(() => console.log(`Video ${video.id} processing completed`))
      .catch((err) => console.error(`Video ${video.id} processing failed:`, err.message));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos
 * Get all videos for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      limit = 10,
      offset = 0,
      orderBy = 'created_at',
      orderDir = 'DESC'
    } = req.query;

    const options = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      orderBy,
      orderDir
    };

    const result = await videoService.findVideosByUser(req.user.id, options);

    // Add computed fields to each video
    const videosWithExtras = result.videos.map(video => ({
      ...video,
      youtube_url: buildYouTubeUrl(video.youtube_id),
      thumbnail_url: video.thumbnail_url || getThumbnailUrl(video.youtube_id)
    }));

    res.json({
      videos: videosWithExtras,
      total: result.total,
      limit: options.limit,
      offset: options.offset
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id
 * Get a single video by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if video belongs to user
    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add computed fields
    const videoWithExtras = {
      ...video,
      youtube_url: buildYouTubeUrl(video.youtube_id),
      thumbnail_url: video.thumbnail_url || getThumbnailUrl(video.youtube_id)
    };

    res.json({ video: videoWithExtras });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/videos/:id
 * Delete a video
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // First, check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the video
    await videoService.deleteVideo(videoId);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/transcript
 * Get video transcript
 */
router.get('/:id/transcript', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // First, check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get transcript
    const transcript = await youtubeService.getTranscriptByVideoId(videoId);

    if (!transcript) {
      return res.status(404).json({
        error: 'Transcript not found',
        message: 'Transcript may still be processing or not available for this video'
      });
    }

    res.json({ transcript });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/transcript/search
 * Search within video transcript
 */
router.get('/:id/transcript/search', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // First, check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Search transcript
    const matches = await youtubeService.searchTranscript(videoId, q.trim());

    res.json({
      query: q,
      matches,
      count: matches.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/status
 * Get video analysis status
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate progress based on status
    const statusProgress = {
      pending: 0,
      processing: 25,
      metadata_complete: 50,
      transcript_complete: 75,
      transcript_unavailable: 75,
      extracting_frames: 80,
      frames_complete: 90,
      frames_failed: 75,
      completed: 100,
      failed: 0
    };

    const statusSteps = {
      pending: { metadata: 'pending', transcript: 'pending', frames: 'pending' },
      processing: { metadata: 'processing', transcript: 'pending', frames: 'pending' },
      metadata_complete: { metadata: 'completed', transcript: 'processing', frames: 'pending' },
      transcript_complete: { metadata: 'completed', transcript: 'completed', frames: 'pending' },
      transcript_unavailable: { metadata: 'completed', transcript: 'unavailable', frames: 'pending' },
      extracting_frames: { metadata: 'completed', transcript: 'completed', frames: 'processing' },
      frames_complete: { metadata: 'completed', transcript: 'completed', frames: 'completed' },
      frames_failed: { metadata: 'completed', transcript: 'completed', frames: 'failed' },
      completed: { metadata: 'completed', transcript: 'completed', frames: 'completed' },
      failed: { metadata: 'failed', transcript: 'failed', frames: 'failed' }
    };

    res.json({
      status: video.analysis_status,
      progress: statusProgress[video.analysis_status] || 0,
      steps: statusSteps[video.analysis_status] || {}
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/jobs
 * Get all jobs for a video
 */
router.get('/:id/jobs', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const { jobType, status, limit } = req.query;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get jobs
    const jobs = await analysisJobService.getJobsByVideoId(videoId, {
      jobType,
      status,
      limit: limit ? parseInt(limit, 10) : undefined
    });

    res.json({
      videoId,
      jobs,
      count: jobs.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/jobs/:jobId
 * Get specific job details with progress
 */
router.get('/:id/jobs/:jobId', async (req, res, next) => {
  try {
    const { id: videoId, jobId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId) || !uuidRegex.test(jobId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get job status with queue info
    const jobStatus = await analysisJobService.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify job belongs to this video
    if (jobStatus.video_id !== videoId) {
      return res.status(403).json({ error: 'Job does not belong to this video' });
    }

    res.json({
      job: jobStatus
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/jobs/:jobId/cancel
 * Cancel a running job
 */
router.post('/:id/jobs/:jobId/cancel', async (req, res, next) => {
  try {
    const { id: videoId, jobId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId) || !uuidRegex.test(jobId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get job to verify it belongs to this video
    const job = await analysisJobService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.video_id !== videoId) {
      return res.status(403).json({ error: 'Job does not belong to this video' });
    }

    // Cancel the job
    const cancelled = await analysisJobService.cancelJob(jobId);

    if (!cancelled) {
      return res.status(400).json({
        error: 'Job cannot be cancelled',
        message: 'Job may already be completed, failed, or cancelled'
      });
    }

    res.json({
      message: 'Job cancelled successfully',
      jobId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/jobs/:jobId/retry
 * Retry a failed job
 */
router.post('/:id/jobs/:jobId/retry', async (req, res, next) => {
  try {
    const { id: videoId, jobId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId) || !uuidRegex.test(jobId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get job to verify it belongs to this video
    const job = await analysisJobService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.video_id !== videoId) {
      return res.status(403).json({ error: 'Job does not belong to this video' });
    }

    // Retry the job
    const newJob = await analysisJobService.retryJob(jobId);

    res.json({
      message: 'Job queued for retry',
      originalJobId: jobId,
      newJob
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/analyze-frames
 * Start complete frame analysis pipeline (extract, OCR, vision analysis)
 */
router.post('/:id/analyze-frames', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const {
      frameInterval,
      maxFrames,
      ocrEnabled,
      visionEnabled,
      visionSampleRate
    } = req.body;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create analysis job
    const job = await analysisJobService.createJob(videoId, 'frame-analysis-pipeline', {
      frameInterval,
      maxFrames,
      ocrEnabled,
      visionEnabled,
      visionSampleRate
    });

    res.status(202).json({
      message: 'Frame analysis pipeline started',
      job
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/analysis-status
 * Get detailed pipeline status with frame counts
 */
router.get('/:id/analysis-status', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Import frameAnalysisPipeline service
    const frameAnalysisPipeline = require('../services/frameAnalysisPipeline');

    // Get pipeline status
    const pipelineStatus = await frameAnalysisPipeline.getPipelineStatus(videoId);

    // Add video metadata
    const response = {
      ...pipelineStatus,
      video: {
        id: video.id,
        title: video.title,
        status: video.analysis_status,
        visualOverview: video.visual_overview
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/segments/:start/:end/frames
 * Get frames linked to a transcript segment
 */
router.get('/:id/segments/:start/:end/frames', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const startTime = parseFloat(req.params.start);
    const endTime = parseFloat(req.params.end);

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Validate time parameters
    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({ error: 'Invalid time parameters' });
    }

    if (startTime < 0 || endTime < 0 || startTime > endTime) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get frames for this segment
    const frames = await linkageService.getFramesForSegment(videoId, startTime, endTime);

    res.json({
      videoId,
      segment: {
        start: startTime,
        end: endTime
      },
      frames,
      count: frames.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/frames/at/:timestamp
 * Get best matching frame at a specific timestamp
 */
router.get('/:id/frames/at/:timestamp', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const timestamp = parseFloat(req.params.timestamp);

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Validate timestamp parameter
    if (isNaN(timestamp)) {
      return res.status(400).json({ error: 'Invalid timestamp parameter' });
    }

    if (timestamp < 0) {
      return res.status(400).json({ error: 'Timestamp must be non-negative' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get best frame for this timestamp
    const frame = await linkageService.getBestFrameForTime(videoId, timestamp);

    if (!frame) {
      return res.status(404).json({
        error: 'No frame found',
        message: 'No frames available for this video'
      });
    }

    res.json({
      videoId,
      timestamp,
      frame
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/correlate
 * Trigger correlation analysis for a video
 */
router.post('/:id/correlate', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Run correlation
    const result = await correlationService.correlateVideoContent(videoId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Correlation failed',
        message: result.message
      });
    }

    res.json({
      message: 'Correlation completed successfully',
      result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/correlations
 * Get all frame-transcript correlations for a video
 */
router.get('/:id/correlations', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const {
      minScore = 30,
      limit = 100
    } = req.query;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get correlations
    const correlations = await linkageService.getVideoCorrelations(videoId, {
      minScore: parseFloat(minScore),
      limit: parseInt(limit, 10)
    });

    // Get correlation statistics
    const stats = await linkageService.getCorrelationStats(videoId);

    res.json({
      videoId,
      correlations,
      count: correlations.length,
      stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/correlations/by-time/:timestamp
 * Get correlations at a specific timestamp
 */
router.get('/:id/correlations/by-time/:timestamp', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const timestamp = parseFloat(req.params.timestamp);

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Timestamp validation
    if (isNaN(timestamp) || timestamp < 0) {
      return res.status(400).json({ error: 'Invalid timestamp' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get buffer from query params (default: 2 seconds)
    const buffer = req.query.buffer ? parseFloat(req.query.buffer) : 2;

    // Get correlations at this timestamp
    const correlations = await correlationService.getCorrelationsByTime(videoId, timestamp, buffer);

    res.json({
      videoId,
      timestamp,
      buffer,
      correlations,
      count: correlations.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/sections
 * Get all sections for a video
 */
router.get('/:id/sections', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get sections
    const sections = await sectionDetectionService.getSections(videoId);

    res.json({
      videoId,
      sections,
      count: sections.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/detect-sections
 * Trigger section detection for a video
 */
router.post('/:id/detect-sections', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Trigger section detection
    const result = await sectionDetectionService.detectSections(videoId);

    res.json({
      message: 'Section detection completed successfully',
      ...result
    });
  } catch (error) {
    if (error.message.includes('No transcript available')) {
      return res.status(400).json({
        error: 'No transcript available',
        message: 'This video does not have a transcript. Please ensure the video has been processed and has a transcript.'
      });
    }
    next(error);
  }
});

/**
 * GET /api/videos/:id/sections/:sectionId
 * Get a single section by ID
 */
router.get('/:id/sections/:sectionId', async (req, res, next) => {
  try {
    const { id: videoId, sectionId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId) || !uuidRegex.test(sectionId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get section
    const sectionService = require('../services/sectionService');
    const section = await sectionService.getSectionById(sectionId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Verify section belongs to this video
    if (section.video_id !== videoId) {
      return res.status(403).json({ error: 'Section does not belong to this video' });
    }

    res.json({ section });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/videos/:id/sections/:sectionId
 * Update a section
 */
router.put('/:id/sections/:sectionId', async (req, res, next) => {
  try {
    const { id: videoId, sectionId } = req.params;
    const { title, summary, key_points } = req.body;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId) || !uuidRegex.test(sectionId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get section to verify it belongs to this video
    const sectionService = require('../services/sectionService');
    const section = await sectionService.getSectionById(sectionId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    if (section.video_id !== videoId) {
      return res.status(403).json({ error: 'Section does not belong to this video' });
    }

    // Update section
    const updatedSection = await sectionService.updateSection(sectionId, {
      title,
      summary,
      key_points
    });

    res.json({
      message: 'Section updated successfully',
      section: updatedSection
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/full-summary
 * Get full video summary with metadata
 */
router.get('/:id/full-summary', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get video summary
    const summary = await summaryService.getVideoSummary(videoId);

    if (!summary) {
      return res.status(404).json({
        error: 'Video summary not found',
        message: 'Summary has not been generated for this video yet. Use POST /api/videos/:id/generate-full-summary to generate one.'
      });
    }

    // Parse JSONB fields
    const summaryData = {
      id: summary.id,
      video_id: summary.video_id,
      full_summary: summary.full_summary,
      key_takeaways: summary.key_takeaways,
      topics: summary.topics,
      target_audience: summary.target_audience,
      difficulty_level: summary.difficulty_level,
      estimated_value: summary.estimated_value,
      recommended_for: summary.recommended_for,
      prerequisites: summary.prerequisites,
      created_at: summary.created_at,
      updated_at: summary.updated_at
    };

    // Add video metadata
    const response = {
      summary: summaryData,
      video: {
        id: video.id,
        title: video.title,
        channel_name: video.channel_name,
        duration: video.duration,
        duration_formatted: summaryService.formatDuration(video.duration),
        thumbnail_url: video.thumbnail_url,
        youtube_url: buildYouTubeUrl(video.youtube_id)
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/generate-full-summary
 * Trigger full video summary generation
 */
router.post('/:id/generate-full-summary', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if video has been processed
    if (video.analysis_status === 'pending' || video.analysis_status === 'processing') {
      return res.status(400).json({
        error: 'Video not ready',
        message: 'Video is still being processed. Please wait until processing is complete.'
      });
    }

    // Generate summary
    console.log(`Generating full summary for video ${videoId}...`);
    const summary = await summaryService.generateEnhancedVideoSummary(videoId);

    // Parse JSONB fields for response
    const summaryData = {
      id: summary.id,
      video_id: summary.video_id,
      full_summary: summary.full_summary,
      key_takeaways: summary.key_takeaways,
      topics: summary.topics,
      target_audience: summary.target_audience,
      difficulty_level: summary.difficulty_level,
      estimated_value: summary.estimated_value,
      recommended_for: summary.recommended_for,
      prerequisites: summary.prerequisites,
      created_at: summary.created_at,
      updated_at: summary.updated_at
    };

    res.status(201).json({
      message: 'Video summary generated successfully',
      summary: summaryData,
      video: {
        id: video.id,
        title: video.title,
        duration_formatted: summaryService.formatDuration(video.duration)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/generate-summaries
 * Generate AI-powered summaries for video sections and full video
 */
router.post('/:id/generate-summaries', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Track progress
    let currentProgress = 0;
    const progressCallback = (percentage) => {
      currentProgress = percentage;
      console.log(`Summary generation progress: ${percentage}%`);
    };

    // Step 1: Generate section summaries
    console.log(`Starting section summary generation for video: ${videoId}`);
    const sectionResult = await summaryService.generateAllSectionSummaries(videoId, progressCallback);

    if (!sectionResult.success) {
      return res.status(400).json({
        error: 'Failed to generate section summaries',
        message: sectionResult.message,
        stats: {
          processed: sectionResult.processed,
          failed: sectionResult.failed,
          total: sectionResult.total
        }
      });
    }

    // Step 2: Generate full video summary if sections were processed
    let videoSummaryResult = null;
    if (sectionResult.processed > 0) {
      console.log(`Generating full video summary for video: ${videoId}`);
      try {
        videoSummaryResult = await summaryService.generateFullVideoSummary(videoId);
      } catch (error) {
        console.error('Failed to generate full video summary:', error.message);
        // Continue anyway - section summaries were successful
      }
    }

    res.json({
      message: 'Summary generation completed',
      sections: {
        processed: sectionResult.processed,
        failed: sectionResult.failed,
        total: sectionResult.total,
        message: sectionResult.message
      },
      videoSummary: videoSummaryResult ? {
        success: videoSummaryResult.success,
        summary: videoSummaryResult.summary
      } : {
        success: false,
        message: 'Video summary not generated'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/key-points
 * Get key points for a video with optional category filter
 */
router.get('/:id/key-points', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const { category } = req.query;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get key points with optional filter
    const keyPoints = await summaryService.getKeyPoints(videoId, { category });

    res.json({
      videoId,
      keyPoints,
      count: keyPoints.length,
      filter: category || 'all'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/extract-key-points
 * Extract and store key points for a video using AI
 */
router.post('/:id/extract-key-points', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if video has sections
    const sections = await summaryService.getSections(videoId);
    if (!sections || sections.length === 0) {
      return res.status(400).json({
        error: 'No sections available',
        message: 'Please detect sections first using POST /api/videos/:id/detect-sections'
      });
    }

    // Extract and store key points
    console.log(`Extracting key points for video ${videoId}...`);
    const keyPoints = await summaryService.extractAndStoreKeyPoints(videoId);

    res.status(201).json({
      message: 'Key points extracted successfully',
      keyPoints,
      count: keyPoints.length,
      videoId
    });
  } catch (error) {
    if (error.message.includes('No sections found')) {
      return res.status(400).json({
        error: 'No sections available',
        message: 'Please detect sections first using POST /api/videos/:id/detect-sections'
      });
    }
    next(error);
  }
});

/**
 * GET /api/videos/:id/comprehensive-analysis
 * Get comprehensive video analysis in markdown format
 */
router.get('/:id/comprehensive-analysis', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get comprehensive analysis
    const analysis = await summaryService.getComprehensiveAnalysis(videoId);

    if (!analysis) {
      return res.status(404).json({
        error: 'Comprehensive analysis not found',
        message: 'Use POST /api/videos/:id/generate-comprehensive-analysis to generate one.'
      });
    }

    res.json({
      videoId,
      comprehensive_analysis: analysis,
      video: {
        id: video.id,
        title: video.title,
        channel_name: video.channel_name,
        duration: video.duration,
        youtube_id: video.youtube_id
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/generate-comprehensive-analysis
 * Generate comprehensive video analysis in markdown format
 */
router.post('/:id/generate-comprehensive-analysis', async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if video has been processed
    if (video.analysis_status === 'pending' || video.analysis_status === 'processing') {
      return res.status(400).json({
        error: 'Video not ready',
        message: 'Video is still being processed. Please wait until processing is complete.'
      });
    }

    // Generate comprehensive analysis
    console.log(`Generating comprehensive analysis for video ${videoId}...`);
    const result = await summaryService.generateComprehensiveAnalysis(videoId);

    res.status(201).json({
      message: 'Comprehensive analysis generated successfully',
      videoId,
      comprehensive_analysis: result.comprehensive_analysis,
      stats: result.stats,
      video: {
        id: video.id,
        title: video.title,
        channel_name: video.channel_name
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
