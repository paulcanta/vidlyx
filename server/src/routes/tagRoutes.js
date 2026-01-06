/**
 * Tag routes for managing video save tags
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const tagService = require('../services/tagService');

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/tags
 * Create a new tag
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, color } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Validate name length
    if (name.length > 100) {
      return res.status(400).json({ error: 'Tag name must be 100 characters or less' });
    }

    // Create tag
    const tag = await tagService.createTag(req.user.id, {
      name,
      color
    });

    res.status(201).json({
      message: 'Tag created successfully',
      tag
    });
  } catch (error) {
    if (error.message === 'A tag with this name already exists') {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/tags
 * Get all tags for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const tags = await tagService.getAll(req.user.id);

    res.json({
      tags,
      count: tags.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tags/search
 * Search tags by name
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const tags = await tagService.search(req.user.id, q);

    res.json({
      tags,
      count: tags.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tags/:id
 * Get a single tag by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tagId = req.params.id;

    // UUID validation
    if (!uuidRegex.test(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID format' });
    }

    const tag = await tagService.getTagById(tagId, req.user.id);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ tag });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tags/:id
 * Update a tag
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tagId = req.params.id;
    const { name, color } = req.body;

    // UUID validation
    if (!uuidRegex.test(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID format' });
    }

    // Validate name length if provided
    if (name && name.length > 50) {
      return res.status(400).json({ error: 'Tag name must be 50 characters or less' });
    }

    // Update tag
    const tag = await tagService.update(tagId, req.user.id, {
      name,
      color
    });

    res.json({
      message: 'Tag updated successfully',
      tag
    });
  } catch (error) {
    if (error.message === 'Tag not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'A tag with this name already exists') {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/tags/:id
 * Delete a tag
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tagId = req.params.id;

    // UUID validation
    if (!uuidRegex.test(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID format' });
    }

    const deleted = await tagService.deleteTag(tagId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
