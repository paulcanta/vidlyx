/**
 * YouTube Service
 * Handles fetching and storing YouTube video metadata and transcripts
 */

const pythonService = require('./pythonService');
const videoService = require('./videoService');
const pool = require('./db');

/**
 * Fetch metadata from YouTube and store in database
 * @param {string} youtubeId - YouTube video ID
 * @param {string} dbVideoId - Database video ID
 * @returns {Promise<object>} - Updated video record
 */
async function fetchAndStoreMetadata(youtubeId, dbVideoId) {
  console.log(`Fetching metadata for video: ${youtubeId}`);

  try {
    // Update status to processing
    await videoService.updateVideoStatus(dbVideoId, 'processing');

    // Fetch metadata from Python script
    const metadata = await pythonService.getVideoMetadata(youtubeId);

    // Update video record with metadata
    const updatedVideo = await videoService.updateVideoMetadata(dbVideoId, {
      title: metadata.title,
      channel_name: metadata.channel,
      duration: metadata.duration,
      thumbnail_url: metadata.thumbnail,
      description: metadata.description
    });

    console.log(`Metadata stored for video: ${youtubeId}`);
    return updatedVideo;
  } catch (error) {
    console.error(`Failed to fetch metadata for ${youtubeId}:`, error.message);
    await videoService.updateVideoStatus(dbVideoId, 'failed');
    throw error;
  }
}

/**
 * Fetch transcript from YouTube and store in database
 * @param {string} youtubeId - YouTube video ID
 * @param {string} dbVideoId - Database video ID
 * @returns {Promise<object>} - Transcription record
 */
async function fetchAndStoreTranscript(youtubeId, dbVideoId) {
  console.log(`Fetching transcript for video: ${youtubeId}`);

  const client = await pool.connect();
  try {
    // Fetch transcript from Python script
    const transcriptData = await pythonService.getTranscript(youtubeId);

    // Check if transcript already exists
    const existingResult = await client.query(
      'SELECT id FROM transcriptions WHERE video_id = $1',
      [dbVideoId]
    );

    let transcription;

    if (existingResult.rows.length > 0) {
      // Update existing transcript
      const updateResult = await client.query(
        `UPDATE transcriptions
         SET full_text = $1, segments = $2, transcript_type = $3, language = $4
         WHERE video_id = $5
         RETURNING *`,
        [
          transcriptData.full_text,
          JSON.stringify(transcriptData.segments),
          transcriptData.type,
          transcriptData.language,
          dbVideoId
        ]
      );
      transcription = updateResult.rows[0];
    } else {
      // Insert new transcript
      const insertResult = await client.query(
        `INSERT INTO transcriptions (video_id, full_text, segments, transcript_type, language)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          dbVideoId,
          transcriptData.full_text,
          JSON.stringify(transcriptData.segments),
          transcriptData.type,
          transcriptData.language
        ]
      );
      transcription = insertResult.rows[0];
    }

    console.log(`Transcript stored for video: ${youtubeId}`);
    return transcription;
  } catch (error) {
    console.error(`Failed to fetch transcript for ${youtubeId}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get transcript for a video
 * @param {string} videoId - Database video ID
 * @returns {Promise<object|null>} - Transcription record or null
 */
async function getTranscriptByVideoId(videoId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM transcriptions WHERE video_id = $1',
      [videoId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Process video - fetch metadata and transcript
 * @param {object} video - Video record from database
 * @returns {Promise<void>}
 */
async function processVideo(video) {
  console.log(`Processing video: ${video.youtube_id}`);

  try {
    // Step 1: Fetch and store metadata
    await fetchAndStoreMetadata(video.youtube_id, video.id);
    await videoService.updateVideoStatus(video.id, 'metadata_complete');

    // Step 2: Fetch and store transcript
    let transcriptAvailable = false;
    try {
      await fetchAndStoreTranscript(video.youtube_id, video.id);
      await videoService.updateVideoStatus(video.id, 'transcript_complete');
      transcriptAvailable = true;
    } catch (transcriptError) {
      // Transcript might not be available - continue anyway
      console.log(`Transcript not available for ${video.youtube_id}: ${transcriptError.message}`);
      await videoService.updateVideoStatus(video.id, 'transcript_unavailable');
    }

    // Step 3: Detect sections and generate summaries (if transcript is available)
    if (transcriptAvailable) {
      try {
        console.log(`Detecting sections for video: ${video.youtube_id}`);
        const sectionDetectionService = require('./sectionDetectionService');
        const result = await sectionDetectionService.detectSections(video.id);
        console.log(`Sections detected for video ${video.youtube_id}: ${result.sections?.length || 0} sections`);

        // Step 4: Generate video summary (if sections were detected)
        if (result.sections && result.sections.length > 0) {
          try {
            console.log(`Generating summary for video: ${video.youtube_id}`);
            const summaryService = require('./summaryService');
            await summaryService.generateEnhancedVideoSummary(video.id);
            console.log(`Summary generated for video: ${video.youtube_id}`);
          } catch (summaryError) {
            console.error(`Failed to generate summary for ${video.youtube_id}:`, summaryError.message);
            // Continue anyway - sections are still available
          }
        } else {
          console.log(`No sections detected for ${video.youtube_id}, skipping summary generation`);
        }
      } catch (sectionError) {
        console.error(`Failed to detect sections for ${video.youtube_id}:`, sectionError.message);
        // Continue anyway - transcript is still available
      }
    }

    // Final status
    await videoService.updateVideoStatus(video.id, 'completed');
    console.log(`Video processing completed: ${video.youtube_id}`);
  } catch (error) {
    console.error(`Video processing failed for ${video.youtube_id}:`, error.message);
    await videoService.updateVideoStatus(video.id, 'failed');
    throw error;
  }
}

/**
 * Search within a transcript
 * @param {string} videoId - Database video ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Matching segments
 */
async function searchTranscript(videoId, query) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT segments FROM transcriptions WHERE video_id = $1',
      [videoId]
    );

    if (!result.rows[0]) {
      return [];
    }

    const segments = result.rows[0].segments || [];
    const lowerQuery = query.toLowerCase();

    // Filter segments that contain the query
    return segments.filter(segment =>
      segment.text.toLowerCase().includes(lowerQuery)
    );
  } finally {
    client.release();
  }
}

module.exports = {
  fetchAndStoreMetadata,
  fetchAndStoreTranscript,
  getTranscriptByVideoId,
  processVideo,
  searchTranscript
};
