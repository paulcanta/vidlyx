# Task 6 - Subtask 2: Save Database Operations

## Objective
Implement complete CRUD operations for saves with proper querying and filtering.

## Prerequisites
- Task 6 - Subtask 1 completed (Basic save API)

## Instructions

### 1. Complete Save Service Functions

```javascript
async function getSaves(userId, options = {}) {
  const {
    folderId,
    videoId,
    tags,
    contentType,
    searchQuery,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 20,
    offset = 0
  } = options;

  let query = `
    SELECT
      s.*,
      v.title as video_title,
      v.thumbnail_url,
      v.youtube_id,
      (SELECT COUNT(*) FROM save_frames WHERE save_id = s.id) as frame_count,
      (SELECT COUNT(*) FROM save_transcripts WHERE save_id = s.id) as transcript_count
    FROM saves s
    LEFT JOIN videos v ON s.video_id = v.id
    WHERE s.user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  // Filter by folder
  if (folderId) {
    if (folderId === 'uncategorized') {
      query += ` AND NOT EXISTS (SELECT 1 FROM save_folders WHERE save_id = s.id)`;
    } else {
      query += ` AND EXISTS (SELECT 1 FROM save_folders WHERE save_id = s.id AND folder_id = $${paramIndex})`;
      params.push(folderId);
      paramIndex++;
    }
  }

  // Filter by video
  if (videoId) {
    query += ` AND s.video_id = $${paramIndex}`;
    params.push(videoId);
    paramIndex++;
  }

  // Filter by tags
  if (tags?.length > 0) {
    query += ` AND EXISTS (
      SELECT 1 FROM save_tags
      WHERE save_id = s.id AND tag_id = ANY($${paramIndex})
    )`;
    params.push(tags);
    paramIndex++;
  }

  // Filter by content type
  if (contentType === 'frames') {
    query += ` AND EXISTS (SELECT 1 FROM save_frames WHERE save_id = s.id)`;
  } else if (contentType === 'text') {
    query += ` AND EXISTS (SELECT 1 FROM save_transcripts WHERE save_id = s.id)`;
  }

  // Search
  if (searchQuery) {
    query += ` AND (
      s.title ILIKE $${paramIndex}
      OR s.notes ILIKE $${paramIndex}
      OR EXISTS (
        SELECT 1 FROM save_transcripts
        WHERE save_id = s.id AND text ILIKE $${paramIndex}
      )
    )`;
    params.push(`%${searchQuery}%`);
    paramIndex++;
  }

  // Sort
  const validSorts = ['created_at', 'updated_at', 'title'];
  const sortColumn = validSorts.includes(sortBy) ? sortBy : 'created_at';
  query += ` ORDER BY s.${sortColumn} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;

  // Pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Get total count for pagination
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM')
    .replace(/ORDER BY[\s\S]*$/, '');
  const countResult = await db.query(countQuery, params.slice(0, -2));

  return {
    saves: result.rows,
    total: parseInt(countResult.rows[0].count),
    limit,
    offset
  };
}

async function updateSave(saveId, userId, data) {
  const { title, notes, folders, tags } = data;

  // Update main save record
  const updateQuery = `
    UPDATE saves
    SET title = COALESCE($1, title),
        notes = COALESCE($2, notes),
        updated_at = NOW()
    WHERE id = $3 AND user_id = $4
    RETURNING *
  `;
  await db.query(updateQuery, [title, notes, saveId, userId]);

  // Update folders if provided
  if (folders !== undefined) {
    // Remove existing folder associations
    await db.query('DELETE FROM save_folders WHERE save_id = $1', [saveId]);
    // Add new associations
    for (const folderId of folders) {
      await db.query(
        'INSERT INTO save_folders (save_id, folder_id) VALUES ($1, $2)',
        [saveId, folderId]
      );
    }
  }

  // Update tags if provided
  if (tags !== undefined) {
    await db.query('DELETE FROM save_tags WHERE save_id = $1', [saveId]);
    for (const tagId of tags) {
      await db.query(
        'INSERT INTO save_tags (save_id, tag_id) VALUES ($1, $2)',
        [saveId, tagId]
      );
    }
  }

  return getSaveById(saveId, userId);
}

async function deleteSave(saveId, userId) {
  // Verify ownership
  const save = await db.query(
    'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
    [saveId, userId]
  );
  if (save.rows.length === 0) {
    throw new Error('Save not found');
  }

  // Delete (cascades to related tables)
  await db.query('DELETE FROM saves WHERE id = $1', [saveId]);
}

// Bulk operations
async function bulkUpdateSaves(userId, saveIds, action, data) {
  switch (action) {
    case 'addToFolders':
      for (const saveId of saveIds) {
        for (const folderId of data.folders) {
          await db.query(
            `INSERT INTO save_folders (save_id, folder_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [saveId, folderId]
          );
        }
      }
      break;

    case 'removeFromFolder':
      await db.query(
        `DELETE FROM save_folders
         WHERE save_id = ANY($1) AND folder_id = $2`,
        [saveIds, data.folderId]
      );
      break;

    case 'addTags':
      for (const saveId of saveIds) {
        for (const tagId of data.tags) {
          await db.query(
            `INSERT INTO save_tags (save_id, tag_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [saveId, tagId]
          );
        }
      }
      break;

    case 'delete':
      await db.query(
        `DELETE FROM saves WHERE id = ANY($1) AND user_id = $2`,
        [saveIds, userId]
      );
      break;
  }
}
```

### 2. Add Bulk Operations Endpoint
```javascript
// POST /api/saves/bulk
router.post('/bulk', requireAuth, async (req, res) => {
  const { saveIds, action, data } = req.body;
  await saveService.bulkUpdateSaves(req.user.id, saveIds, action, data);
  res.json({ success: true });
});
```

## Verification
1. Filter saves by folder, tags, content type
2. Search across save titles and content
3. Bulk add to folder works
4. Bulk delete works

## Next Steps
Proceed to Task 6 - Subtask 3 (SaveCreator Component)

## Estimated Time
2-3 hours
