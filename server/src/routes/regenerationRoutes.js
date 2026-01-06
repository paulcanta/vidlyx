const express = require('express');
const router = express.Router();
const regenerationService = require('../services/regenerationService');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * POST /api/videos/:id/regenerate
 * Regenerate all analysis for a video
 */
router.post('/videos/:id/regenerate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'manual' } = req.body;
    const userId = req.session.userId;

    const result = await regenerationService.regenerateAnalysis(id, userId, { reason });

    res.json({
      message: 'Analysis regenerated successfully',
      ...result
    });
  } catch (err) {
    console.error('Error regenerating analysis:', err);
    res.status(500).json({
      error: 'Failed to regenerate analysis',
      message: err.message
    });
  }
});

/**
 * GET /api/videos/:id/regeneration-history
 * Get regeneration history for a video
 */
router.get('/videos/:id/regeneration-history', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const history = await regenerationService.getRegenerationHistory(id, parseInt(limit));

    res.json({ history });
  } catch (err) {
    console.error('Error fetching regeneration history:', err);
    res.status(500).json({
      error: 'Failed to fetch regeneration history',
      message: err.message
    });
  }
});

/**
 * GET /api/videos/:id/regeneration-check
 * Check if regeneration is recommended
 */
router.get('/videos/:id/regeneration-check', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await regenerationService.checkRegenerationNeeded(id);

    res.json(result);
  } catch (err) {
    console.error('Error checking regeneration status:', err);
    res.status(500).json({
      error: 'Failed to check regeneration status',
      message: err.message
    });
  }
});

/**
 * GET /api/usage/stats
 * Get usage statistics for current user
 */
router.get('/usage/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const stats = await regenerationService.getUsageStats(userId);

    res.json(stats);
  } catch (err) {
    console.error('Error fetching usage stats:', err);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: err.message
    });
  }
});

module.exports = router;
