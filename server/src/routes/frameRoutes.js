/**
 * Frame routes for managing video frames, OCR, and vision analysis
 */

const express = require('express');
const router = express.Router();
const usageRouter = express.Router();
const publicRouter = express.Router(); // Public routes (no auth required)
const fs = require('fs').promises;
const { requireAuth } = require('../middleware/auth');
const ocrService = require('../services/ocrService');
const videoService = require('../services/videoService');
const frameExtractionService = require('../services/frameExtractionService');
const visionAnalysisService = require('../services/visionAnalysisService');
const geminiService = require('../services/geminiService');
const linkageService = require('../services/linkageService');
const pool = require('../services/db');

// All routes require authentication
router.use(requireAuth);

/**
 * PUBLIC ROUTES (no authentication required)
 * These routes serve static frame images that can be loaded by <img> tags
 */

/**
 * GET /api/frames/image/:frameId
 * Serve frame image file (PUBLIC - no auth required for <img> tags)
 */
publicRouter.get('/image/:frameId', async (req, res, next) => {
  try {
    const { frameId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(frameId)) {
      return res.status(400).json({ error: 'Invalid frame ID' });
    }

    // Get frame
    const frame = await frameExtractionService.getFrameById(frameId);

    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Check if file exists
    try {
      await fs.access(frame.frame_path);
    } catch (error) {
      return res.status(404).json({ error: 'Frame image file not found' });
    }

    // Set caching headers for images
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    // Override Helmet's Cross-Origin-Resource-Policy to allow cross-origin image loading
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Send file
    res.sendFile(frame.frame_path);

  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to transform frame data for frontend consumption
 * @param {Object} frame - Frame object from database
 * @returns {Object} Transformed frame with computed fields and URLs
 */
function transformFrame(frame) {
  // Use full URL for images since frontend is on a different port
  const serverUrl = process.env.SERVER_URL || 'http://localhost:4051';
  return {
    ...frame,
    timestamp: frame.timestamp_seconds,
    // Use public endpoint for images (no auth required for <img> tags)
    image_url: `${serverUrl}/api/frames/image/${frame.id}`,
    thumbnail_url: `${serverUrl}/api/frames/image/${frame.id}`,
    has_text: !!(frame.on_screen_text && frame.on_screen_text.trim().length > 0),
    has_analysis: !!(frame.scene_description || frame.visual_elements),
    ocr_text: frame.on_screen_text
  };
}

/**
 * GET /api/videos/:id/frames
 * Get all frames for a video
 */
router.get('/:id/frames', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const {
      limit = 50,
      offset = 0,
      minConfidence = 0,
      onlyWithText = false
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

    // Get frames
    const result = await ocrService.getFramesWithOCR(videoId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      minConfidence: parseFloat(minConfidence),
      onlyWithText: onlyWithText === 'true' || onlyWithText === '1'
    });

    // Transform frames to include image URLs and computed fields
    const transformedFrames = result.frames.map(transformFrame);

    res.json({
      ...result,
      frames: transformedFrames
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/frames/ocr
 * Get frames with OCR text for a video
 */
router.get('/:id/frames/ocr', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const {
      limit = 50,
      offset = 0,
      minConfidence = 0
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

    // Get frames with OCR text only
    const result = await ocrService.getFramesWithOCR(videoId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      minConfidence: parseFloat(minConfidence),
      onlyWithText: true
    });

    // Transform frames to include image URLs and computed fields
    const transformedFrames = result.frames.map(transformFrame);

    res.json({
      ...result,
      frames: transformedFrames
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/frames/search
 * Search frames by OCR text
 */
router.get('/:id/frames/search', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const { q } = req.query;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Validate search query
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Check if video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Search frames by text
    const frames = await ocrService.searchFramesByText(videoId, q.trim());

    // Transform frames to include image URLs and computed fields
    const transformedFrames = frames.map(transformFrame);

    res.json({
      query: q.trim(),
      frames: transformedFrames,
      count: transformedFrames.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/frames/process-ocr
 * Trigger OCR processing for all frames of a video
 */
router.post('/:id/frames/process-ocr', async (req, res, next) => {
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

    // Start OCR processing asynchronously
    res.json({
      message: 'OCR processing started',
      videoId
    });

    // Process frames in background
    try {
      const result = await ocrService.processVideoFrames(videoId, (progress) => {
        console.log(`OCR Progress for video ${videoId}: ${progress.percentage}% (${progress.current}/${progress.total})`);
      });

      console.log(`OCR processing completed for video ${videoId}:`, result);
    } catch (error) {
      console.error(`OCR processing failed for video ${videoId}:`, error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/frames/extract
 * Extract frames from a video
 */
router.post('/:id/frames/extract', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const {
      interval = 5,
      width = 1280,
      quality = 2,
      maxFrames = null,
      startTime = 0,
      endTime = null
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

    // Check if frames already exist
    const existingFrameCount = await frameExtractionService.getFrameCount(videoId);

    if (existingFrameCount > 0) {
      return res.status(400).json({
        error: 'Frames already exist for this video',
        frameCount: existingFrameCount
      });
    }

    // Extract frames (this may take a while)
    const frames = await frameExtractionService.extractVideoFrames(video, {
      interval: parseFloat(interval),
      width: parseInt(width),
      quality: parseInt(quality),
      maxFrames: maxFrames ? parseInt(maxFrames) : null,
      startTime: parseFloat(startTime),
      endTime: endTime ? parseFloat(endTime) : null
    });

    res.json({
      message: 'Frames extracted successfully',
      frameCount: frames.length,
      frames: frames.slice(0, 10) // Return first 10 frames as preview
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/videos/:id/frames/all
 * Delete all frames for a video
 */
router.delete('/:id/frames/all', async (req, res, next) => {
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

    // Delete frames
    const deletedCount = await frameExtractionService.deleteFramesByVideoId(videoId);

    res.json({
      message: 'Frames deleted successfully',
      deletedCount
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/frames/:frameId
 * Get single frame details
 */
router.get('/frame/:frameId', async (req, res, next) => {
  try {
    const { frameId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(frameId)) {
      return res.status(400).json({ error: 'Invalid frame ID' });
    }

    // Get frame with video info
    const frame = await frameExtractionService.getFrameById(frameId);

    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Verify user has access to this frame's video
    const videoQuery = `
      SELECT user_id FROM videos WHERE id = $1
    `;
    const videoResult = await pool.query(videoQuery, [frame.video_id]);

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (videoResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ frame });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/frames/:frameId/image
 * Serve frame image file
 */
router.get('/frame/:frameId/image', async (req, res, next) => {
  try {
    const { frameId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(frameId)) {
      return res.status(400).json({ error: 'Invalid frame ID' });
    }

    // Get frame
    const frame = await frameExtractionService.getFrameById(frameId);

    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Verify user has access to this frame's video
    const videoQuery = `
      SELECT user_id FROM videos WHERE id = $1
    `;
    const videoResult = await pool.query(videoQuery, [frame.video_id]);

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (videoResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(frame.frame_path);
    } catch (error) {
      return res.status(404).json({ error: 'Frame image file not found' });
    }

    // Send file
    res.sendFile(frame.frame_path);

  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/frames/:frameId
 * Update frame analysis data
 */
router.patch('/frame/:frameId', async (req, res, next) => {
  try {
    const { frameId } = req.params;
    const {
      on_screen_text,
      scene_description,
      visual_elements,
      is_keyframe
    } = req.body;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(frameId)) {
      return res.status(400).json({ error: 'Invalid frame ID' });
    }

    // Get frame to verify access
    const frame = await frameExtractionService.getFrameById(frameId);

    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Verify user has access to this frame's video
    const videoQuery = `
      SELECT user_id FROM videos WHERE id = $1
    `;
    const videoResult = await pool.query(videoQuery, [frame.video_id]);

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (videoResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update frame
    const updatedFrame = await frameExtractionService.updateFrameAnalysis(frameId, {
      on_screen_text,
      scene_description,
      visual_elements,
      is_keyframe
    });

    res.json({
      message: 'Frame updated successfully',
      frame: updatedFrame
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/frames/:frameId
 * Delete a single frame
 */
router.delete('/frame/:frameId', async (req, res, next) => {
  try {
    const { frameId } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(frameId)) {
      return res.status(400).json({ error: 'Invalid frame ID' });
    }

    // Get frame to verify access
    const frame = await frameExtractionService.getFrameById(frameId);

    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Verify user has access to this frame's video
    const videoQuery = `
      SELECT user_id FROM videos WHERE id = $1
    `;
    const videoResult = await pool.query(videoQuery, [frame.video_id]);

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (videoResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete frame
    await frameExtractionService.deleteFrame(frameId);

    res.json({ message: 'Frame deleted successfully' });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/frames/:id/segments
 * Get transcript segments linked to a frame
 */
router.get('/frame/:id/segments', async (req, res, next) => {
  try {
    const frameId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(frameId)) {
      return res.status(400).json({ error: 'Invalid frame ID' });
    }

    // Get frame to verify access
    const frame = await frameExtractionService.getFrameById(frameId);

    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Verify user has access to this frame's video
    const videoQuery = `
      SELECT user_id FROM videos WHERE id = $1
    `;
    const videoResult = await pool.query(videoQuery, [frame.video_id]);

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (videoResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get segments linked to this frame
    const segments = await linkageService.getSegmentsForFrame(frameId);

    res.json({
      frameId,
      videoId: frame.video_id,
      frameTimestamp: frame.timestamp_seconds,
      segments,
      count: segments.length
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/frames/analysis
 * Get frames with vision analysis for a video
 */
router.get('/:id/frames/analysis', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const {
      limit = 50,
      offset = 0,
      onlyWithAnalysis = false
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

    // Get frames with analysis
    const result = await visionAnalysisService.getFramesWithAnalysis(videoId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      onlyWithAnalysis: onlyWithAnalysis === 'true' || onlyWithAnalysis === '1'
    });

    // Transform frames to include image URLs and computed fields
    const transformedFrames = result.frames.map(transformFrame);

    // Get analysis summary
    const summary = await visionAnalysisService.getVideoAnalysisSummary(videoId);

    res.json({
      ...result,
      frames: transformedFrames,
      summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/frames/analyze-vision
 * Trigger vision analysis for video frames
 */
router.post('/:id/frames/analyze-vision', async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const {
      samplingRate = 3,
      maxFrames = 40
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

    // Check if frames exist
    const frameCount = await frameExtractionService.getFrameCount(videoId);
    if (frameCount === 0) {
      return res.status(400).json({
        error: 'No frames found for this video. Extract frames first.'
      });
    }

    // Start vision analysis asynchronously
    res.json({
      message: 'Vision analysis started',
      videoId,
      estimatedFrames: Math.min(Math.ceil(frameCount / samplingRate), maxFrames)
    });

    // Process frames in background
    try {
      const result = await visionAnalysisService.analyzeVideoFrames(videoId, {
        samplingRate: parseInt(samplingRate, 10),
        maxFrames: parseInt(maxFrames, 10),
        progressCallback: (progress) => {
          console.log(`Vision Analysis Progress for video ${videoId}: ${progress.percentage}% (${progress.current}/${progress.total})`);
        }
      });

      console.log(`Vision analysis completed for video ${videoId}:`, result);
    } catch (error) {
      console.error(`Vision analysis failed for video ${videoId}:`, error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id/frames/analysis-summary
 * Get vision analysis summary for a video
 */
router.get('/:id/frames/analysis-summary', async (req, res, next) => {
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

    // Get analysis summary
    const summary = await visionAnalysisService.getVideoAnalysisSummary(videoId);

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/usage
 * Get Gemini API usage statistics
 */
usageRouter.get('/usage', requireAuth, async (req, res, next) => {
  try {
    // Get usage stats
    const usageStats = await visionAnalysisService.getUsageStats();

    // Get quota info
    const quotaInfo = geminiService.checkQuota();

    res.json({
      usage: usageStats,
      quota: quotaInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.usageRouter = usageRouter;
module.exports.publicRouter = publicRouter;
