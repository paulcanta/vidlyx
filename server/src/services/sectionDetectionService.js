/**
 * Section Detection Service
 * Detects logical sections in videos using transcript and keyframe analysis
 * Falls back to local detection when API is not available
 */

const db = require('./db');
const geminiService = require('./geminiService');

/**
 * Check if Gemini API should be used
 * Set USE_LOCAL_ANALYSIS=true to force local detection
 * @returns {boolean}
 */
function isGeminiAvailable() {
  // Force local analysis if env var is set
  if (process.env.USE_LOCAL_ANALYSIS === 'true') {
    return false;
  }
  const key = process.env.GEMINI_API_KEY;
  return key && key.length > 10 && !key.includes('your_');
}

class SectionDetectionService {
  /**
   * Main function to detect sections in a video
   * Uses local detection when API is not available
   * @param {string} videoId - UUID of the video
   * @returns {Object} Result with sections array and metadata
   */
  async detectSections(videoId) {
    try {
      console.log(`Starting section detection for video ${videoId}`);

      // Step 1: Get transcript segments
      const segments = await this.getTranscript(videoId);
      if (!segments || segments.length === 0) {
        throw new Error('No transcript available for this video');
      }

      // Check if we should use local detection (no API or quota exceeded)
      const useLocalDetection = !isGeminiAvailable();
      if (useLocalDetection) {
        console.log('Using local section detection (no API)...');
        return await this.detectSectionsLocally(videoId, segments);
      }

      // Step 2: Get keyframes
      const keyframes = await this.getKeyframes(videoId);
      if (!keyframes || keyframes.length === 0) {
        console.warn('No keyframes found - section detection will rely only on transcript analysis');
      }

      // Step 3: Detect topic changes in transcript
      const topicChanges = await this.detectTopicChanges(segments);

      // Step 4: Merge signals from keyframes and topic changes
      const boundaries = await this.mergeSignals(keyframes, topicChanges);

      // Step 5: Generate section metadata (titles, summaries)
      const sections = await this.generateSectionMetadata(videoId, boundaries, segments);

      // Step 6: Store sections in database
      for (let i = 0; i < sections.length; i++) {
        await this.storeSection(videoId, sections[i], i);
      }

      console.log(`Section detection completed: ${sections.length} sections detected`);

      return {
        success: true,
        sectionsDetected: sections.length,
        sections
      };

    } catch (error) {
      // If API error, try local detection as fallback
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('API')) {
        console.log('API error, falling back to local section detection...');
        const segments = await this.getTranscript(videoId);
        if (segments && segments.length > 0) {
          return await this.detectSectionsLocally(videoId, segments);
        }
      }
      console.error('Section detection error:', error);
      throw error;
    }
  }

  /**
   * Local section detection without API
   * Creates sections based on time intervals and keyword analysis
   * @param {string} videoId - UUID of the video
   * @param {Array} segments - Transcript segments
   * @returns {Object} Result with sections array
   */
  async detectSectionsLocally(videoId, segments) {
    console.log('Detecting sections locally...');

    // Get video duration from segments
    const lastSegment = segments[segments.length - 1];
    const totalDuration = lastSegment.end || lastSegment.start + 10;

    // Create sections at regular intervals (every 2-3 minutes or based on length)
    const targetSectionCount = Math.max(3, Math.min(10, Math.ceil(totalDuration / 120)));
    const sectionDuration = totalDuration / targetSectionCount;

    const sections = [];
    for (let i = 0; i < targetSectionCount; i++) {
      const startTime = i * sectionDuration;
      const endTime = Math.min((i + 1) * sectionDuration, totalDuration);

      // Get text for this section
      const sectionSegments = segments.filter(s =>
        s.start >= startTime && s.start < endTime
      );
      const sectionText = sectionSegments.map(s => s.text).join(' ');

      // Generate a title from first few words or keywords
      const title = this.generateLocalTitle(sectionText, i + 1);

      sections.push({
        title,
        startTime,
        endTime,
        summary: sectionText.substring(0, 200) + (sectionText.length > 200 ? '...' : ''),
        keyPoints: []
      });
    }

    // Store sections in database
    for (let i = 0; i < sections.length; i++) {
      await this.storeSection(videoId, sections[i], i);
    }

    console.log(`Local section detection completed: ${sections.length} sections`);

    return {
      success: true,
      sectionsDetected: sections.length,
      sections,
      detectedLocally: true
    };
  }

  /**
   * Generate a section title locally
   * @param {string} text - Section text
   * @param {number} sectionNum - Section number
   * @returns {string} Generated title
   */
  generateLocalTitle(text, sectionNum) {
    if (!text || text.length < 10) {
      return `Section ${sectionNum}`;
    }

    // Extract key phrases
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = {};

    // Count word frequency (excluding common words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your', 'i', 'me', 'my', 'so', 'just', 'like', 'um', 'uh', 'gonna', 'going', 'really', 'actually', 'basically', 'know', 'think', 'get', 'got']);

    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    // Get top words
    const topWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    if (topWords.length >= 2) {
      return topWords.slice(0, 2).join(' & ');
    } else if (topWords.length === 1) {
      return `About ${topWords[0]}`;
    }

    return `Section ${sectionNum}`;
  }

  /**
   * Get transcript segments from database
   * @param {string} videoId - UUID of the video
   * @returns {Array} Array of transcript segments
   */
  async getTranscript(videoId) {
    try {
      const result = await db.query(
        'SELECT segments FROM transcriptions WHERE video_id = $1',
        [videoId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Segments are stored as JSONB, parse them
      const segments = result.rows[0].segments;

      // Ensure segments have required structure
      return segments.map(seg => ({
        text: seg.text,
        start: parseFloat(seg.start),
        end: parseFloat(seg.end || seg.start + 2), // Default 2 second duration if not specified
        duration: parseFloat(seg.duration || 2)
      }));

    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
  }

  /**
   * Get keyframes (frames marked as is_keyframe=true)
   * @param {string} videoId - UUID of the video
   * @returns {Array} Array of keyframe objects with timestamps
   */
  async getKeyframes(videoId) {
    try {
      const result = await db.query(
        `SELECT id, timestamp_seconds, scene_description, visual_elements
         FROM frames
         WHERE video_id = $1 AND is_keyframe = true
         ORDER BY timestamp_seconds ASC`,
        [videoId]
      );

      return result.rows.map(row => ({
        id: row.id,
        timestamp: parseFloat(row.timestamp_seconds),
        sceneDescription: row.scene_description,
        visualElements: row.visual_elements
      }));

    } catch (error) {
      console.error('Error fetching keyframes:', error);
      throw new Error(`Failed to fetch keyframes: ${error.message}`);
    }
  }

  /**
   * Detect topic changes in transcript using Gemini
   * @param {Array} segments - Transcript segments
   * @returns {Array} Array of topic change points with timestamps and confidence
   */
  async detectTopicChanges(segments) {
    try {
      // Group segments into 30-second chunks for analysis
      const chunks = this.groupSegmentsIntoChunks(segments, 30);

      console.log(`Analyzing ${chunks.length} 30-second chunks for topic changes`);

      const topicChanges = [];

      // Analyze chunks in batches to detect topic shifts
      for (let i = 0; i < chunks.length - 1; i++) {
        const currentChunk = chunks[i];
        const nextChunk = chunks[i + 1];

        // Combine text from both chunks
        const currentText = currentChunk.segments.map(s => s.text).join(' ');
        const nextText = nextChunk.segments.map(s => s.text).join(' ');

        // Ask Gemini to detect topic shift
        const prompt = `Analyze these two consecutive transcript segments from a video and determine if there is a significant topic change between them.

Segment 1 (${currentChunk.startTime}s - ${currentChunk.endTime}s):
"${currentText}"

Segment 2 (${nextChunk.startTime}s - ${nextChunk.endTime}s):
"${nextText}"

Respond with ONLY a JSON object in this exact format:
{
  "topicChange": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation"
}`;

        try {
          const response = await geminiService.generateText(prompt);

          // Parse JSON response
          const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const analysis = JSON.parse(cleanedText);

          if (analysis.topicChange && analysis.confidence > 0.5) {
            topicChanges.push({
              timestamp: nextChunk.startTime,
              confidence: analysis.confidence,
              reason: analysis.reason
            });
            console.log(`Topic change detected at ${nextChunk.startTime}s (confidence: ${analysis.confidence})`);
          }

        } catch (parseError) {
          console.error(`Failed to parse topic change analysis for chunk ${i}:`, parseError.message);
          // Continue to next chunk
        }
      }

      return topicChanges;

    } catch (error) {
      console.error('Error detecting topic changes:', error);
      throw new Error(`Failed to detect topic changes: ${error.message}`);
    }
  }

  /**
   * Group transcript segments into time-based chunks
   * @param {Array} segments - Transcript segments
   * @param {number} chunkDuration - Duration of each chunk in seconds
   * @returns {Array} Array of chunks
   */
  groupSegmentsIntoChunks(segments, chunkDuration) {
    const chunks = [];
    let currentChunk = {
      startTime: 0,
      endTime: chunkDuration,
      segments: []
    };

    for (const segment of segments) {
      if (segment.start >= currentChunk.endTime) {
        // Start new chunk
        if (currentChunk.segments.length > 0) {
          chunks.push(currentChunk);
        }
        currentChunk = {
          startTime: currentChunk.endTime,
          endTime: currentChunk.endTime + chunkDuration,
          segments: []
        };
      }
      currentChunk.segments.push(segment);
    }

    // Add last chunk
    if (currentChunk.segments.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Merge visual (keyframe) and topic signals to find section boundaries
   * @param {Array} keyframes - Keyframe objects with timestamps
   * @param {Array} topicChanges - Topic change points
   * @returns {Array} Array of section boundary timestamps
   */
  async mergeSignals(keyframes, topicChanges) {
    const boundaries = new Set([0]); // Always start with 0

    // Add topic changes as boundaries
    topicChanges.forEach(change => {
      boundaries.add(change.timestamp);
    });

    // Add keyframes that are near topic changes (within 10 seconds)
    keyframes.forEach(keyframe => {
      const nearTopicChange = topicChanges.some(change =>
        Math.abs(change.timestamp - keyframe.timestamp) < 10
      );

      if (nearTopicChange) {
        boundaries.add(keyframe.timestamp);
      }
    });

    // Convert to sorted array
    let boundaryArray = Array.from(boundaries).sort((a, b) => a - b);

    // Merge nearby boundaries (within 10 seconds)
    boundaryArray = this.mergeNearbyBoundaries(boundaryArray, 10);

    return boundaryArray;
  }

  /**
   * Merge boundaries that are too close together
   * @param {Array} boundaries - Array of timestamps
   * @param {number} minDistance - Minimum distance in seconds
   * @returns {Array} Merged boundaries
   */
  mergeNearbyBoundaries(boundaries, minDistance) {
    if (boundaries.length <= 1) return boundaries;

    const merged = [boundaries[0]];

    for (let i = 1; i < boundaries.length; i++) {
      const lastBoundary = merged[merged.length - 1];
      const currentBoundary = boundaries[i];

      if (currentBoundary - lastBoundary >= minDistance) {
        merged.push(currentBoundary);
      }
    }

    return merged;
  }

  /**
   * Generate section metadata (title, summary, key points)
   * @param {string} videoId - Video ID
   * @param {Array} boundaries - Section boundary timestamps
   * @param {Array} segments - All transcript segments
   * @returns {Array} Array of section objects
   */
  async generateSectionMetadata(videoId, boundaries, segments) {
    const sections = [];

    for (let i = 0; i < boundaries.length; i++) {
      const startTime = boundaries[i];
      const endTime = i < boundaries.length - 1 ? boundaries[i + 1] : segments[segments.length - 1].end;

      // Get segments for this section
      const sectionSegments = segments.filter(seg =>
        seg.start >= startTime && seg.start < endTime
      );

      const sectionText = sectionSegments.map(s => s.text).join(' ');

      // Generate title for this section
      const title = await this.generateSectionTitle(sectionText);

      // Extract key points (first 3 meaningful sentences)
      const keyPoints = this.extractKeyPoints(sectionText);

      sections.push({
        title,
        startTime: parseFloat(startTime.toFixed(2)),
        endTime: parseFloat(endTime.toFixed(2)),
        summary: sectionText.substring(0, 300) + (sectionText.length > 300 ? '...' : ''),
        keyPoints
      });

      console.log(`Generated section ${i + 1}: "${title}" (${startTime}s - ${endTime}s)`);
    }

    return sections;
  }

  /**
   * Generate a concise title for a section using Gemini
   * @param {string} text - Section transcript text
   * @returns {string} Generated title (3-6 words)
   */
  async generateSectionTitle(text) {
    try {
      // Truncate text if too long
      const truncatedText = text.substring(0, 1000);

      const prompt = `Generate a concise, descriptive title (3-6 words) for this video section based on its transcript. The title should capture the main topic or action.

Transcript:
"${truncatedText}"

Respond with ONLY the title text, no quotes or additional formatting.`;

      const title = await geminiService.generateText(prompt);

      // Clean up the response
      let cleanedTitle = title.trim().replace(/^["']|["']$/g, '');

      // Limit to 255 characters for database
      if (cleanedTitle.length > 255) {
        cleanedTitle = cleanedTitle.substring(0, 252) + '...';
      }

      return cleanedTitle || 'Untitled Section';

    } catch (error) {
      console.error('Error generating section title:', error);
      return 'Untitled Section';
    }
  }

  /**
   * Extract key points from section text
   * @param {string} text - Section text
   * @returns {Array} Array of key points
   */
  extractKeyPoints(text) {
    // Simple extraction: Split into sentences and take first 3 meaningful ones
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  /**
   * Store section in database
   * @param {string} videoId - Video ID
   * @param {Object} section - Section object
   * @param {number} order - Section order (0-indexed)
   */
  async storeSection(videoId, section, order) {
    try {
      await db.query(
        `INSERT INTO sections (video_id, title, start_time, end_time, section_order, summary, key_points, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (video_id, section_order)
         DO UPDATE SET
           title = EXCLUDED.title,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           summary = EXCLUDED.summary,
           key_points = EXCLUDED.key_points,
           generated_at = EXCLUDED.generated_at`,
        [
          videoId,
          section.title,
          section.startTime,
          section.endTime,
          order,
          section.summary,
          JSON.stringify(section.keyPoints)
        ]
      );

      console.log(`Stored section ${order}: ${section.title}`);

    } catch (error) {
      console.error('Error storing section:', error);
      throw new Error(`Failed to store section: ${error.message}`);
    }
  }

  /**
   * Get all sections for a video
   * @param {string} videoId - Video ID
   * @returns {Array} Array of sections
   */
  async getSections(videoId) {
    try {
      const result = await db.query(
        `SELECT id, video_id, title, start_time, end_time, section_order, summary, key_points, generated_at, created_at
         FROM sections
         WHERE video_id = $1
         ORDER BY section_order ASC`,
        [videoId]
      );

      return result.rows.map(row => ({
        id: row.id,
        videoId: row.video_id,
        title: row.title,
        startTime: parseFloat(row.start_time),
        endTime: parseFloat(row.end_time),
        sectionOrder: row.section_order,
        summary: row.summary,
        keyPoints: row.key_points,
        generatedAt: row.generated_at,
        createdAt: row.created_at
      }));

    } catch (error) {
      console.error('Error fetching sections:', error);
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }
  }

  /**
   * Delete all sections for a video
   * @param {string} videoId - Video ID
   */
  async deleteSections(videoId) {
    try {
      await db.query('DELETE FROM sections WHERE video_id = $1', [videoId]);
      console.log(`Deleted all sections for video ${videoId}`);
    } catch (error) {
      console.error('Error deleting sections:', error);
      throw new Error(`Failed to delete sections: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new SectionDetectionService();
