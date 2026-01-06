/**
 * Save service for managing user saves
 */

const pool = require('./db');

/**
 * Generate auto title from save content
 * @param {object} data - Save data
 * @returns {string} - Generated title
 */
function generateAutoTitle(data) {
  const parts = [];

  if (data.frames && data.frames.length > 0) {
    parts.push(`${data.frames.length} frame${data.frames.length > 1 ? 's' : ''}`);
  }

  if (data.transcriptSelections && data.transcriptSelections.length > 0) {
    parts.push(`${data.transcriptSelections.length} transcript${data.transcriptSelections.length > 1 ? 's' : ''}`);
  }

  if (data.summaryExcerpts && data.summaryExcerpts.length > 0) {
    parts.push(`${data.summaryExcerpts.length} summary${data.summaryExcerpts.length > 1 ? ' excerpts' : ' excerpt'}`);
  }

  if (parts.length === 0) {
    return 'Untitled save';
  }

  return parts.join(', ');
}

/**
 * Create a new save
 * @param {string} userId - User ID
 * @param {object} data - Save data
 * @returns {Promise<object>} - Created save with related data
 */
async function createSave(userId, data) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { videoId, title, notes, frames, transcriptSelections, summaryExcerpts, folders, tags } = data;

    // Generate auto title if title not provided
    const autoTitle = generateAutoTitle(data);
    const finalTitle = title || autoTitle;

    // Insert save
    const saveQuery = `
      INSERT INTO saves (user_id, video_id, title, auto_title, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, user_id, video_id, title, auto_title, notes, created_at, updated_at
    `;

    const saveResult = await client.query(saveQuery, [
      userId,
      videoId,
      finalTitle,
      autoTitle,
      notes || null
    ]);

    const save = saveResult.rows[0];

    // Insert frame associations
    if (frames && frames.length > 0) {
      const frameValues = frames.map((frameId, index) =>
        `($1, $${index + 2})`
      ).join(', ');

      const frameQuery = `
        INSERT INTO save_frames (save_id, frame_id)
        VALUES ${frameValues}
        ON CONFLICT (save_id, frame_id) DO NOTHING
      `;

      await client.query(frameQuery, [save.id, ...frames]);
    }

    // Insert transcript selections
    if (transcriptSelections && transcriptSelections.length > 0) {
      for (const selection of transcriptSelections) {
        const transcriptQuery = `
          INSERT INTO save_transcripts (save_id, start_time, end_time, text)
          VALUES ($1, $2, $3, $4)
        `;

        await client.query(transcriptQuery, [
          save.id,
          selection.start,
          selection.end,
          selection.text
        ]);
      }
    }

    // Insert summary excerpts
    if (summaryExcerpts && summaryExcerpts.length > 0) {
      for (const excerpt of summaryExcerpts) {
        const summaryQuery = `
          INSERT INTO save_summaries (save_id, section_id, excerpt)
          VALUES ($1, $2, $3)
        `;

        await client.query(summaryQuery, [
          save.id,
          excerpt.sectionId || null,
          excerpt.text
        ]);
      }
    }

    // Insert folder associations
    if (folders && folders.length > 0) {
      const folderValues = folders.map((folderId, index) =>
        `($1, $${index + 2})`
      ).join(', ');

      const folderQuery = `
        INSERT INTO save_folders (save_id, folder_id)
        VALUES ${folderValues}
        ON CONFLICT (save_id, folder_id) DO NOTHING
      `;

      await client.query(folderQuery, [save.id, ...folders]);
    }

    // Insert tag associations
    if (tags && tags.length > 0) {
      const tagValues = tags.map((tagId, index) =>
        `($1, $${index + 2})`
      ).join(', ');

      const tagQuery = `
        INSERT INTO save_tags (save_id, tag_id)
        VALUES ${tagValues}
        ON CONFLICT (save_id, tag_id) DO NOTHING
      `;

      await client.query(tagQuery, [save.id, ...tags]);
    }

    await client.query('COMMIT');

    // Return full save with related data
    return await getSaveById(save.id, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get save by ID with all related data
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Save object or null
 */
async function getSaveById(saveId, userId) {
  const saveQuery = `
    SELECT
      s.id,
      s.user_id,
      s.video_id,
      s.title,
      s.auto_title,
      s.notes,
      s.created_at,
      s.updated_at,
      v.title as video_title,
      v.youtube_id as video_youtube_id,
      v.thumbnail_url as video_thumbnail_url
    FROM saves s
    LEFT JOIN videos v ON s.video_id = v.id
    WHERE s.id = $1 AND s.user_id = $2
  `;

  const saveResult = await pool.query(saveQuery, [saveId, userId]);

  if (saveResult.rows.length === 0) {
    return null;
  }

  const save = saveResult.rows[0];

  // Get associated frames
  const framesQuery = `
    SELECT
      f.id,
      f.video_id,
      f.frame_number,
      f.timestamp,
      f.image_path,
      f.width,
      f.height,
      f.created_at
    FROM save_frames sf
    JOIN frames f ON sf.frame_id = f.id
    WHERE sf.save_id = $1
    ORDER BY f.timestamp ASC
  `;

  const framesResult = await pool.query(framesQuery, [saveId]);
  save.frames = framesResult.rows;

  // Get transcript selections
  const transcriptQuery = `
    SELECT
      id,
      start_time,
      end_time,
      text
    FROM save_transcripts
    WHERE save_id = $1
    ORDER BY start_time ASC
  `;

  const transcriptResult = await pool.query(transcriptQuery, [saveId]);
  save.transcriptSelections = transcriptResult.rows;

  // Get summary excerpts
  const summaryQuery = `
    SELECT
      ss.id,
      ss.section_id,
      ss.excerpt,
      s.title as section_title
    FROM save_summaries ss
    LEFT JOIN sections s ON ss.section_id = s.id
    WHERE ss.save_id = $1
  `;

  const summaryResult = await pool.query(summaryQuery, [saveId]);
  save.summaryExcerpts = summaryResult.rows;

  // Get folders
  const foldersQuery = `
    SELECT
      f.id,
      f.name,
      f.color,
      f.icon
    FROM save_folders sf
    JOIN folders f ON sf.folder_id = f.id
    WHERE sf.save_id = $1
    ORDER BY f.name ASC
  `;

  const foldersResult = await pool.query(foldersQuery, [saveId]);
  save.folders = foldersResult.rows;
  save.folder_ids = foldersResult.rows.map(f => f.id);

  // Get tags
  const tagsQuery = `
    SELECT
      t.id,
      t.name,
      t.color
    FROM save_tags st
    JOIN tags t ON st.tag_id = t.id
    WHERE st.save_id = $1
  `;

  const tagsResult = await pool.query(tagsQuery, [saveId]);
  save.tags = tagsResult.rows;
  save.tag_ids = tagsResult.rows.map(tag => tag.id);

  return save;
}

/**
 * Get saves with filters
 * @param {string} userId - User ID
 * @param {object} options - Filter options
 * @returns {Promise<object>} - Saves array with pagination info
 */
async function getSaves(userId, options = {}) {
  const {
    folder,
    video,
    tags,
    contentType,
    searchQuery,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 20,
    offset = 0
  } = options;

  let conditions = ['s.user_id = $1'];
  let params = [userId];
  let paramIndex = 2;

  // Filter by folder
  if (folder) {
    if (folder === 'uncategorized') {
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM save_folders sf WHERE sf.save_id = s.id
      )`);
    } else {
      conditions.push(`EXISTS (
        SELECT 1 FROM save_folders sf WHERE sf.save_id = s.id AND sf.folder_id = $${paramIndex}
      )`);
      params.push(folder);
      paramIndex++;
    }
  }

  // Filter by video
  if (video) {
    conditions.push(`s.video_id = $${paramIndex}`);
    params.push(video);
    paramIndex++;
  }

  // Filter by tags
  if (tags && tags.length > 0) {
    const tagIds = Array.isArray(tags) ? tags : [tags];
    conditions.push(`EXISTS (
      SELECT 1 FROM save_tags st WHERE st.save_id = s.id AND st.tag_id = ANY($${paramIndex}::uuid[])
    )`);
    params.push(tagIds);
    paramIndex++;
  }

  // Filter by content type
  if (contentType) {
    switch (contentType) {
      case 'frames':
        conditions.push(`EXISTS (SELECT 1 FROM save_frames sf WHERE sf.save_id = s.id)`);
        break;
      case 'transcripts':
        conditions.push(`EXISTS (SELECT 1 FROM save_transcripts st WHERE st.save_id = s.id)`);
        break;
      case 'summaries':
        conditions.push(`EXISTS (SELECT 1 FROM save_summaries ss WHERE ss.save_id = s.id)`);
        break;
    }
  }

  // Search query
  if (searchQuery) {
    conditions.push(`(
      s.title ILIKE $${paramIndex} OR
      s.notes ILIKE $${paramIndex} OR
      s.auto_title ILIKE $${paramIndex}
    )`);
    params.push(`%${searchQuery}%`);
    paramIndex++;
  }

  // Build order clause
  const validSortFields = ['created_at', 'updated_at', 'title'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Count total
  const countQuery = `
    SELECT COUNT(DISTINCT s.id) as total
    FROM saves s
    WHERE ${conditions.join(' AND ')}
  `;

  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get saves
  params.push(limit, offset);

  const savesQuery = `
    SELECT
      s.id,
      s.user_id,
      s.video_id,
      s.title,
      s.auto_title,
      s.notes,
      s.created_at,
      s.updated_at,
      v.title as video_title,
      v.youtube_id as video_youtube_id,
      v.thumbnail_url as video_thumbnail_url,
      (SELECT COUNT(*) FROM save_frames sf WHERE sf.save_id = s.id) as frame_count,
      (SELECT COUNT(*) FROM save_transcripts st WHERE st.save_id = s.id) as transcript_count,
      (SELECT COUNT(*) FROM save_summaries ss WHERE ss.save_id = s.id) as summary_count,
      COALESCE(
        (SELECT json_agg(json_build_object('id', f.id, 'name', f.name, 'color', f.color))
         FROM save_folders sf
         JOIN folders f ON sf.folder_id = f.id
         WHERE sf.save_id = s.id),
        '[]'::json
      ) as folders,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM save_tags st
         JOIN tags t ON st.tag_id = t.id
         WHERE st.save_id = s.id),
        '[]'::json
      ) as tags
    FROM saves s
    LEFT JOIN videos v ON s.video_id = v.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY s.${orderField} ${orderDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const savesResult = await pool.query(savesQuery, params);

  return {
    saves: savesResult.rows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
}

/**
 * Update a save
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {object} data - Update data
 * @returns {Promise<object>} - Updated save
 */
async function updateSave(saveId, userId, data) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
      [saveId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Save not found or access denied');
    }

    const { title, notes, folders, tags } = data;

    // Update save fields
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    updates.push(`updated_at = NOW()`);
    values.push(saveId);

    if (updates.length > 1) { // More than just updated_at
      const updateQuery = `
        UPDATE saves
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await client.query(updateQuery, values);
    } else {
      // Just update timestamp
      await client.query(
        'UPDATE saves SET updated_at = NOW() WHERE id = $1',
        [saveId]
      );
    }

    // Update folders if provided
    if (folders !== undefined) {
      // Remove existing folders
      await client.query('DELETE FROM save_folders WHERE save_id = $1', [saveId]);

      // Add new folders
      if (folders.length > 0) {
        const folderValues = folders.map((folderId, index) =>
          `($1, $${index + 2})`
        ).join(', ');

        const folderQuery = `
          INSERT INTO save_folders (save_id, folder_id)
          VALUES ${folderValues}
          ON CONFLICT (save_id, folder_id) DO NOTHING
        `;

        await client.query(folderQuery, [saveId, ...folders]);
      }
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await client.query('DELETE FROM save_tags WHERE save_id = $1', [saveId]);

      // Add new tags
      if (tags.length > 0) {
        const tagValues = tags.map((tagId, index) =>
          `($1, $${index + 2})`
        ).join(', ');

        const tagQuery = `
          INSERT INTO save_tags (save_id, tag_id)
          VALUES ${tagValues}
          ON CONFLICT (save_id, tag_id) DO NOTHING
        `;

        await client.query(tagQuery, [saveId, ...tags]);
      }
    }

    await client.query('COMMIT');

    // Return updated save
    return await getSaveById(saveId, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a save
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if deleted
 */
async function deleteSave(saveId, userId) {
  const result = await pool.query(
    'DELETE FROM saves WHERE id = $1 AND user_id = $2',
    [saveId, userId]
  );

  return result.rowCount > 0;
}

/**
 * Bulk update saves
 * @param {string} userId - User ID
 * @param {Array<string>} saveIds - Array of save IDs
 * @param {string} action - Action to perform
 * @param {object} data - Action data
 * @returns {Promise<object>} - Result object
 */
async function bulkUpdateSaves(userId, saveIds, action, data) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify all saves belong to user
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = ANY($1::uuid[]) AND user_id = $2',
      [saveIds, userId]
    );

    const validSaveIds = ownerCheck.rows.map(row => row.id);

    if (validSaveIds.length === 0) {
      throw new Error('No valid saves found');
    }

    let affected = 0;

    switch (action) {
      case 'addToFolders':
        if (!data.folderIds || data.folderIds.length === 0) {
          throw new Error('No folder IDs provided');
        }

        for (const saveId of validSaveIds) {
          for (const folderId of data.folderIds) {
            await client.query(
              'INSERT INTO save_folders (save_id, folder_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [saveId, folderId]
            );
          }
        }

        affected = validSaveIds.length;
        break;

      case 'removeFromFolder':
        if (!data.folderId) {
          throw new Error('No folder ID provided');
        }

        const removeResult = await client.query(
          'DELETE FROM save_folders WHERE save_id = ANY($1::uuid[]) AND folder_id = $2',
          [validSaveIds, data.folderId]
        );

        affected = removeResult.rowCount;
        break;

      case 'addTags':
        if (!data.tagIds || data.tagIds.length === 0) {
          throw new Error('No tag IDs provided');
        }

        for (const saveId of validSaveIds) {
          for (const tagId of data.tagIds) {
            await client.query(
              'INSERT INTO save_tags (save_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [saveId, tagId]
            );
          }
        }

        affected = validSaveIds.length;
        break;

      case 'delete':
        const deleteResult = await client.query(
          'DELETE FROM saves WHERE id = ANY($1::uuid[]) AND user_id = $2',
          [validSaveIds, userId]
        );

        affected = deleteResult.rowCount;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update timestamps for non-delete actions
    if (action !== 'delete') {
      await client.query(
        'UPDATE saves SET updated_at = NOW() WHERE id = ANY($1::uuid[])',
        [validSaveIds]
      );
    }

    await client.query('COMMIT');

    return {
      success: true,
      affected,
      validSaveIds
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add tags to a save
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {Array<string>} tagIds - Array of tag IDs to add
 * @returns {Promise<object>} - Updated save
 */
async function addTags(saveId, userId, tagIds) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
      [saveId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Save not found or access denied');
    }

    // Add tags
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await client.query(
          'INSERT INTO save_tags (save_id, tag_id) VALUES ($1, $2) ON CONFLICT (save_id, tag_id) DO NOTHING',
          [saveId, tagId]
        );
      }
    }

    // Update timestamp
    await client.query(
      'UPDATE saves SET updated_at = NOW() WHERE id = $1',
      [saveId]
    );

    await client.query('COMMIT');

    // Return updated save
    return await getSaveById(saveId, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Remove a tag from a save
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {string} tagId - Tag ID to remove
 * @returns {Promise<object>} - Updated save
 */
async function removeTag(saveId, userId, tagId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
      [saveId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Save not found or access denied');
    }

    // Remove tag
    await client.query(
      'DELETE FROM save_tags WHERE save_id = $1 AND tag_id = $2',
      [saveId, tagId]
    );

    // Update timestamp
    await client.query(
      'UPDATE saves SET updated_at = NOW() WHERE id = $1',
      [saveId]
    );

    await client.query('COMMIT');

    // Return updated save
    return await getSaveById(saveId, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Set tags for a save (replace all existing tags)
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {Array<string>} tagIds - Array of tag IDs to set
 * @returns {Promise<object>} - Updated save
 */
async function setTags(saveId, userId, tagIds) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
      [saveId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Save not found or access denied');
    }

    // Remove existing tags
    await client.query('DELETE FROM save_tags WHERE save_id = $1', [saveId]);

    // Add new tags
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await client.query(
          'INSERT INTO save_tags (save_id, tag_id) VALUES ($1, $2) ON CONFLICT (save_id, tag_id) DO NOTHING',
          [saveId, tagId]
        );
      }
    }

    // Update timestamp
    await client.query(
      'UPDATE saves SET updated_at = NOW() WHERE id = $1',
      [saveId]
    );

    await client.query('COMMIT');

    // Return updated save
    return await getSaveById(saveId, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add save to folders
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {Array<string>} folderIds - Array of folder IDs to add
 * @returns {Promise<object>} - Updated save
 */
async function addToFolders(saveId, userId, folderIds) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify save ownership
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
      [saveId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Save not found or access denied');
    }

    // Verify all folders belong to user
    const folderCheck = await client.query(
      'SELECT id FROM folders WHERE id = ANY($1::uuid[]) AND user_id = $2',
      [folderIds, userId]
    );

    const validFolderIds = folderCheck.rows.map(row => row.id);

    if (validFolderIds.length === 0) {
      throw new Error('No valid folders found');
    }

    // Add save to folders
    for (const folderId of validFolderIds) {
      await client.query(
        'INSERT INTO save_folders (save_id, folder_id) VALUES ($1, $2) ON CONFLICT (save_id, folder_id) DO NOTHING',
        [saveId, folderId]
      );
    }

    // Update save timestamp
    await client.query(
      'UPDATE saves SET updated_at = NOW() WHERE id = $1',
      [saveId]
    );

    await client.query('COMMIT');

    // Return updated save
    return await getSaveById(saveId, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Remove save from a specific folder
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {string} folderId - Folder ID to remove from
 * @returns {Promise<object>} - Updated save
 */
async function removeFromFolder(saveId, userId, folderId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify save ownership
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
      [saveId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Save not found or access denied');
    }

    // Verify folder belongs to user
    const folderCheck = await client.query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );

    if (folderCheck.rows.length === 0) {
      throw new Error('Folder not found or access denied');
    }

    // Remove from folder
    await client.query(
      'DELETE FROM save_folders WHERE save_id = $1 AND folder_id = $2',
      [saveId, folderId]
    );

    // Update save timestamp
    await client.query(
      'UPDATE saves SET updated_at = NOW() WHERE id = $1',
      [saveId]
    );

    await client.query('COMMIT');

    // Return updated save
    return await getSaveById(saveId, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Set folders for a save (replaces all existing folder associations)
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {Array<string>} folderIds - Array of folder IDs (can be empty to remove all)
 * @returns {Promise<object>} - Updated save
 */
async function setFolders(saveId, userId, folderIds) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify save ownership
    const ownerCheck = await client.query(
      'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
      [saveId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Save not found or access denied');
    }

    // Remove all existing folder associations
    await client.query(
      'DELETE FROM save_folders WHERE save_id = $1',
      [saveId]
    );

    // Add new folder associations if any
    if (folderIds && folderIds.length > 0) {
      // Verify all folders belong to user
      const folderCheck = await client.query(
        'SELECT id FROM folders WHERE id = ANY($1::uuid[]) AND user_id = $2',
        [folderIds, userId]
      );

      const validFolderIds = folderCheck.rows.map(row => row.id);

      for (const folderId of validFolderIds) {
        await client.query(
          'INSERT INTO save_folders (save_id, folder_id) VALUES ($1, $2)',
          [saveId, folderId]
        );
      }
    }

    // Update save timestamp
    await client.query(
      'UPDATE saves SET updated_at = NOW() WHERE id = $1',
      [saveId]
    );

    await client.query('COMMIT');

    // Return updated save
    return await getSaveById(saveId, userId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get folders for a save
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of folders
 */
async function getSaveFolders(saveId, userId) {
  // Verify save ownership
  const ownerCheck = await pool.query(
    'SELECT id FROM saves WHERE id = $1 AND user_id = $2',
    [saveId, userId]
  );

  if (ownerCheck.rows.length === 0) {
    throw new Error('Save not found or access denied');
  }

  const foldersQuery = `
    SELECT
      f.id,
      f.name,
      f.color,
      f.icon,
      sf.added_at
    FROM save_folders sf
    JOIN folders f ON sf.folder_id = f.id
    WHERE sf.save_id = $1
    ORDER BY f.name ASC
  `;

  const result = await pool.query(foldersQuery, [saveId]);
  return result.rows;
}

module.exports = {
  createSave,
  getSaveById,
  getSaves,
  updateSave,
  deleteSave,
  bulkUpdateSaves,
  generateAutoTitle,
  addTags,
  removeTag,
  setTags,
  // Save-folder relationship methods
  addToFolders,
  removeFromFolder,
  setFolders,
  getSaveFolders
};
