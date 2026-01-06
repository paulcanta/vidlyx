/**
 * Linkage Service for Frame-Transcript Correlation
 * Links video frames with transcript segments based on correlation data
 */

const pool = require('./db');

/**
 * Get frames linked to a transcript segment
 * @param {string} videoId - Video UUID
 * @param {number} startTime - Segment start time in seconds
 * @param {number} endTime - Segment end time in seconds
 * @returns {Promise<Array>} - Array of frames with correlation data
 */
async function getFramesForSegment(videoId, startTime, endTime) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        f.id,
        f.video_id,
        f.timestamp_seconds,
        f.frame_path,
        f.scene_description,
        f.on_screen_text,
        f.visual_elements,
        f.content_type,
        f.is_keyframe,
        c.segment_start,
        c.segment_end,
        c.correlation_score,
        c.matching_elements
      FROM frame_segment_links fsl
      JOIN frames f ON fsl.frame_id = f.id
      LEFT JOIN frame_transcript_correlations c
        ON c.frame_id = f.id
        AND c.video_id = $1
        AND c.segment_start = $2
        AND c.segment_end = $3
      WHERE fsl.video_id = $1
        AND fsl.segment_start = $2
        AND fsl.segment_end = $3
      ORDER BY c.correlation_score DESC, f.timestamp_seconds ASC
    `;

    const result = await client.query(query, [videoId, startTime, endTime]);
    return result.rows;
  } catch (error) {
    console.error('Error getting frames for segment:', error);
    // Return empty array instead of throwing error when no results
    if (error.message && error.message.includes('does not exist')) {
      return [];
    }
    return [];
  } finally {
    client.release();
  }
}

/**
 * Get transcript segments linked to a frame
 * @param {string} frameId - Frame UUID
 * @returns {Promise<Array>} - Array of transcript segments with correlation data
 */
async function getSegmentsForFrame(frameId) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        c.id,
        c.video_id,
        c.frame_id,
        c.segment_start,
        c.segment_end,
        c.correlation_score,
        c.matching_elements,
        c.created_at,
        f.timestamp_seconds as frame_timestamp,
        f.scene_description,
        f.on_screen_text
      FROM frame_transcript_correlations c
      JOIN frames f ON c.frame_id = f.id
      WHERE c.frame_id = $1
        AND c.correlation_score > 30
      ORDER BY c.correlation_score DESC, c.segment_start ASC
    `;

    const result = await client.query(query, [frameId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting segments for frame:', error);
    // Return empty array instead of throwing error when no results
    return [];
  } finally {
    client.release();
  }
}

/**
 * Get best matching frame for a given timestamp
 * Finds the frame with highest correlation score near the specified time
 * @param {string} videoId - Video UUID
 * @param {number} timestamp - Time in seconds
 * @returns {Promise<Object|null>} - Frame with correlation data or null
 */
async function getBestFrameForTime(videoId, timestamp) {
  const client = await pool.connect();
  try {
    // First, try to find frames with correlation data near this timestamp
    const correlationQuery = `
      SELECT
        f.id,
        f.video_id,
        f.timestamp_seconds,
        f.frame_path,
        f.scene_description,
        f.on_screen_text,
        f.visual_elements,
        f.content_type,
        f.is_keyframe,
        c.segment_start,
        c.segment_end,
        c.correlation_score,
        c.matching_elements,
        ABS(f.timestamp_seconds - $2) as time_distance
      FROM frames f
      LEFT JOIN frame_transcript_correlations c
        ON c.frame_id = f.id
        AND c.segment_start <= $2
        AND c.segment_end >= $2
      WHERE f.video_id = $1
        AND f.timestamp_seconds BETWEEN $2 - 5 AND $2 + 5
      ORDER BY
        c.correlation_score DESC NULLS LAST,
        time_distance ASC
      LIMIT 1
    `;

    const correlationResult = await client.query(correlationQuery, [videoId, timestamp]);

    if (correlationResult.rows.length > 0) {
      return correlationResult.rows[0];
    }

    // If no correlated frame found, return the nearest frame by timestamp
    const nearestQuery = `
      SELECT
        f.id,
        f.video_id,
        f.timestamp_seconds,
        f.frame_path,
        f.scene_description,
        f.on_screen_text,
        f.visual_elements,
        f.content_type,
        f.is_keyframe,
        ABS(f.timestamp_seconds - $2) as time_distance
      FROM frames f
      WHERE f.video_id = $1
      ORDER BY time_distance ASC
      LIMIT 1
    `;

    const nearestResult = await client.query(nearestQuery, [videoId, timestamp]);

    if (nearestResult.rows.length > 0) {
      return nearestResult.rows[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting best frame for time:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Get all correlations for a video
 * @param {string} videoId - Video UUID
 * @param {Object} options - Query options
 * @param {number} options.minScore - Minimum correlation score (default: 30)
 * @param {number} options.limit - Max results to return
 * @returns {Promise<Array>} - Array of correlations
 */
async function getVideoCorrelations(videoId, options = {}) {
  const { minScore = 30, limit = 100 } = options;

  const client = await pool.connect();
  try {
    const query = `
      SELECT
        c.id,
        c.video_id,
        c.frame_id,
        c.segment_start,
        c.segment_end,
        c.correlation_score,
        c.matching_elements,
        f.timestamp_seconds,
        f.frame_path,
        f.scene_description,
        f.on_screen_text
      FROM frame_transcript_correlations c
      JOIN frames f ON c.frame_id = f.id
      WHERE c.video_id = $1
        AND c.correlation_score >= $2
      ORDER BY c.segment_start ASC, c.correlation_score DESC
      LIMIT $3
    `;

    const result = await client.query(query, [videoId, minScore, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error getting video correlations:', error);
    return [];
  } finally {
    client.release();
  }
}

/**
 * Get correlation statistics for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} - Statistics object
 */
async function getCorrelationStats(videoId) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        COUNT(DISTINCT frame_id) as correlated_frames_count,
        COUNT(*) as total_correlations,
        AVG(correlation_score) as avg_correlation_score,
        MAX(correlation_score) as max_correlation_score,
        MIN(correlation_score) as min_correlation_score,
        COUNT(CASE WHEN correlation_score > 70 THEN 1 END) as high_confidence_count,
        COUNT(CASE WHEN correlation_score BETWEEN 50 AND 70 THEN 1 END) as medium_confidence_count,
        COUNT(CASE WHEN correlation_score BETWEEN 30 AND 50 THEN 1 END) as low_confidence_count
      FROM frame_transcript_correlations
      WHERE video_id = $1
    `;

    const result = await client.query(query, [videoId]);

    if (result.rows.length === 0) {
      return {
        correlated_frames_count: 0,
        total_correlations: 0,
        avg_correlation_score: 0,
        max_correlation_score: 0,
        min_correlation_score: 0,
        high_confidence_count: 0,
        medium_confidence_count: 0,
        low_confidence_count: 0
      };
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting correlation stats:', error);
    return {
      correlated_frames_count: 0,
      total_correlations: 0,
      avg_correlation_score: 0,
      max_correlation_score: 0,
      min_correlation_score: 0,
      high_confidence_count: 0,
      medium_confidence_count: 0,
      low_confidence_count: 0
    };
  } finally {
    client.release();
  }
}

module.exports = {
  getFramesForSegment,
  getSegmentsForFrame,
  getBestFrameForTime,
  getVideoCorrelations,
  getCorrelationStats
};
