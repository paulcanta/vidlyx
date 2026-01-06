/**
 * Save routes for managing user saves
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const saveService = require('../services/saveService');
const videoService = require('../services/videoService');

// All routes require authentication
router.use(requireAuth);

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/saves
 * Create a new save
 *
 * Body:
 * {
 *   videoId: string (required),
 *   title: string (optional),
 *   notes: string (optional),
 *   frames: string[] (optional),
 *   transcriptSelections: Array<{start: number, end: number, text: string}> (optional),
 *   summaryExcerpts: Array<{sectionId: string, text: string}> (optional),
 *   folders: string[] (optional),
 *   tags: string[] (optional)
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { videoId, title, notes, frames, transcriptSelections, summaryExcerpts, folders, tags } = req.body;

    // Validate required fields
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Validate UUID
    if (!uuidRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Verify video exists and belongs to user
    const video = await videoService.findVideoById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this video' });
    }

    // Validate frame IDs if provided
    if (frames && frames.length > 0) {
      for (const frameId of frames) {
        if (!uuidRegex.test(frameId)) {
          return res.status(400).json({ error: `Invalid frame ID: ${frameId}` });
        }
      }
    }

    // Validate folder IDs if provided
    if (folders && folders.length > 0) {
      for (const folderId of folders) {
        if (!uuidRegex.test(folderId)) {
          return res.status(400).json({ error: `Invalid folder ID: ${folderId}` });
        }
      }
    }

    // Validate tag IDs if provided
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        if (!uuidRegex.test(tagId)) {
          return res.status(400).json({ error: `Invalid tag ID: ${tagId}` });
        }
      }
    }

    // Validate transcript selections if provided
    if (transcriptSelections && transcriptSelections.length > 0) {
      for (const selection of transcriptSelections) {
        if (typeof selection.start !== 'number' || typeof selection.end !== 'number') {
          return res.status(400).json({ error: 'Invalid transcript selection: start and end must be numbers' });
        }
        if (selection.start < 0 || selection.end < 0 || selection.start >= selection.end) {
          return res.status(400).json({ error: 'Invalid transcript selection: invalid time range' });
        }
      }
    }

    // Create save
    const save = await saveService.createSave(req.user.id, {
      videoId,
      title,
      notes,
      frames: frames || [],
      transcriptSelections: transcriptSelections || [],
      summaryExcerpts: summaryExcerpts || [],
      folders: folders || [],
      tags: tags || []
    });

    res.status(201).json({
      message: 'Save created successfully',
      save
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/saves
 * Get all saves with optional filters
 *
 * Query params:
 * - folder: folder ID or 'uncategorized'
 * - video: video ID
 * - tags: comma-separated tag IDs
 * - type: content type filter (frames, transcripts, summaries)
 * - q: search query
 * - sort: sort field (created_at, updated_at, title)
 * - order: sort order (asc, desc)
 * - limit: results per page (default: 20)
 * - offset: pagination offset (default: 0)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      folder,
      video,
      tags,
      type,
      q,
      sort = 'created_at',
      order = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    // Validate video ID if provided
    if (video && !uuidRegex.test(video)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Validate folder ID if provided
    if (folder && folder !== 'uncategorized' && !uuidRegex.test(folder)) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }

    // Parse tags if provided
    let tagIds = null;
    if (tags) {
      tagIds = tags.split(',').map(t => t.trim());
      for (const tagId of tagIds) {
        if (!uuidRegex.test(tagId)) {
          return res.status(400).json({ error: `Invalid tag ID: ${tagId}` });
        }
      }
    }

    // Validate content type if provided
    if (type && !['frames', 'transcripts', 'summaries'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type. Must be: frames, transcripts, or summaries' });
    }

    // Validate limit and offset
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    // Get saves
    const result = await saveService.getSaves(req.user.id, {
      folder,
      video,
      tags: tagIds,
      contentType: type,
      searchQuery: q,
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

/**
 * GET /api/saves/:id
 * Get a single save by ID with all related data
 */
router.get('/:id', async (req, res, next) => {
  try {
    const saveId = req.params.id;

    // Validate UUID
    if (!uuidRegex.test(saveId)) {
      return res.status(400).json({ error: 'Invalid save ID' });
    }

    // Get save
    const save = await saveService.getSaveById(saveId, req.user.id);

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({ save });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/saves/:id
 * Update a save
 *
 * Body:
 * {
 *   title: string (optional),
 *   notes: string (optional),
 *   folders: string[] (optional),
 *   tags: string[] (optional)
 * }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const saveId = req.params.id;
    const { title, notes, folders, tags } = req.body;

    // Validate UUID
    if (!uuidRegex.test(saveId)) {
      return res.status(400).json({ error: 'Invalid save ID' });
    }

    // Validate folder IDs if provided
    if (folders && folders.length > 0) {
      for (const folderId of folders) {
        if (!uuidRegex.test(folderId)) {
          return res.status(400).json({ error: `Invalid folder ID: ${folderId}` });
        }
      }
    }

    // Validate tag IDs if provided
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        if (!uuidRegex.test(tagId)) {
          return res.status(400).json({ error: `Invalid tag ID: ${tagId}` });
        }
      }
    }

    // Update save
    const save = await saveService.updateSave(saveId, req.user.id, {
      title,
      notes,
      folders,
      tags
    });

    res.json({
      message: 'Save updated successfully',
      save
    });
  } catch (error) {
    if (error.message === 'Save not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/saves/:id
 * Delete a save
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const saveId = req.params.id;

    // Validate UUID
    if (!uuidRegex.test(saveId)) {
      return res.status(400).json({ error: 'Invalid save ID' });
    }

    // Delete save
    const deleted = await saveService.deleteSave(saveId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({
      message: 'Save deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/saves/:id/tags
 * Add tags to a save
 *
 * Body:
 * {
 *   tagIds: string[] (required)
 * }
 */
router.post('/:id/tags', async (req, res, next) => {
  try {
    const saveId = req.params.id;
    const { tagIds } = req.body;

    // Validate UUID
    if (!uuidRegex.test(saveId)) {
      return res.status(400).json({ error: 'Invalid save ID' });
    }

    // Validate tagIds
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'tagIds array is required' });
    }

    // Validate each tag ID
    for (const tagId of tagIds) {
      if (!uuidRegex.test(tagId)) {
        return res.status(400).json({ error: `Invalid tag ID: ${tagId}` });
      }
    }

    // Add tags to save
    const save = await saveService.addTags(saveId, req.user.id, tagIds);

    res.json({
      message: 'Tags added successfully',
      save
    });
  } catch (error) {
    if (error.message === 'Save not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/saves/:id/tags/:tagId
 * Remove a tag from a save
 */
router.delete('/:id/tags/:tagId', async (req, res, next) => {
  try {
    const { id: saveId, tagId } = req.params;

    // Validate UUIDs
    if (!uuidRegex.test(saveId)) {
      return res.status(400).json({ error: 'Invalid save ID' });
    }

    if (!uuidRegex.test(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID' });
    }

    // Remove tag from save
    const save = await saveService.removeTag(saveId, req.user.id, tagId);

    res.json({
      message: 'Tag removed successfully',
      save
    });
  } catch (error) {
    if (error.message === 'Save not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * PUT /api/saves/:id/tags
 * Set tags for a save (replace all existing tags)
 *
 * Body:
 * {
 *   tagIds: string[] (required)
 * }
 */
router.put('/:id/tags', async (req, res, next) => {
  try {
    const saveId = req.params.id;
    const { tagIds } = req.body;

    // Validate UUID
    if (!uuidRegex.test(saveId)) {
      return res.status(400).json({ error: 'Invalid save ID' });
    }

    // Validate tagIds
    if (!tagIds || !Array.isArray(tagIds)) {
      return res.status(400).json({ error: 'tagIds array is required' });
    }

    // Validate each tag ID
    for (const tagId of tagIds) {
      if (!uuidRegex.test(tagId)) {
        return res.status(400).json({ error: `Invalid tag ID: ${tagId}` });
      }
    }

    // Set tags for save
    const save = await saveService.setTags(saveId, req.user.id, tagIds);

    res.json({
      message: 'Tags updated successfully',
      save
    });
  } catch (error) {
    if (error.message === 'Save not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/saves/bulk
 * Perform bulk operations on saves
 *
 * Body:
 * {
 *   saveIds: string[] (required),
 *   action: string (required) - 'addToFolders', 'removeFromFolder', 'addTags', 'delete',
 *   data: object (required for some actions)
 *     - For addToFolders: { folderIds: string[] }
 *     - For removeFromFolder: { folderId: string }
 *     - For addTags: { tagIds: string[] }
 * }
 */
router.post('/bulk', async (req, res, next) => {
  try {
    const { saveIds, action, data } = req.body;

    // Validate required fields
    if (!saveIds || !Array.isArray(saveIds) || saveIds.length === 0) {
      return res.status(400).json({ error: 'Save IDs array is required' });
    }

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Validate save IDs
    for (const saveId of saveIds) {
      if (!uuidRegex.test(saveId)) {
        return res.status(400).json({ error: `Invalid save ID: ${saveId}` });
      }
    }

    // Validate action-specific data
    const validActions = ['addToFolders', 'removeFromFolder', 'addTags', 'delete'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
    }

    // Validate action data
    if (action === 'addToFolders') {
      if (!data || !data.folderIds || !Array.isArray(data.folderIds) || data.folderIds.length === 0) {
        return res.status(400).json({ error: 'folderIds array is required for addToFolders action' });
      }
      for (const folderId of data.folderIds) {
        if (!uuidRegex.test(folderId)) {
          return res.status(400).json({ error: `Invalid folder ID: ${folderId}` });
        }
      }
    }

    if (action === 'removeFromFolder') {
      if (!data || !data.folderId) {
        return res.status(400).json({ error: 'folderId is required for removeFromFolder action' });
      }
      if (!uuidRegex.test(data.folderId)) {
        return res.status(400).json({ error: 'Invalid folder ID' });
      }
    }

    if (action === 'addTags') {
      if (!data || !data.tagIds || !Array.isArray(data.tagIds) || data.tagIds.length === 0) {
        return res.status(400).json({ error: 'tagIds array is required for addTags action' });
      }
      for (const tagId of data.tagIds) {
        if (!uuidRegex.test(tagId)) {
          return res.status(400).json({ error: `Invalid tag ID: ${tagId}` });
        }
      }
    }

    // Perform bulk operation
    const result = await saveService.bulkUpdateSaves(req.user.id, saveIds, action, data || {});

    res.json({
      message: `Bulk ${action} operation completed successfully`,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
