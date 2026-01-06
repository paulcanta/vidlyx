/**
 * Search routes for full-text search across the application
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const searchService = require('../services/searchService');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/search
 * Global search across videos, saves, transcripts, and frames
 *
 * Query Parameters:
 * - q: Search query string (required)
 * - types: Comma-separated list of content types to search (optional)
 *          Valid values: videos, saves, transcripts, frames
 *          Default: all types
 * - limit: Maximum results per type (optional, default: 10)
 * - offset: Offset for pagination (optional, default: 0)
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, types, limit = 10, offset = 0 } = req.query;

    // Validate query parameter
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    // Validate query length
    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query too short',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Parse types parameter
    let searchTypes = ['videos', 'saves', 'transcripts', 'frames'];
    if (types) {
      const requestedTypes = types.split(',').map(t => t.trim().toLowerCase());
      const validTypes = ['videos', 'saves', 'transcripts', 'frames'];
      searchTypes = requestedTypes.filter(t => validTypes.includes(t));

      if (searchTypes.length === 0) {
        return res.status(400).json({
          error: 'Invalid search types',
          message: 'Valid types are: videos, saves, transcripts, frames'
        });
      }
    }

    // Parse limit and offset
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    // Execute search
    const results = await searchService.search(req.user.id, q.trim(), {
      types: searchTypes,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/videos
 * Search only videos
 */
router.get('/videos', async (req, res, next) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const results = await searchService.searchVideos(req.user.id, q.trim(), {
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      success: true,
      query: q,
      ...results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/saves
 * Search only saves
 */
router.get('/saves', async (req, res, next) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const results = await searchService.searchSaves(req.user.id, q.trim(), {
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      success: true,
      query: q,
      ...results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/transcripts
 * Search only transcripts
 */
router.get('/transcripts', async (req, res, next) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const results = await searchService.searchTranscripts(req.user.id, q.trim(), {
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      success: true,
      query: q,
      ...results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/frames
 * Search only frames
 */
router.get('/frames', async (req, res, next) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const results = await searchService.searchFrames(req.user.id, q.trim(), {
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      success: true,
      query: q,
      ...results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/suggestions
 * Get autocomplete suggestions for search
 *
 * Query Parameters:
 * - q: Partial search query (required, min 2 characters)
 * - limit: Maximum number of suggestions (optional, default: 5, max: 10)
 */
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    // Validate query parameter
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    // Require minimum 2 characters for suggestions
    if (q.trim().length < 2) {
      return res.json({
        success: true,
        query: q,
        suggestions: []
      });
    }

    // Parse and validate limit
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);

    // Get suggestions
    const suggestions = await searchService.getSuggestions(req.user.id, q.trim(), {
      limit: parsedLimit
    });

    res.json({
      success: true,
      query: q,
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
