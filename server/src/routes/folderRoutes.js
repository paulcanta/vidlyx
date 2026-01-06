/**
 * Folder routes for managing video save folders
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const folderService = require('../services/folderService');

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/folders
 * Create a new folder
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, color, icon, sort_order } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Validate name length
    if (name.length > 255) {
      return res.status(400).json({ error: 'Folder name must be 255 characters or less' });
    }

    // Create folder
    const folder = await folderService.createFolder(req.user.id, {
      name,
      color,
      icon,
      sort_order
    });

    res.status(201).json({
      message: 'Folder created successfully',
      folder
    });
  } catch (error) {
    if (error.message === 'A folder with this name already exists') {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/folders
 * Get all folders for the authenticated user with save counts
 */
router.get('/', async (req, res, next) => {
  try {
    const folders = await folderService.getFolders(req.user.id);

    res.json({
      folders,
      count: folders.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/folders/:id
 * Get a single folder by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const folderId = req.params.id;

    // UUID validation
    if (!uuidRegex.test(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID format' });
    }

    const folder = await folderService.getFolderById(folderId, req.user.id);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ folder });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/folders/:id
 * Update a folder
 */
router.put('/:id', async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const { name, color, icon, sort_order } = req.body;

    // UUID validation
    if (!uuidRegex.test(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID format' });
    }

    // Validate name length if provided
    if (name && name.length > 255) {
      return res.status(400).json({ error: 'Folder name must be 255 characters or less' });
    }

    // Update folder
    const folder = await folderService.updateFolder(folderId, req.user.id, {
      name,
      color,
      icon,
      sort_order
    });

    res.json({
      message: 'Folder updated successfully',
      folder
    });
  } catch (error) {
    if (error.message === 'Folder not found or access denied') {
      return res.status(404).json({ error: 'Folder not found' });
    }
    if (error.message === 'A folder with this name already exists') {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/folders/:id
 * Delete a folder (saves remain, just unlinked)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const folderId = req.params.id;

    // UUID validation
    if (!uuidRegex.test(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID format' });
    }

    const deleted = await folderService.deleteFolder(folderId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({
      message: 'Folder deleted successfully',
      note: 'Saves in this folder remain in your library'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/folders/:id/saves
 * Get all saves in a specific folder
 */
router.get('/:id/saves', async (req, res, next) => {
  try {
    const folderId = req.params.id;

    // UUID validation
    if (!uuidRegex.test(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID format' });
    }

    // Verify folder exists and belongs to user
    const folder = await folderService.getFolderById(folderId, req.user.id);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Get saves in this folder using the save service
    const saveService = require('../services/saveService');
    const {
      sort = 'created_at',
      order = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const result = await saveService.getSaves(req.user.id, {
      folder: folderId,
      sortBy: sort,
      sortOrder: order,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      folder,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/folders/uncategorized/saves
 * Get all saves that are not in any folder
 */
router.get('/uncategorized/saves', async (req, res, next) => {
  try {
    const saveService = require('../services/saveService');
    const {
      sort = 'created_at',
      order = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const result = await saveService.getSaves(req.user.id, {
      folder: 'uncategorized',
      sortBy: sort,
      sortOrder: order,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
