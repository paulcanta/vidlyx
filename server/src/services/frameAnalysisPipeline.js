/**
 * Frame Analysis Pipeline Service
 * Orchestrates the complete frame analysis workflow:
 * Extract frames -> OCR processing -> Vision analysis -> Post-processing
 */

const frameExtractionService = require('./frameExtractionService');
const ocrService = require('./ocrService');
const visionAnalysisService = require('./visionAnalysisService');
const correlationService = require('./correlationService');
const videoService = require('./videoService');
const pool = require('./db');
const analysisConfig = require('../config/analysisConfig');

/**
 * Calculate progress percentage based on current step
 * @param {string} step - Current pipeline step (EXTRACT, OCR, VISION, POST_PROCESS, COMPLETE)
 * @param {number} stepProgress - Progress within current step (0-100)
 * @returns {number} Overall progress percentage
 */
function calculateProgress(step, stepProgress = 0) {
  const { steps } = analysisConfig.pipeline;

  if (!steps[step]) {
    return 0;
  }

  const stepConfig = steps[step];
  const stepRange = stepConfig.end - stepConfig.start;
  const stepContribution = (stepProgress / 100) * stepRange;

  return Math.round(stepConfig.start + stepContribution);
}

/**
 * Run complete frame analysis pipeline
 * @param {Object} video - Video object from database
 * @param {Object} options - Pipeline options
 * @param {number} options.frameInterval - Interval between frames in seconds (default: 5)
 * @param {number} options.maxFrames - Maximum number of frames to extract
 * @param {boolean} options.ocrEnabled - Enable OCR processing (default: true)
 * @param {boolean} options.visionEnabled - Enable vision analysis (default: true)
 * @param {number} options.visionSampleRate - Analyze every Nth frame (default: 3)
 * @param {Function} options.onProgress - Progress callback (progress, step, message)
 * @param {Function} options.onStepChange - Step change callback (step, stepLabel)
 * @returns {Promise<Object>} Pipeline result with statistics
 */
async function runPipeline(video, options = {}) {
  const {
    frameInterval = analysisConfig.pipeline.defaultOptions.frameInterval,
    maxFrames = analysisConfig.pipeline.defaultOptions.maxFrames,
    ocrEnabled = analysisConfig.pipeline.defaultOptions.ocrEnabled,
    visionEnabled = analysisConfig.pipeline.defaultOptions.visionEnabled,
    visionSampleRate = analysisConfig.pipeline.defaultOptions.visionSampleRate,
    onProgress = null,
    onStepChange = null
  } = options;

  const results = {
    videoId: video.id,
    steps: {
      extraction: null,
      ocr: null,
      vision: null,
      postProcess: null
    },
    stats: {
      framesExtracted: 0,
      framesOcrProcessed: 0,
      framesVisionAnalyzed: 0,
      keyframesIdentified: 0,
      correlationsCreated: 0
    },
    startTime: new Date(),
    endTime: null,
    success: false
  };

  try {
    // Update video status
    await videoService.updateVideoStatus(video.id, analysisConfig.pipeline.statusTransitions.start);

    // STEP 1: Extract Frames (0-30%)
    if (onStepChange) {
      onStepChange('EXTRACT', analysisConfig.pipeline.steps.EXTRACT.label);
    }

    console.log(`[Pipeline] Starting frame extraction for video ${video.id}`);

    const extractionOptions = {
      interval: frameInterval,
      maxFrames,
      width: analysisConfig.frameExtraction.width,
      quality: analysisConfig.frameExtraction.quality
    };

    if (onProgress) {
      onProgress(calculateProgress('EXTRACT', 0), 'EXTRACT', 'Starting frame extraction');
    }

    const extractedFrames = await frameExtractionService.extractVideoFrames(video, extractionOptions);
    results.steps.extraction = { frameCount: extractedFrames.length };
    results.stats.framesExtracted = extractedFrames.length;

    console.log(`[Pipeline] Extracted ${extractedFrames.length} frames`);

    if (onProgress) {
      onProgress(calculateProgress('EXTRACT', 100), 'EXTRACT', `Extracted ${extractedFrames.length} frames`);
    }

    // STEP 2: OCR Processing (30-60%)
    if (ocrEnabled) {
      if (onStepChange) {
        onStepChange('OCR', analysisConfig.pipeline.steps.OCR.label);
      }

      console.log(`[Pipeline] Starting OCR processing for video ${video.id}`);

      if (onProgress) {
        onProgress(calculateProgress('OCR', 0), 'OCR', 'Initializing OCR workers');
      }

      // Initialize OCR workers if not already initialized
      if (!ocrService.initialized) {
        await ocrService.initWorkers();
      }

      const ocrResult = await ocrService.processVideoFrames(video.id, (progressData) => {
        if (onProgress) {
          const ocrProgress = (progressData.current / progressData.total) * 100;
          onProgress(
            calculateProgress('OCR', ocrProgress),
            'OCR',
            `Processing OCR: ${progressData.current}/${progressData.total} frames`
          );
        }
      });

      results.steps.ocr = ocrResult;
      results.stats.framesOcrProcessed = ocrResult.succeeded || 0;

      console.log(`[Pipeline] OCR processing complete: ${ocrResult.succeeded} succeeded, ${ocrResult.failed} failed`);

      if (onProgress) {
        onProgress(calculateProgress('OCR', 100), 'OCR', `OCR complete: ${ocrResult.succeeded} frames processed`);
      }
    } else {
      console.log(`[Pipeline] OCR processing skipped (disabled)`);
      results.steps.ocr = { skipped: true };
    }

    // STEP 3: Vision Analysis (60-95%)
    if (visionEnabled) {
      if (onStepChange) {
        onStepChange('VISION', analysisConfig.pipeline.steps.VISION.label);
      }

      console.log(`[Pipeline] Starting vision analysis for video ${video.id}`);

      if (onProgress) {
        onProgress(calculateProgress('VISION', 0), 'VISION', 'Starting vision analysis');
      }

      const visionResult = await visionAnalysisService.analyzeVideoFrames(video.id, {
        samplingRate: visionSampleRate,
        maxFrames: analysisConfig.vision.maxFrames,
        progressCallback: (progressData) => {
          if (onProgress) {
            const visionProgress = (progressData.current / progressData.total) * 100;
            onProgress(
              calculateProgress('VISION', visionProgress),
              'VISION',
              `Analyzing frames: ${progressData.current}/${progressData.total}`
            );
          }
        }
      });

      results.steps.vision = visionResult;
      results.stats.framesVisionAnalyzed = visionResult.analyzed || 0;

      console.log(`[Pipeline] Vision analysis complete: ${visionResult.analyzed} analyzed, ${visionResult.failed} failed`);

      if (onProgress) {
        onProgress(calculateProgress('VISION', 100), 'VISION', `Vision analysis complete: ${visionResult.analyzed} frames analyzed`);
      }
    } else {
      console.log(`[Pipeline] Vision analysis skipped (disabled)`);
      results.steps.vision = { skipped: true };
    }

    // STEP 4: Post-Processing (95-98%)
    if (onStepChange) {
      onStepChange('POST_PROCESS', analysisConfig.pipeline.steps.POST_PROCESS.label);
    }

    console.log(`[Pipeline] Starting post-processing for video ${video.id}`);

    if (onProgress) {
      onProgress(calculateProgress('POST_PROCESS', 0), 'POST_PROCESS', 'Identifying keyframes');
    }

    const postProcessResult = await postProcessFrames(video.id);
    results.steps.postProcess = postProcessResult;
    results.stats.keyframesIdentified = postProcessResult.keyframesIdentified || 0;
    results.stats.correlationsCreated = postProcessResult.correlation?.correlationsCreated || 0;

    console.log(`[Pipeline] Post-processing complete: ${postProcessResult.keyframesIdentified} keyframes identified, ${results.stats.correlationsCreated} correlations created`);

    if (onProgress) {
      onProgress(calculateProgress('POST_PROCESS', 100), 'POST_PROCESS', 'Post-processing complete');
    }

    // STEP 5: Complete (98-100%)
    if (onStepChange) {
      onStepChange('COMPLETE', analysisConfig.pipeline.steps.COMPLETE.label);
    }

    if (onProgress) {
      onProgress(calculateProgress('COMPLETE', 50), 'COMPLETE', 'Updating video status');
    }

    // Update video status to success
    await videoService.updateVideoStatus(video.id, analysisConfig.pipeline.statusTransitions.success);

    results.endTime = new Date();
    results.success = true;

    if (onProgress) {
      onProgress(100, 'COMPLETE', 'Pipeline complete');
    }

    console.log(`[Pipeline] Pipeline complete for video ${video.id}`);

    return results;

  } catch (error) {
    console.error(`[Pipeline] Pipeline failed for video ${video.id}:`, error);

    results.endTime = new Date();
    results.success = false;
    results.error = error.message;

    // Update video status to failed
    try {
      await videoService.updateVideoStatus(video.id, analysisConfig.pipeline.statusTransitions.failure);
    } catch (statusError) {
      console.error(`[Pipeline] Failed to update video status:`, statusError);
    }

    throw error;
  }
}

/**
 * Post-process frames: identify keyframes, correlate with transcript, and generate visual overview
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} Post-processing results
 */
async function postProcessFrames(videoId) {
  try {
    console.log(`[PostProcess] Starting post-processing for video ${videoId}`);

    // Identify keyframes
    const keyframesResult = await identifyKeyframes(videoId);

    // Correlate frames with transcript segments
    // Note: This step is non-critical - failure should not fail the entire pipeline
    let correlationResult = null;
    try {
      console.log(`[PostProcess] Running frame-transcript correlation for video ${videoId}`);
      correlationResult = await correlationService.correlateVideoContent(videoId);
      console.log(`[PostProcess] Correlation complete: ${correlationResult.correlationsCreated} correlations created`);
    } catch (correlationError) {
      console.error(`[PostProcess] Correlation failed for video ${videoId}, continuing with pipeline:`, correlationError);
      correlationResult = {
        success: false,
        error: correlationError.message,
        correlationsCreated: 0
      };
    }

    // Generate visual overview
    const visualOverview = await generateVisualOverview(videoId);

    // Update video with visual overview
    await pool.query(
      'UPDATE videos SET visual_overview = $1 WHERE id = $2',
      [JSON.stringify(visualOverview), videoId]
    );

    return {
      keyframesIdentified: keyframesResult.keyframesIdentified,
      correlation: correlationResult,
      visualOverview,
      success: true
    };

  } catch (error) {
    console.error(`[PostProcess] Post-processing failed for video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Identify keyframes based on content type changes and other criteria
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} Keyframe identification results
 */
async function identifyKeyframes(videoId) {
  try {
    console.log(`[Keyframes] Identifying keyframes for video ${videoId}`);

    // Get all frames ordered by timestamp
    const framesQuery = `
      SELECT id, timestamp_seconds, content_type, on_screen_text, visual_elements
      FROM frames
      WHERE video_id = $1
      ORDER BY timestamp_seconds ASC
    `;

    const framesResult = await pool.query(framesQuery, [videoId]);
    const frames = framesResult.rows;

    if (frames.length === 0) {
      return { keyframesIdentified: 0 };
    }

    const keyframeIds = [];
    let previousContentType = null;
    let previousText = null;

    // First frame is always a keyframe
    keyframeIds.push(frames[0].id);

    for (let i = 1; i < frames.length; i++) {
      const frame = frames[i];
      const isKeyframe = shouldMarkAsKeyframe(frame, previousContentType, previousText);

      if (isKeyframe) {
        keyframeIds.push(frame.id);
      }

      // Update previous values
      if (frame.content_type) {
        previousContentType = frame.content_type;
      }
      if (frame.on_screen_text) {
        previousText = frame.on_screen_text;
      }
    }

    // Mark keyframes in database
    if (keyframeIds.length > 0) {
      // First, reset all keyframes for this video
      await pool.query(
        'UPDATE frames SET is_keyframe = false WHERE video_id = $1',
        [videoId]
      );

      // Then mark the identified keyframes
      await pool.query(
        'UPDATE frames SET is_keyframe = true WHERE id = ANY($1)',
        [keyframeIds]
      );
    }

    console.log(`[Keyframes] Identified ${keyframeIds.length} keyframes for video ${videoId}`);

    return {
      keyframesIdentified: keyframeIds.length,
      keyframeIds
    };

  } catch (error) {
    console.error(`[Keyframes] Failed to identify keyframes for video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Determine if a frame should be marked as a keyframe
 * @param {Object} frame - Frame object
 * @param {string} previousContentType - Previous frame's content type
 * @param {string} previousText - Previous frame's OCR text
 * @returns {boolean} Whether frame should be a keyframe
 */
function shouldMarkAsKeyframe(frame, previousContentType, previousText) {
  const config = analysisConfig.keyframe;

  // Check for content type change
  if (config.detectOnContentTypeChange && frame.content_type) {
    if (frame.content_type !== previousContentType) {
      // Content type changed
      return true;
    }

    // Check if this is an important content type
    if (config.importantContentTypes.includes(frame.content_type)) {
      return true;
    }
  }

  // Check for significant text change
  if (config.detectOnTextChange && frame.on_screen_text && previousText) {
    const similarity = calculateTextSimilarity(frame.on_screen_text, previousText);

    if (similarity < config.textSimilarityThreshold) {
      // Text changed significantly
      return true;
    }
  }

  return false;
}

/**
 * Calculate text similarity using simple word overlap
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score (0-1)
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  // Normalize and tokenize
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Generate visual overview aggregating content types and creating summary
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} Visual overview object
 */
async function generateVisualOverview(videoId) {
  try {
    console.log(`[VisualOverview] Generating visual overview for video ${videoId}`);

    // Get content type distribution
    const contentTypeQuery = `
      SELECT
        content_type,
        COUNT(*) as count,
        MIN(timestamp_seconds) as first_occurrence,
        MAX(timestamp_seconds) as last_occurrence,
        array_agg(id ORDER BY timestamp_seconds) FILTER (WHERE is_keyframe = true) as keyframe_ids
      FROM frames
      WHERE video_id = $1 AND content_type IS NOT NULL
      GROUP BY content_type
      ORDER BY count DESC
    `;

    const contentTypeResult = await pool.query(contentTypeQuery, [videoId]);

    // Get overall statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_frames,
        COUNT(CASE WHEN is_keyframe = true THEN 1 END) as total_keyframes,
        COUNT(CASE WHEN on_screen_text IS NOT NULL AND on_screen_text != '' THEN 1 END) as frames_with_text,
        COUNT(CASE WHEN content_type IS NOT NULL THEN 1 END) as frames_with_content_type,
        MIN(timestamp_seconds) as start_time,
        MAX(timestamp_seconds) as end_time
      FROM frames
      WHERE video_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [videoId]);
    const stats = statsResult.rows[0];

    // Build content type summary
    const contentTypes = contentTypeResult.rows.map(row => ({
      type: row.content_type,
      count: parseInt(row.count),
      percentage: Math.round((parseInt(row.count) / parseInt(stats.total_frames)) * 100),
      firstOccurrence: parseFloat(row.first_occurrence),
      lastOccurrence: parseFloat(row.last_occurrence),
      keyframeCount: row.keyframe_ids ? row.keyframe_ids.length : 0
    }));

    // Determine dominant content type
    const dominantContentType = contentTypes.length > 0 ? contentTypes[0].type : 'unknown';

    const visualOverview = {
      totalFrames: parseInt(stats.total_frames),
      totalKeyframes: parseInt(stats.total_keyframes),
      framesWithText: parseInt(stats.frames_with_text),
      framesWithContentType: parseInt(stats.frames_with_content_type),
      duration: parseFloat(stats.end_time) - parseFloat(stats.start_time),
      contentTypes,
      dominantContentType,
      generatedAt: new Date().toISOString()
    };

    console.log(`[VisualOverview] Generated visual overview for video ${videoId}: ${contentTypes.length} content types`);

    return visualOverview;

  } catch (error) {
    console.error(`[VisualOverview] Failed to generate visual overview for video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Get pipeline status and statistics for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} Pipeline status with frame counts
 */
async function getPipelineStatus(videoId) {
  try {
    const query = `
      SELECT
        COUNT(*) as total_frames,
        COUNT(CASE WHEN on_screen_text IS NOT NULL THEN 1 END) as ocr_processed,
        COUNT(CASE WHEN raw_analysis IS NOT NULL THEN 1 END) as vision_analyzed,
        COUNT(CASE WHEN is_keyframe = true THEN 1 END) as keyframes,
        COUNT(CASE WHEN content_type IS NOT NULL THEN 1 END) as content_typed
      FROM frames
      WHERE video_id = $1
    `;

    const result = await pool.query(query, [videoId]);
    const stats = result.rows[0];

    // Get video status
    const video = await videoService.findVideoById(videoId);

    return {
      videoId,
      status: video ? video.analysis_status : 'unknown',
      frames: {
        total: parseInt(stats.total_frames),
        ocrProcessed: parseInt(stats.ocr_processed),
        visionAnalyzed: parseInt(stats.vision_analyzed),
        keyframes: parseInt(stats.keyframes),
        contentTyped: parseInt(stats.content_typed)
      },
      progress: {
        extraction: stats.total_frames > 0 ? 100 : 0,
        ocr: stats.total_frames > 0 ? Math.round((stats.ocr_processed / stats.total_frames) * 100) : 0,
        vision: stats.total_frames > 0 ? Math.round((stats.vision_analyzed / stats.total_frames) * 100) : 0
      }
    };

  } catch (error) {
    console.error(`[PipelineStatus] Failed to get pipeline status for video ${videoId}:`, error);
    throw error;
  }
}

module.exports = {
  runPipeline,
  postProcessFrames,
  identifyKeyframes,
  generateVisualOverview,
  getPipelineStatus,
  calculateProgress
};
