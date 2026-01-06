/**
 * Vision Analysis Service
 * Manages vision analysis operations with usage tracking and rate limiting
 */

const pool = require('./db');
const geminiService = require('./geminiService');
const fs = require('fs').promises;

class VisionAnalysisService {
  constructor() {
    this.dailyLimit = 1500; // Gemini free tier daily limit
    this.usageTracking = new Map(); // In-memory usage tracking
  }

  /**
   * Get current date string for tracking (YYYY-MM-DD)
   */
  getCurrentDateKey() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get usage stats for current day
   */
  async getUsageStats() {
    const dateKey = this.getCurrentDateKey();

    // Get from in-memory tracking
    const todayUsage = this.usageTracking.get(dateKey) || 0;

    // Get from database (more persistent)
    try {
      const query = `
        SELECT COUNT(*) as analysis_count
        FROM frames
        WHERE raw_analysis IS NOT NULL
        AND DATE(created_at) = CURRENT_DATE
      `;
      const result = await pool.query(query);
      const dbCount = parseInt(result.rows[0].analysis_count, 10);

      // Use the higher of the two counts
      const actualCount = Math.max(todayUsage, dbCount);

      return {
        date: dateKey,
        callsToday: actualCount,
        remainingToday: Math.max(0, this.dailyLimit - actualCount),
        dailyLimit: this.dailyLimit,
        percentUsed: Math.round((actualCount / this.dailyLimit) * 100)
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        date: dateKey,
        callsToday: todayUsage,
        remainingToday: Math.max(0, this.dailyLimit - todayUsage),
        dailyLimit: this.dailyLimit,
        percentUsed: Math.round((todayUsage / this.dailyLimit) * 100)
      };
    }
  }

  /**
   * Increment usage counter
   */
  incrementUsage() {
    const dateKey = this.getCurrentDateKey();
    const current = this.usageTracking.get(dateKey) || 0;
    this.usageTracking.set(dateKey, current + 1);

    // Clean up old dates
    const today = new Date();
    for (const [key] of this.usageTracking) {
      const keyDate = new Date(key);
      const daysDiff = Math.floor((today - keyDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 7) {
        this.usageTracking.delete(key);
      }
    }
  }

  /**
   * Check if we're within daily limits
   */
  async checkDailyLimit() {
    const stats = await this.getUsageStats();
    if (stats.callsToday >= this.dailyLimit) {
      throw new Error(`Daily Gemini API limit reached (${this.dailyLimit} calls per day)`);
    }
    return stats;
  }

  /**
   * Get frames for a video
   */
  async getVideoFrames(videoId, options = {}) {
    const {
      limit = 100,
      offset = 0,
      onlyWithoutAnalysis = false
    } = options;

    let query = `
      SELECT id, video_id, timestamp_seconds, frame_path,
             scene_description, visual_elements, content_type, raw_analysis
      FROM frames
      WHERE video_id = $1
    `;

    const params = [videoId];

    if (onlyWithoutAnalysis) {
      query += ` AND raw_analysis IS NULL`;
    }

    query += ` ORDER BY timestamp_seconds ASC LIMIT $2 OFFSET $3`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Sample frames for analysis (every 3rd frame, max 40)
   */
  async sampleFramesForAnalysis(videoId, options = {}) {
    const {
      samplingRate = 3,  // Analyze every 3rd frame
      maxFrames = 40     // Maximum frames to analyze
    } = options;

    // Get all frames without analysis
    const allFrames = await this.getVideoFrames(videoId, {
      limit: 1000,
      onlyWithoutAnalysis: true
    });

    if (allFrames.length === 0) {
      return [];
    }

    // Sample frames
    const sampledFrames = [];
    for (let i = 0; i < allFrames.length && sampledFrames.length < maxFrames; i += samplingRate) {
      sampledFrames.push(allFrames[i]);
    }

    return sampledFrames;
  }

  /**
   * Update frame with vision analysis results
   */
  async updateFrameAnalysis(frameId, analysis) {
    const query = `
      UPDATE frames
      SET
        scene_description = $1,
        visual_elements = $2,
        on_screen_text = COALESCE(on_screen_text, '') || ' ' || $3,
        content_type = $4,
        raw_analysis = $5
      WHERE id = $6
      RETURNING *
    `;

    const params = [
      analysis.scene_description,
      JSON.stringify(analysis.visual_elements),
      analysis.on_screen_text || '',
      analysis.content_type,
      JSON.stringify(analysis.raw_analysis || analysis),
      frameId
    ];

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Analyze video frames with sampling and rate limiting
   */
  async analyzeVideoFrames(videoId, options = {}) {
    const {
      samplingRate = 3,
      maxFrames = 40,
      progressCallback = null
    } = options;

    try {
      // Check daily limit
      await this.checkDailyLimit();

      // Sample frames
      const frames = await this.sampleFramesForAnalysis(videoId, {
        samplingRate,
        maxFrames
      });

      if (frames.length === 0) {
        return {
          success: true,
          message: 'No frames to analyze (all frames already analyzed or no frames found)',
          analyzed: 0,
          failed: 0,
          skipped: 0
        };
      }

      console.log(`Analyzing ${frames.length} frames for video ${videoId}...`);

      // Check if we'll exceed daily limit
      const stats = await this.getUsageStats();
      if (stats.remainingToday < frames.length) {
        console.warn(`Warning: Analyzing ${frames.length} frames but only ${stats.remainingToday} calls remaining today`);
      }

      const results = {
        analyzed: 0,
        failed: 0,
        skipped: 0,
        frames: []
      };

      // Analyze frames one by one with rate limiting
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];

        try {
          // Check if file exists
          try {
            await fs.access(frame.frame_path);
          } catch (error) {
            console.error(`Frame file not found: ${frame.frame_path}`);
            results.skipped++;
            continue;
          }

          // Check daily limit before each call
          const currentStats = await this.getUsageStats();
          if (currentStats.callsToday >= this.dailyLimit) {
            console.warn('Daily limit reached during batch processing');
            break;
          }

          // Analyze frame
          const analysis = await geminiService.analyzeFrame(frame.frame_path);

          // Update frame in database
          await this.updateFrameAnalysis(frame.id, analysis);

          // Increment usage counter
          this.incrementUsage();

          results.analyzed++;
          results.frames.push({
            frameId: frame.id,
            timestamp: frame.timestamp_seconds,
            success: true
          });

          // Progress callback
          if (progressCallback) {
            progressCallback({
              current: i + 1,
              total: frames.length,
              percentage: Math.round(((i + 1) / frames.length) * 100),
              analyzed: results.analyzed,
              failed: results.failed,
              skipped: results.skipped
            });
          }

        } catch (error) {
          console.error(`Failed to analyze frame ${frame.id}:`, error.message);
          results.failed++;
          results.frames.push({
            frameId: frame.id,
            timestamp: frame.timestamp_seconds,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Analyzed ${results.analyzed} frames, ${results.failed} failed, ${results.skipped} skipped`,
        ...results
      };

    } catch (error) {
      console.error('Vision analysis error:', error);
      throw error;
    }
  }

  /**
   * Get frames with vision analysis
   */
  async getFramesWithAnalysis(videoId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      onlyWithAnalysis = false
    } = options;

    let query = `
      SELECT
        id, video_id, timestamp_seconds, frame_path, thumbnail_path,
        scene_description, visual_elements, on_screen_text, content_type,
        is_keyframe, created_at, raw_analysis
      FROM frames
      WHERE video_id = $1
    `;

    const params = [videoId];

    if (onlyWithAnalysis) {
      query += ` AND raw_analysis IS NOT NULL`;
    }

    query += ` ORDER BY timestamp_seconds ASC LIMIT $2 OFFSET $3`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM frames WHERE video_id = $1`;
    if (onlyWithAnalysis) {
      countQuery += ` AND raw_analysis IS NOT NULL`;
    }

    const countResult = await pool.query(countQuery, [videoId]);
    const total = parseInt(countResult.rows[0].total, 10);

    return {
      frames: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Get analysis summary for a video
   */
  async getVideoAnalysisSummary(videoId) {
    const query = `
      SELECT
        COUNT(*) as total_frames,
        COUNT(CASE WHEN raw_analysis IS NOT NULL THEN 1 END) as analyzed_frames,
        COUNT(CASE WHEN content_type IS NOT NULL THEN 1 END) as categorized_frames,
        array_agg(DISTINCT content_type) FILTER (WHERE content_type IS NOT NULL) as content_types
      FROM frames
      WHERE video_id = $1
    `;

    const result = await pool.query(query, [videoId]);
    const stats = result.rows[0];

    return {
      videoId,
      totalFrames: parseInt(stats.total_frames, 10),
      analyzedFrames: parseInt(stats.analyzed_frames, 10),
      categorizedFrames: parseInt(stats.categorized_frames, 10),
      contentTypes: stats.content_types || [],
      analysisComplete: parseInt(stats.total_frames, 10) === parseInt(stats.analyzed_frames, 10),
      percentageAnalyzed: stats.total_frames > 0
        ? Math.round((parseInt(stats.analyzed_frames, 10) / parseInt(stats.total_frames, 10)) * 100)
        : 0
    };
  }
}

// Export singleton instance
module.exports = new VisionAnalysisService();
