const pool = require('./db');
const summaryService = require('./summaryService');
const sectionService = require('./sectionService');

/**
 * Regeneration Service
 * Handles analysis regeneration with usage tracking for future billing
 */
const regenerationService = {
  /**
   * Regenerate all analysis components for a video
   * @param {string} videoId - Video UUID
   * @param {string} userId - User UUID
   * @param {Object} options - Regeneration options
   * @returns {Promise<Object>} - Regeneration result
   */
  async regenerateAnalysis(videoId, userId, options = {}) {
    const { reason = 'manual' } = options;

    // Get current frame count
    const framesResult = await pool.query(
      'SELECT COUNT(*) as count FROM frames WHERE video_id = $1',
      [videoId]
    );
    const frameCount = parseInt(framesResult.rows[0]?.count || 0);

    // Start regeneration tracking
    const regeneration = await pool.query(`
      INSERT INTO analysis_regenerations
      (video_id, user_id, trigger_reason, frames_included, provider, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [videoId, userId, reason, frameCount, 'manual', 'in_progress']);

    const regenerationId = regeneration.rows[0].id;

    try {
      // Regenerate all analysis components
      const results = {
        sections: null,
        summary: null,
        keyPoints: null,
        comprehensiveAnalysis: null
      };

      // 1. Regenerate sections
      try {
        results.sections = await sectionService.detectSections(videoId);
      } catch (err) {
        console.error('Failed to regenerate sections:', err);
      }

      // 2. Regenerate summary
      try {
        results.summary = await summaryService.generateFullSummary(videoId);
      } catch (err) {
        console.error('Failed to regenerate summary:', err);
      }

      // 3. Regenerate key points
      try {
        results.keyPoints = await summaryService.extractKeyPoints(videoId);
      } catch (err) {
        console.error('Failed to regenerate key points:', err);
      }

      // 4. Regenerate comprehensive analysis
      try {
        results.comprehensiveAnalysis = await summaryService.generateComprehensiveAnalysis(videoId);
      } catch (err) {
        console.error('Failed to regenerate comprehensive analysis:', err);
      }

      // Update regeneration status to completed
      await pool.query(`
        UPDATE analysis_regenerations
        SET status = 'completed',
            tokens_used = $1,
            cost_credits = $2
        WHERE id = $3
      `, [0, 0, regenerationId]); // Tokens and credits are 0 for now (manual mode)

      // Update usage tracking
      await this.updateUsageTracking(userId);

      return {
        regenerationId,
        status: 'completed',
        frameCount,
        results
      };
    } catch (err) {
      // Mark regeneration as failed
      await pool.query(`
        UPDATE analysis_regenerations
        SET status = 'failed',
            error_message = $1
        WHERE id = $2
      `, [err.message, regenerationId]);

      throw err;
    }
  },

  /**
   * Update usage tracking for a user
   * @param {string} userId - User UUID
   */
  async updateUsageTracking(userId) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get regeneration count for this period
    const countResult = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(tokens_used), 0) as tokens
      FROM analysis_regenerations
      WHERE user_id = $1
        AND triggered_at >= $2
        AND triggered_at <= $3
    `, [userId, periodStart, periodEnd]);

    const { count, tokens } = countResult.rows[0];

    // Upsert usage tracking
    await pool.query(`
      INSERT INTO usage_tracking
      (user_id, period_start, period_end, total_regenerations, total_tokens, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, period_start, period_end)
      DO UPDATE SET
        total_regenerations = $4,
        total_tokens = $5,
        updated_at = NOW()
    `, [userId, periodStart, periodEnd, count, tokens]);
  },

  /**
   * Get regeneration history for a video
   * @param {string} videoId - Video UUID
   * @param {number} limit - Max results
   * @returns {Promise<Array>} - Regeneration history
   */
  async getRegenerationHistory(videoId, limit = 10) {
    const result = await pool.query(`
      SELECT id, triggered_at, trigger_reason, frames_included,
             tokens_used, provider, cost_credits, status
      FROM analysis_regenerations
      WHERE video_id = $1
      ORDER BY triggered_at DESC
      LIMIT $2
    `, [videoId, limit]);

    return result.rows;
  },

  /**
   * Get usage stats for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} - Usage statistics
   */
  async getUsageStats(userId) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Current period usage
    const currentResult = await pool.query(`
      SELECT
        COALESCE(total_regenerations, 0) as regenerations,
        COALESCE(total_tokens, 0) as tokens,
        COALESCE(total_credits, 0) as credits
      FROM usage_tracking
      WHERE user_id = $1
        AND period_start = $2
        AND period_end = $3
    `, [userId, periodStart, periodEnd]);

    // Lifetime usage
    const lifetimeResult = await pool.query(`
      SELECT
        COUNT(*) as total_regenerations,
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(cost_credits), 0) as total_credits
      FROM analysis_regenerations
      WHERE user_id = $1
    `, [userId]);

    return {
      currentPeriod: {
        start: periodStart,
        end: periodEnd,
        regenerations: parseInt(currentResult.rows[0]?.regenerations || 0),
        tokens: parseInt(currentResult.rows[0]?.tokens || 0),
        credits: parseFloat(currentResult.rows[0]?.credits || 0)
      },
      lifetime: {
        regenerations: parseInt(lifetimeResult.rows[0]?.total_regenerations || 0),
        tokens: parseInt(lifetimeResult.rows[0]?.total_tokens || 0),
        credits: parseFloat(lifetimeResult.rows[0]?.total_credits || 0)
      }
    };
  },

  /**
   * Check if regeneration should be triggered (e.g., new frames added)
   * @param {string} videoId - Video UUID
   * @returns {Promise<Object>} - Regeneration recommendation
   */
  async checkRegenerationNeeded(videoId) {
    // Get last regeneration
    const lastRegen = await pool.query(`
      SELECT triggered_at, frames_included
      FROM analysis_regenerations
      WHERE video_id = $1 AND status = 'completed'
      ORDER BY triggered_at DESC
      LIMIT 1
    `, [videoId]);

    // Get current frame count
    const framesResult = await pool.query(
      'SELECT COUNT(*) as count FROM frames WHERE video_id = $1',
      [videoId]
    );

    const currentFrameCount = parseInt(framesResult.rows[0]?.count || 0);
    const lastFrameCount = lastRegen.rows[0]?.frames_included || 0;
    const newFrames = currentFrameCount - lastFrameCount;

    return {
      shouldRegenerate: newFrames > 0,
      reason: newFrames > 0 ? 'new_frames' : null,
      newFrameCount: newFrames,
      totalFrameCount: currentFrameCount,
      lastRegenerationAt: lastRegen.rows[0]?.triggered_at || null
    };
  }
};

module.exports = regenerationService;
