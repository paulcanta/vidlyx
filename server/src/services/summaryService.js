/**
 * Summary Service
 * Handles generation and retrieval of video summaries
 * Uses Claude API when available, falls back to local generation
 */

const pool = require('./db');
const claudeService = require('./claudeService');
const youtubeService = require('./youtubeService');
const videoService = require('./videoService');
const localSummary = require('./localSummaryService');

/**
 * Check if Claude API is available (valid key configured)
 * Set USE_LOCAL_ANALYSIS=true to force local generation
 * @returns {boolean} - True if API key is properly configured
 */
function isClaudeAvailable() {
  // Force local analysis if env var is set
  if (process.env.USE_LOCAL_ANALYSIS === 'true') {
    return false;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  // Check if key exists and is not a placeholder
  return key &&
         key.length > 20 &&
         key.startsWith('sk-ant-') &&
         !key.includes('your_') &&
         !key.includes('_here');
}

/**
 * Format duration from seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (e.g., "10m 30s")
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) {
    return '0s';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get video from database
 * @param {string} videoId - Video database ID
 * @returns {Promise<object|null>} - Video record or null
 */
async function getVideo(videoId) {
  return await videoService.findVideoById(videoId);
}

/**
 * Get transcript text for a video
 * @param {string} videoId - Video database ID
 * @returns {Promise<string>} - Full transcript text
 */
async function getTranscript(videoId) {
  const transcript = await youtubeService.getTranscriptByVideoId(videoId);
  return transcript ? transcript.full_text : '';
}

/**
 * Get sections with summaries for a video
 * @param {string} videoId - Video database ID
 * @returns {Promise<Array>} - Array of sections with summaries
 */
async function getSections(videoId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, video_id, title, start_time, end_time, summary, key_points, section_order
       FROM sections
       WHERE video_id = $1
       ORDER BY section_order ASC`,
      [videoId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get sections that have summaries
 * @param {string} videoId - Video database ID
 * @returns {Promise<Array>} - Array of sections with summaries
 */
async function getSectionsWithSummaries(videoId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, video_id, title, start_time, end_time, summary, key_points, section_order
       FROM sections
       WHERE video_id = $1
       AND summary IS NOT NULL
       ORDER BY section_order ASC`,
      [videoId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get frames within a section's time range
 * @param {Object} section - Section object with video_id, start_time and end_time
 * @returns {Promise<Array>} - Array of frame objects
 */
async function getFramesForSection(section) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM frames
       WHERE video_id = $1
       AND timestamp_seconds >= $2
       AND timestamp_seconds <= $3
       ORDER BY timestamp_seconds ASC
       LIMIT 5`,
      [section.video_id, section.start_time, section.end_time]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Update section with summary data
 * @param {string} sectionId - Section UUID
 * @param {Object} summaryData - Object with summary and key_points
 * @returns {Promise<Object>} - Updated section
 */
async function updateSectionSummary(sectionId, summaryData) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE sections
       SET summary = $1, key_points = $2
       WHERE id = $3
       RETURNING *`,
      [summaryData.summary, JSON.stringify(summaryData.key_points), sectionId]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Store video-level summary
 * @param {string} videoId - Video UUID
 * @param {Object} summary - Summary object with executive_summary, key_takeaways, main_topics
 * @returns {Promise<Object>} - Stored summary
 */
async function storeVideoSummary(videoId, summary) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO video_summaries (video_id, full_summary, key_takeaways, topics)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (video_id)
       DO UPDATE SET
         full_summary = EXCLUDED.full_summary,
         key_takeaways = EXCLUDED.key_takeaways,
         topics = EXCLUDED.topics
       RETURNING *`,
      [
        videoId,
        summary.executive_summary,
        JSON.stringify(summary.key_takeaways),
        JSON.stringify(summary.main_topics)
      ]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Sleep utility for rate limiting
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate summary for a single section
 * @param {Object} section - Section object with title, start_time, end_time
 * @param {Array} visualContext - Optional array of frame objects for visual context
 * @param {string} sectionTranscript - Optional transcript text for this section
 * @returns {Promise<Object>} - Object with summary and key_points
 */
async function generateSectionSummary(section, visualContext = null, sectionTranscript = '') {
  // Check if Claude API is available, use local fallback if not
  if (!isClaudeAvailable()) {
    console.log('Claude API not available, using local section summary...');
    return localSummary.generateLocalSectionSummary(section, sectionTranscript);
  }

  try {
    // Build prompt with section information
    let prompt = `Generate a concise summary for this video section:

Section Title: ${section.title}
Duration: ${parseFloat(section.start_time).toFixed(1)}s - ${parseFloat(section.end_time).toFixed(1)}s
`;

    // Add visual context if available
    if (visualContext && visualContext.length > 0) {
      prompt += `\nVisual Context (frames from this section):\n`;
      visualContext.forEach((frame, idx) => {
        prompt += `Frame ${idx + 1} (${parseFloat(frame.timestamp_seconds).toFixed(1)}s):\n`;
        if (frame.scene_description) {
          prompt += `  - Scene: ${frame.scene_description}\n`;
        }
        if (frame.on_screen_text) {
          prompt += `  - Text: ${frame.on_screen_text}\n`;
        }
      });
    }

    prompt += `\nProvide your response in JSON format with this exact structure:
{
  "summary": "A clear 2-3 sentence summary of what happens in this section",
  "key_points": ["Point 1", "Point 2", "Point 3"]
}

Include 3-5 key points (bullet points as array items). Focus on the main ideas and important details.

Provide ONLY the JSON response, no additional text.`;

    // Call Claude API using generateText method
    const response = await claudeService.generateText(prompt);

    // Parse JSON response
    let summaryData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      summaryData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', response);
      // Return fallback summary
      return {
        summary: `Section covering ${section.title}`,
        key_points: [`Duration: ${parseFloat(section.start_time).toFixed(1)}s - ${parseFloat(section.end_time).toFixed(1)}s`]
      };
    }

    // Validate response structure
    if (!summaryData.summary || !summaryData.key_points) {
      console.warn('Invalid summary structure from Claude, using fallback');
      return {
        summary: summaryData.summary || `Section covering ${section.title}`,
        key_points: summaryData.key_points || [`Duration: ${parseFloat(section.start_time).toFixed(1)}s - ${parseFloat(section.end_time).toFixed(1)}s`]
      };
    }

    return {
      summary: summaryData.summary,
      key_points: summaryData.key_points
    };

  } catch (error) {
    console.error('Error generating section summary:', error);
    throw new Error(`Failed to generate section summary: ${error.message}`);
  }
}

/**
 * Generate summaries for all sections in a video
 * @param {string} videoId - Video UUID
 * @param {Function} onProgress - Optional progress callback (percentage)
 * @returns {Promise<Object>} - Result object with success status and stats
 */
async function generateAllSectionSummaries(videoId, onProgress = null) {
  try {
    // Get all sections for this video
    const sections = await getSections(videoId);

    if (sections.length === 0) {
      return {
        success: false,
        message: 'No sections found for this video',
        processed: 0,
        total: 0
      };
    }

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      try {
        // Get frames for visual context
        const frames = await getFramesForSection(section);

        // Generate summary for this section
        const summaryData = await generateSectionSummary(section, frames);

        // Update section with summary
        await updateSectionSummary(section.id, summaryData);

        processed++;

        // Call progress callback
        if (onProgress) {
          const percentage = Math.round((processed / sections.length) * 100);
          onProgress(percentage);
        }

        console.log(`Generated summary for section ${i + 1}/${sections.length}: ${section.title}`);

        // Rate limiting: wait 4 seconds before next call (except for last one)
        if (i < sections.length - 1) {
          await sleep(4000);
        }

      } catch (error) {
        console.error(`Failed to generate summary for section ${section.id}:`, error.message);
        failed++;
      }
    }

    return {
      success: true,
      message: `Generated summaries for ${processed} out of ${sections.length} sections`,
      processed,
      failed,
      total: sections.length
    };

  } catch (error) {
    console.error('Error generating section summaries:', error);
    throw new Error(`Failed to generate section summaries: ${error.message}`);
  }
}

/**
 * Generate comprehensive video-level summary from section summaries
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} - Video summary object
 */
async function generateFullVideoSummary(videoId) {
  try {
    // Get video metadata
    const video = await getVideo(videoId);

    if (!video) {
      throw new Error('Video not found');
    }

    // Get all sections with summaries
    const sections = await getSectionsWithSummaries(videoId);

    if (sections.length === 0) {
      throw new Error('No section summaries available. Please generate section summaries first.');
    }

    // Check if Claude API is available, use local fallback if not
    if (!isClaudeAvailable()) {
      console.log('Claude API not available, using local full video summary...');
      const transcript = await getTranscript(videoId);
      const summaryData = localSummary.generateLocalSummary(video, transcript, sections);

      // Store in database
      const storedSummary = await storeVideoSummary(videoId, {
        executive_summary: summaryData.executive_summary,
        key_takeaways: summaryData.key_takeaways,
        main_topics: summaryData.main_topics
      });

      return {
        success: true,
        summary: {
          executive_summary: summaryData.executive_summary,
          key_takeaways: summaryData.key_takeaways,
          main_topics: summaryData.main_topics,
          target_audience: summaryData.target_audience,
          sections_analyzed: sections.length
        },
        stored: storedSummary,
        generated_locally: true
      };
    }

    // Build comprehensive prompt
    let prompt = `Generate a comprehensive video summary based on the following information:

Video Title: ${video.title || 'Untitled'}
Channel: ${video.channel_name || 'Unknown'}
Duration: ${video.duration ? Math.floor(video.duration / 60) + ' minutes' : 'Unknown'}

Section Summaries:
`;

    sections.forEach((section, idx) => {
      prompt += `\n${idx + 1}. ${section.title} (${parseFloat(section.start_time).toFixed(1)}s - ${parseFloat(section.end_time).toFixed(1)}s)\n`;
      prompt += `   Summary: ${section.summary}\n`;
      if (section.key_points) {
        const keyPoints = typeof section.key_points === 'string' ? JSON.parse(section.key_points) : section.key_points;
        prompt += `   Key Points:\n`;
        keyPoints.forEach(point => {
          prompt += `     - ${point}\n`;
        });
      }
    });

    prompt += `\nGenerate a comprehensive video summary in JSON format with this exact structure:
{
  "executive_summary": "A concise 3-4 sentence overview of the entire video",
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
  "main_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "target_audience": "Description of who would benefit from this video"
}

Include 5-7 key takeaways and 3-5 main topics.

Provide ONLY the JSON response, no additional text.`;

    // Call Claude API using generateText method
    const response = await claudeService.generateText(prompt);

    // Parse JSON response
    let videoSummary;
    try {
      // Remove markdown code blocks if present
      const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      videoSummary = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', response);
      throw new Error('Failed to parse Claude response as JSON');
    }

    // Validate response structure
    if (!videoSummary.executive_summary || !videoSummary.key_takeaways || !videoSummary.main_topics) {
      throw new Error('Invalid video summary structure from Claude API');
    }

    // Store in database
    const storedSummary = await storeVideoSummary(videoId, videoSummary);

    return {
      success: true,
      summary: {
        executive_summary: videoSummary.executive_summary,
        key_takeaways: videoSummary.key_takeaways,
        main_topics: videoSummary.main_topics,
        target_audience: videoSummary.target_audience || 'General audience',
        sections_analyzed: sections.length
      },
      stored: storedSummary
    };

  } catch (error) {
    console.error('Error generating video summary:', error);
    throw new Error(`Failed to generate video summary: ${error.message}`);
  }
}

/**
 * Generate enhanced video summary using Claude AI or local fallback
 * @param {string} videoId - Video database ID
 * @returns {Promise<object>} - Generated summary data
 */
async function generateEnhancedVideoSummary(videoId) {
  console.log(`Generating enhanced video summary for video: ${videoId}`);

  try {
    // Get video metadata first (needed for both paths)
    const video = await getVideo(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Get transcript
    let transcriptText = '';
    try {
      transcriptText = await getTranscript(videoId);
    } catch (error) {
      console.log(`Transcript not available for video ${videoId}: ${error.message}`);
    }

    // Get sections
    const sections = await getSections(videoId);

    // Check if Claude API is available
    if (!isClaudeAvailable()) {
      console.log('Claude API not available, using local summary generation...');
      return await generateLocalEnhancedSummary(videoId, video, transcriptText, sections);
    }

    // Initialize Claude service
    claudeService.initialize();

    // Build comprehensive prompt for Claude
    const sectionsText = sections.length > 0
      ? sections.map(s => {
          const summary = s.summary || 'No summary available';
          return `- ${s.title} (${formatDuration(s.start_time)} - ${formatDuration(s.end_time)}): ${summary}`;
        }).join('\n')
      : 'No sections available yet.';

    const transcriptPreview = transcriptText
      ? transcriptText.substring(0, 2000)
      : 'Transcript not available.';

    const prompt = `Analyze this video and provide a comprehensive summary:

Video Title: "${video.title}"
Channel: ${video.channel_name || 'Unknown'}
Duration: ${formatDuration(video.duration)}

Sections:
${sectionsText}

Full Transcript (first 2000 characters):
${transcriptPreview}

Provide a detailed analysis in JSON format with the following structure:
{
  "executive_summary": "A comprehensive 3-4 sentence overview of the video's content, main message, and purpose",
  "key_takeaways": ["5-7 actionable points or main insights from the video"],
  "main_topics": ["List of main topics covered in the video"],
  "target_audience": "Detailed description of who should watch this video",
  "difficulty_level": "beginner|intermediate|advanced",
  "estimated_value": "What viewers will learn or gain from watching this video",
  "recommended_for": ["Specific use cases or situations when this video is most valuable"],
  "prerequisites": ["What viewers should know or understand before watching (empty array if none)"]
}

Provide ONLY the JSON response, no additional text or markdown formatting.`;

    // Call Claude API
    console.log('Calling Claude API for video summary...');
    const responseText = await claudeService.generateText(prompt);

    // Parse JSON response
    let summaryData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      summaryData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate response structure
    if (!summaryData.executive_summary || !summaryData.key_takeaways || !summaryData.difficulty_level) {
      throw new Error('Invalid response structure from AI');
    }

    // Store in database using UPSERT
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO video_summaries (
          video_id,
          full_summary,
          key_takeaways,
          topics,
          target_audience,
          difficulty_level,
          estimated_value,
          recommended_for,
          prerequisites,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (video_id)
        DO UPDATE SET
          full_summary = EXCLUDED.full_summary,
          key_takeaways = EXCLUDED.key_takeaways,
          topics = EXCLUDED.topics,
          target_audience = EXCLUDED.target_audience,
          difficulty_level = EXCLUDED.difficulty_level,
          estimated_value = EXCLUDED.estimated_value,
          recommended_for = EXCLUDED.recommended_for,
          prerequisites = EXCLUDED.prerequisites,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          videoId,
          summaryData.executive_summary,
          JSON.stringify(summaryData.key_takeaways),
          JSON.stringify(summaryData.main_topics),
          summaryData.target_audience,
          summaryData.difficulty_level,
          summaryData.estimated_value,
          JSON.stringify(summaryData.recommended_for),
          JSON.stringify(summaryData.prerequisites)
        ]
      );

      console.log(`Video summary generated and stored for video: ${videoId}`);
      return result.rows[0];
    } finally {
      client.release();
    }

  } catch (error) {
    console.error(`Failed to generate video summary for ${videoId}:`, error.message);
    throw error;
  }
}

/**
 * Get video summary from database
 * @param {string} videoId - Video database ID
 * @returns {Promise<object|null>} - Video summary or null
 */
async function getVideoSummary(videoId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM video_summaries WHERE video_id = $1`,
      [videoId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Generate enhanced summary using local text analysis (no API)
 * @param {string} videoId - Video database ID
 * @param {object} video - Video object
 * @param {string} transcriptText - Full transcript
 * @param {Array} sections - Section objects
 * @returns {Promise<object>} - Stored summary
 */
async function generateLocalEnhancedSummary(videoId, video, transcriptText, sections) {
  console.log('Generating local enhanced summary (no API)...');

  // Generate summary using local text analysis
  const summaryData = localSummary.generateLocalSummary(video, transcriptText, sections);

  // Store in database
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO video_summaries (
        video_id,
        full_summary,
        key_takeaways,
        topics,
        target_audience,
        difficulty_level,
        estimated_value,
        recommended_for,
        prerequisites,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (video_id)
      DO UPDATE SET
        full_summary = EXCLUDED.full_summary,
        key_takeaways = EXCLUDED.key_takeaways,
        topics = EXCLUDED.topics,
        target_audience = EXCLUDED.target_audience,
        difficulty_level = EXCLUDED.difficulty_level,
        estimated_value = EXCLUDED.estimated_value,
        recommended_for = EXCLUDED.recommended_for,
        prerequisites = EXCLUDED.prerequisites,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        videoId,
        summaryData.executive_summary,
        JSON.stringify(summaryData.key_takeaways),
        JSON.stringify(summaryData.main_topics),
        summaryData.target_audience,
        summaryData.difficulty_level,
        summaryData.estimated_value,
        JSON.stringify(summaryData.recommended_for),
        JSON.stringify(summaryData.prerequisites)
      ]
    );

    console.log(`Local summary generated and stored for video: ${videoId}`);
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Format timestamp for display
 * @param {number} seconds - Timestamp in seconds
 * @returns {string} Formatted timestamp (MM:SS or HH:MM:SS)
 */
function formatTimestamp(seconds) {
  if (!seconds && seconds !== 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract key points with timestamps from video sections and transcript
 * @param {string} videoId - Video UUID
 * @returns {Promise<Array>} Array of key points with metadata
 */
async function extractKeyPointsWithTimestamps(videoId) {
  try {
    // Get sections for the video
    const sections = await getSections(videoId);

    if (!sections || sections.length === 0) {
      throw new Error('No sections found for this video');
    }

    // Get transcript
    const client = await pool.connect();
    let transcript = null;
    try {
      const transcriptResult = await client.query(
        `SELECT segments, full_text
         FROM transcriptions
         WHERE video_id = $1
         LIMIT 1`,
        [videoId]
      );
      transcript = transcriptResult.rows[0];
    } finally {
      client.release();
    }

    // Check if Claude API is available, use local fallback if not
    if (!isClaudeAvailable()) {
      console.log('Claude API not available, using local key points extraction...');
      // Generate local key points from sections
      return sections.map((s, i) => ({
        point: s.summary || s.title || `Section ${i + 1}`,
        timestamp: parseFloat(s.start_time) || 0,
        context: s.title || '',
        category: 'insight',
        sectionId: s.id
      }));
    }

    // Build context for Claude
    const sectionsContext = sections.map(s => {
      const startTime = formatTimestamp(parseFloat(s.start_time));
      const endTime = formatTimestamp(parseFloat(s.end_time));
      return `[${startTime} - ${endTime}] ${s.title}: ${s.summary || 'No summary'}`;
    }).join('\n');

    // Create prompt for Claude
    const prompt = `Extract key points from this video with their timestamps:

Sections:
${sectionsContext}

${transcript ? `\nFull Transcript Available: Yes (${transcript.full_text.length} characters)` : 'Full Transcript: Not available'}

For each key point, identify:
1. The key insight, action item, definition, or example
2. The approximate timestamp where it's discussed (in seconds)
3. A brief quote or context from the video
4. Category: "insight", "action", "definition", or "example"

Guidelines:
- Extract 5-15 key points depending on video length
- Focus on the most important and actionable information
- Use exact timestamps based on the sections provided
- Include diverse categories
- Prioritize clarity and conciseness

Format as JSON array:
[
  {
    "point": "key insight text",
    "timestamp": 125.5,
    "context": "brief context or quote",
    "category": "insight|action|definition|example"
  }
]

Provide ONLY the JSON response, no additional text.`;

    // Call Claude API
    const response = await claudeService.generateText(prompt);

    // Parse JSON response
    let keyPoints;
    try {
      // Remove markdown code blocks if present
      const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      keyPoints = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', response);
      throw new Error('Failed to parse Claude response as JSON');
    }

    // Validate and normalize key points
    if (!Array.isArray(keyPoints)) {
      throw new Error('Expected array of key points from Claude');
    }

    // Match key points to sections
    const normalizedKeyPoints = keyPoints.map(kp => {
      const timestamp = parseFloat(kp.timestamp) || 0;

      // Find matching section
      const matchingSection = sections.find(s =>
        parseFloat(s.start_time) <= timestamp && parseFloat(s.end_time) >= timestamp
      );

      return {
        point: kp.point,
        timestamp: timestamp,
        context: kp.context || '',
        category: kp.category || 'insight',
        sectionId: matchingSection ? matchingSection.id : null
      };
    });

    return normalizedKeyPoints;

  } catch (error) {
    console.error('Error extracting key points:', error);
    throw new Error(`Key points extraction failed: ${error.message}`);
  }
}

/**
 * Store key points in database
 * @param {string} videoId - Video UUID
 * @param {Array} keyPoints - Array of key points
 * @returns {Promise<Array>} Stored key points with IDs
 */
async function storeKeyPoints(videoId, keyPoints) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const storedPoints = [];

    for (const kp of keyPoints) {
      const result = await client.query(
        `INSERT INTO key_points (video_id, section_id, point_text, timestamp_seconds, context, category, importance)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          videoId,
          kp.sectionId || null,
          kp.point,
          kp.timestamp,
          kp.context || null,
          kp.category || 'insight',
          kp.importance || 1
        ]
      );

      storedPoints.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return storedPoints;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error storing key points:', error);
    throw new Error(`Failed to store key points: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Get key points for a video with optional filtering
 * @param {string} videoId - Video UUID
 * @param {Object} filter - Filter options
 * @returns {Promise<Array>} Array of key points
 */
async function getKeyPoints(videoId, filter = {}) {
  try {
    let query = `
      SELECT
        kp.id,
        kp.video_id,
        kp.section_id,
        kp.point_text,
        kp.timestamp_seconds,
        kp.context,
        kp.category,
        kp.importance,
        kp.created_at,
        s.title as section_title
      FROM key_points kp
      LEFT JOIN sections s ON kp.section_id = s.id
      WHERE kp.video_id = $1
    `;

    const params = [videoId];

    // Apply category filter if provided
    if (filter.category && filter.category !== 'all') {
      query += ` AND kp.category = $2`;
      params.push(filter.category);
    }

    query += ` ORDER BY kp.timestamp_seconds ASC`;

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching key points:', error);
    throw new Error(`Failed to fetch key points: ${error.message}`);
  }
}

/**
 * Delete all key points for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<number>} Number of deleted key points
 */
async function deleteKeyPoints(videoId) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM key_points WHERE video_id = $1',
        [videoId]
      );
      return result.rowCount;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting key points:', error);
    throw new Error(`Failed to delete key points: ${error.message}`);
  }
}

/**
 * Extract and store key points for a video (full workflow)
 * @param {string} videoId - Video UUID
 * @returns {Promise<Array>} Stored key points
 */
async function extractAndStoreKeyPoints(videoId) {
  try {
    // Delete existing key points
    await deleteKeyPoints(videoId);

    // Extract new key points
    const keyPoints = await extractKeyPointsWithTimestamps(videoId);

    // Store key points
    const storedPoints = await storeKeyPoints(videoId, keyPoints);

    return storedPoints;

  } catch (error) {
    console.error('Error in extract and store workflow:', error);
    throw error;
  }
}

/**
 * Generate comprehensive video analysis in markdown format
 * Similar to the detailed analysis document format
 * @param {string} videoId - Video UUID
 * @returns {Promise<Object>} - Object with comprehensive analysis markdown
 */
async function generateComprehensiveAnalysis(videoId) {
  console.log(`Generating comprehensive video analysis for: ${videoId}`);

  try {
    // Get video metadata first (needed for both paths)
    const video = await getVideo(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Get full transcript
    let fullTranscript = '';
    try {
      fullTranscript = await getTranscript(videoId);
    } catch (error) {
      console.log(`Transcript not available: ${error.message}`);
    }

    // Get sections
    const sections = await getSections(videoId);

    // Get existing summary if any
    const existingSummary = await getVideoSummary(videoId);

    // Check if Claude API is available
    if (!isClaudeAvailable()) {
      console.log('Claude API not available, using local analysis generation...');
      return await generateLocalComprehensiveAnalysis(videoId, video, fullTranscript, sections, existingSummary);
    }

    claudeService.initialize();

    // Build sections context
    const sectionsContext = sections.length > 0
      ? sections.map(s => {
          const start = formatTimestamp(parseFloat(s.start_time));
          const end = formatTimestamp(parseFloat(s.end_time));
          return `- ${start} - ${end}: ${s.title}${s.summary ? ` (${s.summary})` : ''}`;
        }).join('\n')
      : 'No sections detected.';

    // Calculate transcript stats
    const wordCount = fullTranscript ? fullTranscript.split(/\s+/).length : 0;
    const charCount = fullTranscript ? fullTranscript.length : 0;

    // Split transcript into chunks if too long (Claude has context limits)
    // Use up to 30000 characters for comprehensive analysis
    const transcriptForAnalysis = fullTranscript.length > 30000
      ? fullTranscript.substring(0, 30000) + '\n\n[Transcript truncated for analysis - full transcript available in system]'
      : fullTranscript;

    const prompt = `You are creating a comprehensive, reader-friendly analysis of a video. Write like a professional content summarizer who makes complex topics easy to understand.

VIDEO DETAILS:
- Title: "${video.title}"
- Channel: ${video.channel_name || 'Unknown'}
- Duration: ${formatDuration(video.duration)}
- URL: https://www.youtube.com/watch?v=${video.youtube_id}

SECTIONS DETECTED:
${sectionsContext}

TRANSCRIPT:
${transcriptForAnalysis || 'Transcript not available.'}

---

Create a COMPREHENSIVE analysis in Markdown. Write in a flowing, narrative style with proper paragraphs. The reader should understand the full content without watching the video.

REQUIRED FORMAT (use these exact headings):

# Video Analysis: ${video.title}

## At a Glance

| Detail | Information |
|--------|-------------|
| **Category** | [Classify: Tutorial, News/Commentary, Entertainment, Music, Documentary, Review, Educational, How-To, Vlog, Interview, Product Demo, Gaming, etc.] |
| **Channel** | ${video.channel_name || 'Unknown'} |
| **Duration** | ${formatDuration(video.duration)} |
| **Difficulty** | [Beginner / Intermediate / Advanced / General Audience] |
| **Best For** | [2-3 word description of ideal viewer] |

---

## Overview

Write 2-3 substantial paragraphs (not bullet points) explaining:
- What this video is fundamentally about
- The main message or thesis the creator is conveying
- Why someone would want to watch this
- The overall tone and approach (educational, entertaining, persuasive, etc.)

---

## Main Content

This is the heart of the analysis. Write flowing paragraphs organized by topic. Use this structure:

### [First Major Topic/Section Title]

Write 2-4 paragraphs explaining this topic in detail. Include:
- The key concepts explained
- Specific examples, numbers, or data mentioned
- Quotes or key phrases from the speaker (use "quotation marks")

If there are step-by-step instructions, use numbered lists:
1. First step with explanation
2. Second step with explanation

If there are comparisons or data, use tables:
| Item | Detail |
|------|--------|
| ... | ... |

### [Second Major Topic]

Continue with detailed paragraphs for each major topic covered in the video. Aim for 3-8 major sections depending on video length.

### [Continue for all major topics...]

---

## Key Takeaways

Summarize the most important points in a numbered list:

1. **[Key Point Title]** - Explain in one clear sentence why this matters
2. **[Key Point Title]** - Another important insight
3. Continue for 5-10 key points...

---

## Who Should Watch This

Write a paragraph about the ideal audience. Be specific about:
- What prior knowledge is helpful (if any)
- What problems this video solves
- Who would NOT benefit from this video

---

## Final Verdict

Write a 2-3 sentence conclusion. Be direct about the video's value and whether it's worth the viewer's time.

**Rating Context**: [One sentence situating this video - e.g., "Great for beginners but experienced developers may find it basic" or "Essential viewing for anyone interested in X"]

---

WRITING GUIDELINES:
1. Use PARAGRAPHS, not endless bullet points - write like a magazine article
2. LEFT-ALIGN everything - no centered text
3. Include SPECIFIC details (numbers, names, exact steps) from the transcript
4. Use **bold** for emphasis on key terms, not whole sentences
5. Keep the reader engaged - write clearly and conversationally
6. If technical content exists (code, commands, APIs), include it in proper code blocks
7. For tutorials/how-tos, preserve the exact steps in numbered lists
8. Minimum 1500 words for substantial videos
9. NO meta-commentary like "In this section we'll cover..."

Provide ONLY the Markdown document.`;

    // Call Claude API
    console.log('Calling Claude API for comprehensive analysis...');
    const response = await claudeService.generateText(prompt);

    // Clean up the response (remove any code block wrappers)
    let analysisMarkdown = response.trim();
    if (analysisMarkdown.startsWith('```markdown')) {
      analysisMarkdown = analysisMarkdown.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
    } else if (analysisMarkdown.startsWith('```')) {
      analysisMarkdown = analysisMarkdown.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Add generation metadata at the end
    const generationDate = new Date().toISOString().split('T')[0];
    analysisMarkdown += `\n\n---\n\n*Analysis generated: ${generationDate}*\n*Video: https://www.youtube.com/watch?v=${video.youtube_id}*`;

    // Store in database
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE video_summaries
         SET comprehensive_analysis = $1, updated_at = CURRENT_TIMESTAMP
         WHERE video_id = $2`,
        [analysisMarkdown, videoId]
      );

      // If no summary exists yet, create one
      if (!existingSummary) {
        await client.query(
          `INSERT INTO video_summaries (video_id, full_summary, comprehensive_analysis)
           VALUES ($1, $2, $3)
           ON CONFLICT (video_id) DO UPDATE SET
             comprehensive_analysis = EXCLUDED.comprehensive_analysis,
             updated_at = CURRENT_TIMESTAMP`,
          [videoId, 'See comprehensive analysis', analysisMarkdown]
        );
      }

      console.log(`Comprehensive analysis generated and stored for video: ${videoId}`);
      return {
        success: true,
        videoId,
        comprehensive_analysis: analysisMarkdown,
        stats: {
          wordCount,
          charCount,
          analysisLength: analysisMarkdown.length
        }
      };
    } finally {
      client.release();
    }

  } catch (error) {
    console.error(`Failed to generate comprehensive analysis for ${videoId}:`, error.message);
    throw error;
  }
}

/**
 * Generate comprehensive analysis using local text analysis (no API)
 * @param {string} videoId - Video UUID
 * @param {object} video - Video object
 * @param {string} fullTranscript - Full transcript
 * @param {Array} sections - Section objects
 * @param {object} existingSummary - Existing summary if any
 * @returns {Promise<Object>} - Analysis result
 */
async function generateLocalComprehensiveAnalysis(videoId, video, fullTranscript, sections, existingSummary) {
  console.log('Generating local comprehensive analysis (no API)...');

  // Calculate stats
  const wordCount = fullTranscript ? fullTranscript.split(/\s+/).length : 0;
  const charCount = fullTranscript ? fullTranscript.length : 0;

  // Generate analysis using local text processing
  const analysisMarkdown = localSummary.generateLocalAnalysis(video, fullTranscript, sections);

  // Store in database
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE video_summaries
       SET comprehensive_analysis = $1, updated_at = CURRENT_TIMESTAMP
       WHERE video_id = $2`,
      [analysisMarkdown, videoId]
    );

    // If no summary exists yet, create one
    if (!existingSummary) {
      await client.query(
        `INSERT INTO video_summaries (video_id, full_summary, comprehensive_analysis)
         VALUES ($1, $2, $3)
         ON CONFLICT (video_id) DO UPDATE SET
           comprehensive_analysis = EXCLUDED.comprehensive_analysis,
           updated_at = CURRENT_TIMESTAMP`,
        [videoId, 'See comprehensive analysis', analysisMarkdown]
      );
    }

    console.log(`Local comprehensive analysis generated for video: ${videoId}`);
    return {
      success: true,
      videoId,
      comprehensive_analysis: analysisMarkdown,
      stats: {
        wordCount,
        charCount,
        analysisLength: analysisMarkdown.length
      },
      generated_locally: true
    };
  } finally {
    client.release();
  }
}

/**
 * Get comprehensive analysis for a video
 * @param {string} videoId - Video UUID
 * @returns {Promise<string|null>} - Comprehensive analysis markdown or null
 */
async function getComprehensiveAnalysis(videoId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT comprehensive_analysis FROM video_summaries WHERE video_id = $1`,
      [videoId]
    );
    return result.rows[0]?.comprehensive_analysis || null;
  } finally {
    client.release();
  }
}

module.exports = {
  isClaudeAvailable,
  formatDuration,
  formatTimestamp,
  getVideo,
  getTranscript,
  getSections,
  getSectionsWithSummaries,
  getFramesForSection,
  updateSectionSummary,
  storeVideoSummary,
  sleep,
  generateSectionSummary,
  generateAllSectionSummaries,
  generateFullVideoSummary,
  generateEnhancedVideoSummary,
  getVideoSummary,
  extractKeyPointsWithTimestamps,
  storeKeyPoints,
  getKeyPoints,
  deleteKeyPoints,
  extractAndStoreKeyPoints,
  generateComprehensiveAnalysis,
  getComprehensiveAnalysis
};
