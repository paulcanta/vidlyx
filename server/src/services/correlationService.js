/**
 * Correlation Service
 * Correlates video frames with transcript segments to identify which frames
 * correspond to specific parts of the transcript
 */

const pool = require('./db');

/**
 * Get transcript segments for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<Array>} Array of transcript segments
 */
async function getTranscriptSegments(videoId) {
  try {
    const result = await pool.query(
      'SELECT segments FROM transcriptions WHERE video_id = $1',
      [videoId]
    );

    if (!result.rows[0] || !result.rows[0].segments) {
      return [];
    }

    // segments is stored as JSONB, so it's already parsed
    return result.rows[0].segments;
  } catch (error) {
    console.error(`[Correlation] Error fetching transcript segments for video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Get analyzed frames for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<Array>} Array of frame objects
 */
async function getAnalyzedFrames(videoId) {
  try {
    const result = await pool.query(
      `SELECT id, timestamp_seconds, on_screen_text, scene_description,
              visual_elements, content_type, ocr_confidence
       FROM frames
       WHERE video_id = $1
       ORDER BY timestamp_seconds ASC`,
      [videoId]
    );

    return result.rows;
  } catch (error) {
    console.error(`[Correlation] Error fetching frames for video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Find frames within a time range (with buffer)
 * @param {Array} frames - Array of frame objects
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {number} buffer - Time buffer in seconds (default: 2)
 * @returns {Array} Frames within the time range
 */
function findFramesInTimeRange(frames, startTime, endTime, buffer = 2) {
  const bufferedStart = Math.max(0, startTime - buffer);
  const bufferedEnd = endTime + buffer;

  return frames.filter(frame => {
    const frameTime = parseFloat(frame.timestamp_seconds);
    return frameTime >= bufferedStart && frameTime <= bufferedEnd;
  });
}

/**
 * Calculate text similarity using word overlap (Jaccard similarity)
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score (0-1)
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  // Normalize and tokenize
  const words1 = new Set(
    text1.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
  const words2 = new Set(
    text2.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find matching elements between transcript text and frame
 * @param {string} transcriptText - Transcript segment text
 * @param {Object} frame - Frame object
 * @returns {Object} Matching elements details
 */
function findMatchingElements(transcriptText, frame) {
  const matchingElements = {
    matchedWords: [],
    visualElementMatches: [],
    contentTypeMatch: false
  };

  if (!transcriptText) return matchingElements;

  const transcriptWords = transcriptText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const transcriptWordSet = new Set(transcriptWords);

  // Check OCR text matches
  if (frame.on_screen_text) {
    const ocrWords = frame.on_screen_text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    matchingElements.matchedWords = ocrWords.filter(word => transcriptWordSet.has(word));
  }

  // Check visual elements mentioned in transcript
  if (frame.visual_elements && Array.isArray(frame.visual_elements)) {
    frame.visual_elements.forEach(element => {
      if (typeof element === 'string') {
        const elementLower = element.toLowerCase();
        if (transcriptWords.some(word => elementLower.includes(word) || word.includes(elementLower))) {
          matchingElements.visualElementMatches.push(element);
        }
      } else if (element && element.type) {
        const elementType = element.type.toLowerCase();
        if (transcriptWords.some(word => elementType.includes(word) || word.includes(elementType))) {
          matchingElements.visualElementMatches.push(element.type);
        }
      }
    });
  }

  // Check scene description overlap
  if (frame.scene_description) {
    const sceneWords = frame.scene_description.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const sceneMatches = sceneWords.filter(word => transcriptWordSet.has(word));
    if (sceneMatches.length > 0) {
      matchingElements.sceneDescriptionMatches = sceneMatches;
    }
  }

  // Check content type relevance
  if (frame.content_type) {
    const contentTypeLower = frame.content_type.toLowerCase();
    const relevantTypes = ['screencast', 'presentation', 'demo', 'tutorial', 'code', 'diagram'];
    if (relevantTypes.includes(contentTypeLower)) {
      matchingElements.contentTypeMatch = true;
    }
  }

  return matchingElements;
}

/**
 * Calculate content similarity between transcript text and frame
 * @param {string} transcriptText - Transcript segment text
 * @param {Object} frame - Frame object
 * @returns {number} Similarity score (0-100)
 */
function calculateContentSimilarity(transcriptText, frame) {
  let score = 0;

  if (!transcriptText || !frame) return 0;

  // 1. OCR text overlap (40 points max)
  if (frame.on_screen_text) {
    const ocrSimilarity = calculateTextSimilarity(transcriptText, frame.on_screen_text);
    score += ocrSimilarity * 40;
  }

  // 2. Scene description word overlap (30 points max)
  if (frame.scene_description) {
    const sceneSimilarity = calculateTextSimilarity(transcriptText, frame.scene_description);
    score += sceneSimilarity * 30;
  }

  // 3. Visual elements mentioned in transcript (20 points max)
  const matchingElements = findMatchingElements(transcriptText, frame);
  if (matchingElements.visualElementMatches.length > 0) {
    // Award points based on number of matches (up to 20 points)
    score += Math.min(matchingElements.visualElementMatches.length * 5, 20);
  }

  // 4. Content type bonuses (10 points max)
  if (frame.content_type) {
    const contentTypeLower = frame.content_type.toLowerCase();
    const transcriptLower = transcriptText.toLowerCase();

    // Bonus for specific content types that match transcript context
    if (contentTypeLower === 'screencast' && (transcriptLower.includes('code') || transcriptLower.includes('screen'))) {
      score += 5;
    }
    if (contentTypeLower === 'presentation' && (transcriptLower.includes('slide') || transcriptLower.includes('present'))) {
      score += 5;
    }
    if (contentTypeLower === 'demo' && (transcriptLower.includes('demo') || transcriptLower.includes('show'))) {
      score += 5;
    }
    if (matchingElements.contentTypeMatch) {
      score += 5;
    }
  }

  // Cap score at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Store correlation in database
 * @param {string} videoId - Video UUID
 * @param {Object} correlation - Correlation object
 * @returns {Promise<Object>} Inserted correlation record
 */
async function storeCorrelation(videoId, correlation) {
  try {
    const result = await pool.query(
      `INSERT INTO frame_transcript_correlations
       (video_id, frame_id, segment_start, segment_end, correlation_score, matching_elements)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        videoId,
        correlation.frameId,
        correlation.segmentStart,
        correlation.segmentEnd,
        correlation.score,
        JSON.stringify(correlation.matchingElements)
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error(`[Correlation] Error storing correlation:`, error);
    throw error;
  }
}

/**
 * Correlate all frames with transcript segments for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} Correlation results
 */
async function correlateVideoContent(videoId) {
  const client = await pool.connect();

  try {
    console.log(`[Correlation] Starting correlation for video ${videoId}`);

    // Start transaction
    await client.query('BEGIN');

    // Get transcript segments
    const segments = await getTranscriptSegments(videoId);
    if (segments.length === 0) {
      console.log(`[Correlation] No transcript segments found for video ${videoId}`);
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'No transcript available',
        correlationsCreated: 0
      };
    }

    // Get analyzed frames
    const frames = await getAnalyzedFrames(videoId);
    if (frames.length === 0) {
      console.log(`[Correlation] No frames found for video ${videoId}`);
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'No frames available',
        correlationsCreated: 0
      };
    }

    console.log(`[Correlation] Found ${segments.length} segments and ${frames.length} frames`);

    // Delete existing correlations for this video
    await client.query(
      'DELETE FROM frame_transcript_correlations WHERE video_id = $1',
      [videoId]
    );

    let correlationsCreated = 0;
    const correlationThreshold = 10; // Minimum score to store correlation

    // Process each transcript segment
    for (const segment of segments) {
      const startTime = segment.start || 0;
      const duration = segment.duration || 0;
      const endTime = startTime + duration;
      const text = segment.text || '';

      // Find frames in this time range
      const relevantFrames = findFramesInTimeRange(frames, startTime, endTime);

      // Calculate similarity for each frame
      for (const frame of relevantFrames) {
        const score = calculateContentSimilarity(text, frame);

        // Only store correlations above threshold
        if (score >= correlationThreshold) {
          const matchingElements = findMatchingElements(text, frame);

          await client.query(
            `INSERT INTO frame_transcript_correlations
             (video_id, frame_id, segment_start, segment_end, correlation_score, matching_elements)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              videoId,
              frame.id,
              startTime,
              endTime,
              score,
              JSON.stringify(matchingElements)
            ]
          );

          correlationsCreated++;
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log(`[Correlation] Created ${correlationsCreated} correlations for video ${videoId}`);

    return {
      success: true,
      correlationsCreated,
      segmentsProcessed: segments.length,
      framesProcessed: frames.length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[Correlation] Error correlating video ${videoId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all correlations for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<Array>} Array of correlation objects
 */
async function getCorrelationsByVideo(videoId) {
  try {
    const result = await pool.query(
      `SELECT
         c.*,
         f.timestamp_seconds,
         f.frame_path,
         f.thumbnail_path,
         f.on_screen_text,
         f.content_type
       FROM frame_transcript_correlations c
       JOIN frames f ON c.frame_id = f.id
       WHERE c.video_id = $1
       ORDER BY c.segment_start ASC, c.correlation_score DESC`,
      [videoId]
    );

    return result.rows;
  } catch (error) {
    console.error(`[Correlation] Error fetching correlations for video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Get correlations at a specific timestamp
 * @param {string} videoId - Video UUID
 * @param {number} timestamp - Timestamp in seconds
 * @param {number} buffer - Time buffer in seconds (default: 2)
 * @returns {Promise<Array>} Array of correlation objects
 */
async function getCorrelationsByTime(videoId, timestamp, buffer = 2) {
  try {
    const result = await pool.query(
      `SELECT
         c.*,
         f.timestamp_seconds,
         f.frame_path,
         f.thumbnail_path,
         f.on_screen_text,
         f.content_type,
         f.scene_description
       FROM frame_transcript_correlations c
       JOIN frames f ON c.frame_id = f.id
       WHERE c.video_id = $1
         AND c.segment_start <= $2 + $3
         AND c.segment_end >= $2 - $3
       ORDER BY c.correlation_score DESC`,
      [videoId, timestamp, buffer]
    );

    return result.rows;
  } catch (error) {
    console.error(`[Correlation] Error fetching correlations at time ${timestamp} for video ${videoId}:`, error);
    throw error;
  }
}

module.exports = {
  correlateVideoContent,
  findFramesInTimeRange,
  calculateContentSimilarity,
  findMatchingElements,
  storeCorrelation,
  getTranscriptSegments,
  getAnalyzedFrames,
  getCorrelationsByVideo,
  getCorrelationsByTime
};
