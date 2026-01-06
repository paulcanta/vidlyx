const path = require('path');
const fs = require('fs').promises;
const pool = require('./db');
const pythonService = require('./pythonService');
const ffmpegUtils = require('../utils/ffmpeg');

/**
 * Frame Extraction Service
 * Handles frame extraction from YouTube videos and database operations
 */

// Base directory for storing frames
const FRAMES_BASE_DIR = path.join(__dirname, '../../frames');

/**
 * Extract frames from a YouTube video
 * @param {Object} video - Video object from database
 * @param {Object} options - Extraction options
 * @param {number} options.interval - Interval in seconds between frames (default: 5)
 * @param {number} options.width - Output width in pixels (default: 1280)
 * @param {number} options.quality - JPEG quality 1-31 (2 is high quality, default: 2)
 * @param {number} options.maxFrames - Maximum number of frames to extract (optional)
 * @param {number} options.startTime - Start time in seconds (default: 0)
 * @param {number} options.endTime - End time in seconds (optional)
 * @returns {Promise<Array<Object>>} Array of extracted frame records
 */
async function extractVideoFrames(video, options = {}) {
  const {
    interval = 5,
    width = 1280,
    quality = 2,
    maxFrames = null,
    startTime = 0,
    endTime = null
  } = options;

  try {
    // Get video stream URL using Python service
    console.log(`Getting stream URL for video ${video.youtube_id}...`);
    const streamData = await pythonService.getStreamUrl(video.youtube_id);

    if (!streamData.stream_url) {
      throw new Error('No stream URL available for this video');
    }

    // Create output directory for this video
    const videoFramesDir = path.join(FRAMES_BASE_DIR, video.id);
    await fs.mkdir(videoFramesDir, { recursive: true });

    console.log(`Extracting frames from video ${video.youtube_id}...`);

    // Extract frames using FFmpeg
    const extractedFrames = await ffmpegUtils.extractFrames(
      streamData.stream_url,
      videoFramesDir,
      {
        interval,
        width,
        quality,
        format: 'jpg',
        maxFrames,
        startTime,
        endTime: endTime || streamData.duration
      }
    );

    console.log(`Extracted ${extractedFrames.length} frames`);

    // Insert frame records into database
    const frameRecords = [];

    for (const frame of extractedFrames) {
      const frameRecord = await insertFrame(video.id, {
        timestamp_seconds: frame.timestamp,
        frame_path: frame.path,
        is_keyframe: false // Will be determined by analysis later
      });

      frameRecords.push(frameRecord);
    }

    console.log(`Inserted ${frameRecords.length} frame records into database`);

    return frameRecords;

  } catch (error) {
    throw new Error(`Failed to extract video frames: ${error.message}`);
  }
}

/**
 * Insert a frame record into the database
 * @param {string} videoId - Video UUID
 * @param {Object} data - Frame data
 * @param {number} data.timestamp_seconds - Timestamp in seconds
 * @param {string} data.frame_path - File path to the frame image
 * @param {boolean} data.is_keyframe - Whether this is a keyframe
 * @param {string} data.on_screen_text - OCR extracted text (optional)
 * @param {string} data.scene_description - Scene description (optional)
 * @param {Object} data.visual_elements - Visual elements JSON (optional)
 * @returns {Promise<Object>} Inserted frame record
 */
async function insertFrame(videoId, data) {
  const {
    timestamp_seconds,
    frame_path,
    is_keyframe = false,
    on_screen_text = null,
    scene_description = null,
    visual_elements = null
  } = data;

  try {
    const query = `
      INSERT INTO frames (
        video_id,
        timestamp_seconds,
        frame_path,
        is_keyframe,
        on_screen_text,
        scene_description,
        visual_elements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      videoId,
      timestamp_seconds,
      frame_path,
      is_keyframe,
      on_screen_text,
      scene_description,
      visual_elements ? JSON.stringify(visual_elements) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];

  } catch (error) {
    throw new Error(`Failed to insert frame: ${error.message}`);
  }
}

/**
 * Get all frames for a video
 * @param {string} videoId - Video UUID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of frames to return
 * @param {number} options.offset - Number of frames to skip
 * @param {boolean} options.keyframesOnly - Only return keyframes
 * @returns {Promise<Array<Object>>} Array of frame records
 */
async function getFramesByVideoId(videoId, options = {}) {
  const {
    limit = 100,
    offset = 0,
    keyframesOnly = false
  } = options;

  try {
    let query = `
      SELECT
        id,
        video_id,
        timestamp_seconds,
        frame_path,
        thumbnail_path,
        on_screen_text,
        scene_description,
        visual_elements,
        is_keyframe,
        created_at
      FROM frames
      WHERE video_id = $1
    `;

    const values = [videoId];

    if (keyframesOnly) {
      query += ' AND is_keyframe = true';
    }

    query += ' ORDER BY timestamp_seconds ASC';
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;

  } catch (error) {
    throw new Error(`Failed to get frames: ${error.message}`);
  }
}

/**
 * Get a single frame by ID
 * @param {string} frameId - Frame UUID
 * @returns {Promise<Object|null>} Frame record or null if not found
 */
async function getFrameById(frameId) {
  try {
    const query = `
      SELECT
        f.id,
        f.video_id,
        f.timestamp_seconds,
        f.frame_path,
        f.thumbnail_path,
        f.on_screen_text,
        f.scene_description,
        f.visual_elements,
        f.is_keyframe,
        f.created_at,
        v.youtube_id,
        v.title as video_title
      FROM frames f
      JOIN videos v ON f.video_id = v.id
      WHERE f.id = $1
    `;

    const result = await pool.query(query, [frameId]);
    return result.rows[0] || null;

  } catch (error) {
    throw new Error(`Failed to get frame: ${error.message}`);
  }
}

/**
 * Update frame analysis data
 * @param {string} frameId - Frame UUID
 * @param {Object} data - Analysis data to update
 * @param {string} data.on_screen_text - OCR extracted text
 * @param {string} data.scene_description - Scene description
 * @param {Object} data.visual_elements - Visual elements JSON
 * @param {boolean} data.is_keyframe - Whether this is a keyframe
 * @returns {Promise<Object>} Updated frame record
 */
async function updateFrameAnalysis(frameId, data) {
  const {
    on_screen_text,
    scene_description,
    visual_elements,
    is_keyframe
  } = data;

  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (on_screen_text !== undefined) {
      updates.push(`on_screen_text = $${paramIndex++}`);
      values.push(on_screen_text);
    }

    if (scene_description !== undefined) {
      updates.push(`scene_description = $${paramIndex++}`);
      values.push(scene_description);
    }

    if (visual_elements !== undefined) {
      updates.push(`visual_elements = $${paramIndex++}`);
      values.push(JSON.stringify(visual_elements));
    }

    if (is_keyframe !== undefined) {
      updates.push(`is_keyframe = $${paramIndex++}`);
      values.push(is_keyframe);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(frameId);

    const query = `
      UPDATE frames
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];

  } catch (error) {
    throw new Error(`Failed to update frame analysis: ${error.message}`);
  }
}

/**
 * Delete frame and its file
 * @param {string} frameId - Frame UUID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteFrame(frameId) {
  try {
    // Get frame to find file path
    const frame = await getFrameById(frameId);

    if (!frame) {
      return false;
    }

    // Delete from database
    await pool.query('DELETE FROM frames WHERE id = $1', [frameId]);

    // Delete file if it exists
    try {
      await fs.unlink(frame.frame_path);

      // Also delete thumbnail if it exists
      if (frame.thumbnail_path) {
        await fs.unlink(frame.thumbnail_path);
      }
    } catch (fileError) {
      // Log error but don't throw - database record is already deleted
      console.error(`Failed to delete frame file: ${fileError.message}`);
    }

    return true;

  } catch (error) {
    throw new Error(`Failed to delete frame: ${error.message}`);
  }
}

/**
 * Get frame count for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<number>} Number of frames
 */
async function getFrameCount(videoId) {
  try {
    const query = 'SELECT COUNT(*) as count FROM frames WHERE video_id = $1';
    const result = await pool.query(query, [videoId]);
    return parseInt(result.rows[0].count);

  } catch (error) {
    throw new Error(`Failed to get frame count: ${error.message}`);
  }
}

/**
 * Delete all frames for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<number>} Number of frames deleted
 */
async function deleteFramesByVideoId(videoId) {
  try {
    // Get all frames for this video
    const frames = await getFramesByVideoId(videoId, { limit: 10000 });

    // Delete from database
    const result = await pool.query('DELETE FROM frames WHERE video_id = $1', [videoId]);
    const deletedCount = result.rowCount;

    // Delete frame files
    const videoFramesDir = path.join(FRAMES_BASE_DIR, videoId);

    try {
      await fs.rm(videoFramesDir, { recursive: true, force: true });
    } catch (fileError) {
      console.error(`Failed to delete frames directory: ${fileError.message}`);
    }

    return deletedCount;

  } catch (error) {
    throw new Error(`Failed to delete frames: ${error.message}`);
  }
}

module.exports = {
  extractVideoFrames,
  insertFrame,
  getFramesByVideoId,
  getFrameById,
  updateFrameAnalysis,
  deleteFrame,
  getFrameCount,
  deleteFramesByVideoId,
  FRAMES_BASE_DIR
};
