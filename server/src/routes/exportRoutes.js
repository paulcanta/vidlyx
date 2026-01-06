/**
 * Export routes for saves and transcripts
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const exportService = require('../services/exportService');

/**
 * GET /api/export/saves/:id
 * Export a save in specified format
 * Query params:
 *   - format: json, markdown, txt (default: json)
 */
router.get('/saves/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user.id;

    const exportData = await exportService.exportSave(id, userId, format);

    // Set headers
    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);

    // Send content based on type
    if (exportData.contentType === 'application/json') {
      res.json(exportData.content);
    } else {
      res.send(exportData.content);
    }
  } catch (error) {
    if (error.message === 'Save not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/export/videos/:id/transcript
 * Export a video transcript in specified format
 * Query params:
 *   - format: txt, srt, vtt (default: txt)
 */
router.get('/videos/:id/transcript', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'txt' } = req.query;
    const userId = req.user.id;

    const exportData = await exportService.exportTranscript(id, userId, format);

    // Set headers
    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);

    // Send content
    res.send(exportData.content);
  } catch (error) {
    if (error.message === 'Video not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No transcript found for this video') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Transcript does not have timestamped segments') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

module.exports = router;
