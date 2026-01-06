/**
 * Home Routes
 * API endpoints for home page data
 */

const express = require('express');
const router = express.Router();
const pool = require('../services/db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * GET /api/home/stats
 * Get aggregated stats for the home page
 */
router.get('/stats', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const client = await pool.connect();

    try {
      // Get all stats in parallel
      const [
        videosResult,
        savesResult,
        foldersResult,
        tagsResult,
        totalDurationResult,
        framesResult
      ] = await Promise.all([
        // Total videos
        client.query(
          'SELECT COUNT(*) as count FROM videos WHERE user_id = $1',
          [userId]
        ),
        // Total saves
        client.query(
          'SELECT COUNT(*) as count FROM saves WHERE user_id = $1',
          [userId]
        ),
        // Total folders
        client.query(
          'SELECT COUNT(*) as count FROM folders WHERE user_id = $1',
          [userId]
        ),
        // Total tags
        client.query(
          'SELECT COUNT(*) as count FROM tags WHERE user_id = $1',
          [userId]
        ),
        // Total duration (in seconds)
        client.query(
          'SELECT COALESCE(SUM(duration), 0) as total FROM videos WHERE user_id = $1',
          [userId]
        ),
        // Total frames analyzed
        client.query(
          `SELECT COUNT(*) as count FROM frames f
           JOIN videos v ON f.video_id = v.id
           WHERE v.user_id = $1`,
          [userId]
        )
      ]);

      res.json({
        videos: parseInt(videosResult.rows[0].count),
        saves: parseInt(savesResult.rows[0].count),
        folders: parseInt(foldersResult.rows[0].count),
        tags: parseInt(tagsResult.rows[0].count),
        totalDuration: parseInt(totalDurationResult.rows[0].total),
        framesAnalyzed: parseInt(framesResult.rows[0].count)
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching home stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/home/recent-videos
 * Get recently accessed/analyzed videos
 */
router.get('/recent-videos', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const limit = parseInt(req.query.limit) || 6;

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT
          v.id,
          v.youtube_id,
          v.title,
          v.channel_name,
          v.duration,
          v.thumbnail_url,
          v.analysis_status,
          v.last_accessed_at,
          v.created_at,
          vs.full_summary IS NOT NULL as has_summary,
          (SELECT COUNT(*) FROM frames WHERE video_id = v.id) as frame_count,
          (SELECT COUNT(*) FROM sections WHERE video_id = v.id) as section_count
        FROM videos v
        LEFT JOIN video_summaries vs ON v.id = vs.video_id
        WHERE v.user_id = $1
        ORDER BY v.last_accessed_at DESC NULLS LAST, v.created_at DESC
        LIMIT $2`,
        [userId, limit]
      );

      res.json(result.rows);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching recent videos:', error);
    res.status(500).json({ error: 'Failed to fetch recent videos' });
  }
});

/**
 * GET /api/home/recent-saves
 * Get recent saves/highlights
 */
router.get('/recent-saves', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT
          s.id,
          s.title,
          s.notes,
          s.created_at,
          v.id as video_id,
          v.title as video_title,
          v.thumbnail_url,
          v.youtube_id,
          (SELECT COUNT(*) FROM save_frames WHERE save_id = s.id) as frame_count,
          (SELECT COUNT(*) FROM save_transcripts WHERE save_id = s.id) as transcript_count
        FROM saves s
        JOIN videos v ON s.video_id = v.id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2`,
        [userId, limit]
      );

      res.json(result.rows);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching recent saves:', error);
    res.status(500).json({ error: 'Failed to fetch recent saves' });
  }
});

/**
 * GET /api/home/folders
 * Get user's folders with item counts
 */
router.get('/folders', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT
          f.id,
          f.name,
          f.color,
          f.icon,
          (SELECT COUNT(*) FROM save_folders sf WHERE sf.folder_id = f.id) as save_count
        FROM folders f
        WHERE f.user_id = $1
        ORDER BY f.sort_order ASC, f.name ASC
        LIMIT 8`,
        [userId]
      );

      res.json(result.rows);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

/**
 * GET /api/home/processing
 * Get videos currently being processed
 */
router.get('/processing', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT
          v.id,
          v.youtube_id,
          v.title,
          v.thumbnail_url,
          v.analysis_status,
          aj.progress,
          aj.job_type,
          aj.started_at
        FROM videos v
        LEFT JOIN analysis_jobs aj ON v.id = aj.video_id AND aj.status = 'processing'
        WHERE v.user_id = $1
        AND v.analysis_status IN ('pending', 'processing', 'extracting', 'analyzing')
        ORDER BY v.created_at DESC
        LIMIT 5`,
        [userId]
      );

      res.json(result.rows);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching processing videos:', error);
    res.status(500).json({ error: 'Failed to fetch processing videos' });
  }
});

/**
 * GET /api/home/insights
 * Get recent key takeaways/insights from analyzed videos
 */
router.get('/insights', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT
          vs.id,
          vs.key_takeaways,
          vs.topics,
          v.id as video_id,
          v.title as video_title,
          v.thumbnail_url,
          v.youtube_id,
          vs.updated_at
        FROM video_summaries vs
        JOIN videos v ON vs.video_id = v.id
        WHERE v.user_id = $1
        AND vs.key_takeaways IS NOT NULL
        ORDER BY vs.updated_at DESC
        LIMIT $2`,
        [userId, limit]
      );

      // Flatten insights from multiple videos
      const insights = [];
      result.rows.forEach(row => {
        try {
          const takeaways = typeof row.key_takeaways === 'string'
            ? JSON.parse(row.key_takeaways)
            : row.key_takeaways;

          if (Array.isArray(takeaways)) {
            takeaways.slice(0, 2).forEach(takeaway => {
              insights.push({
                text: takeaway,
                videoId: row.video_id,
                videoTitle: row.video_title,
                thumbnailUrl: row.thumbnail_url,
                youtubeId: row.youtube_id
              });
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });

      res.json(insights.slice(0, limit));

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

module.exports = router;
