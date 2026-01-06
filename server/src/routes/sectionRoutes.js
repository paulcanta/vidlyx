/**
 * Section routes for direct section management
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const sectionService = require('../services/sectionService');
const videoService = require('../services/videoService');

// All routes require authentication
router.use(requireAuth);

/**
 * PUT /api/sections/:id
 * Update a section directly (for direct section editing)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const sectionId = req.params.id;
    const { title, summary, key_points } = req.body;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sectionId)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    // Get section
    const section = await sectionService.getSectionById(sectionId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Verify video belongs to user
    const video = await videoService.findVideoById(section.video_id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update section
    const updatedSection = await sectionService.updateSection(sectionId, {
      title,
      summary,
      key_points
    });

    res.json({
      message: 'Section updated successfully',
      section: updatedSection
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sections/:id
 * Get a section by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const sectionId = req.params.id;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sectionId)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    // Get section
    const section = await sectionService.getSectionById(sectionId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Verify video belongs to user
    const video = await videoService.findVideoById(section.video_id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ section });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
