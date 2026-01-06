/**
 * Folder service for managing folders in the database
 */

const pool = require('./db');

/**
 * Create a new folder
 * @param {string} userId - User ID (UUID)
 * @param {object} data - Folder data
 * @param {string} data.name - Folder name
 * @param {string} [data.color] - Folder color (hex code)
 * @param {string} [data.icon] - Folder icon
 * @param {number} [data.sort_order] - Sort order
 * @returns {Promise<object>} - Created folder record with save_count
 */
async function create(userId, data) {
  const { name, color, icon, sort_order } = data;

  if (!name || name.trim().length === 0) {
    throw new Error('Folder name is required');
  }

  const client = await pool.connect();
  try {
    // Check if folder with same name already exists for this user (case-insensitive)
    const existingFolder = await client.query(
      `SELECT id FROM folders WHERE user_id = $1 AND LOWER(name) = LOWER($2)`,
      [userId, name.trim()]
    );

    if (existingFolder.rows.length > 0) {
      throw new Error('A folder with this name already exists');
    }

    const result = await client.query(
      `INSERT INTO folders (user_id, name, color, icon, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [userId, name.trim(), color || null, icon || 'folder', sort_order || 0]
    );

    // Add save_count to the returned folder
    return enrichFolder(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Get all folders for a user with save counts
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Array>} - Array of folders with save counts
 */
async function getAll(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        f.id,
        f.name,
        f.color,
        f.icon,
        f.sort_order,
        f.created_at,
        f.updated_at,
        COUNT(sf.save_id) AS save_count
       FROM folders f
       LEFT JOIN save_folders sf ON f.id = sf.folder_id
       WHERE f.user_id = $1
       GROUP BY f.id, f.name, f.color, f.icon, f.sort_order, f.created_at, f.updated_at
       ORDER BY f.sort_order ASC, f.created_at DESC`,
      [userId]
    );

    // Convert save_count to integer
    return result.rows.map(folder => enrichFolder(folder));
  } finally {
    client.release();
  }
}

/**
 * Get a single folder by ID
 * @param {string} folderId - Folder ID (UUID)
 * @param {string} userId - User ID (UUID) for ownership check
 * @returns {Promise<object|null>} - Folder record or null
 */
async function getById(folderId, userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        f.id,
        f.name,
        f.color,
        f.icon,
        f.sort_order,
        f.created_at,
        f.updated_at,
        COUNT(sf.save_id) AS save_count
       FROM folders f
       LEFT JOIN save_folders sf ON f.id = sf.folder_id
       WHERE f.id = $1 AND f.user_id = $2
       GROUP BY f.id, f.name, f.color, f.icon, f.sort_order, f.created_at, f.updated_at`,
      [folderId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return enrichFolder(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Update a folder
 * @param {string} folderId - Folder ID (UUID)
 * @param {string} userId - User ID (UUID) for ownership check
 * @param {object} data - Data to update
 * @param {string} [data.name] - New folder name
 * @param {string} [data.color] - New folder color
 * @param {string} [data.icon] - New folder icon
 * @param {number} [data.sort_order] - New sort order
 * @returns {Promise<object>} - Updated folder record with save_count
 */
async function update(folderId, userId, data) {
  const { name, color, icon, sort_order } = data;

  const client = await pool.connect();
  try {
    // First verify the folder exists and belongs to the user
    const existingFolder = await client.query(
      `SELECT id FROM folders WHERE id = $1 AND user_id = $2`,
      [folderId, userId]
    );

    if (existingFolder.rows.length === 0) {
      throw new Error('Folder not found or access denied');
    }

    // If name is being updated, check for duplicates (case-insensitive)
    if (name && name.trim().length > 0) {
      const duplicateFolder = await client.query(
        `SELECT id FROM folders
         WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3`,
        [userId, name.trim(), folderId]
      );

      if (duplicateFolder.rows.length > 0) {
        throw new Error('A folder with this name already exists');
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined && name.trim().length > 0) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(color);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      values.push(icon);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(sort_order);
    }

    if (updates.length === 0) {
      // No updates, just return the existing folder
      return (await getById(folderId, userId));
    }

    updates.push(`updated_at = NOW()`);
    values.push(folderId);
    values.push(userId);

    const result = await client.query(
      `UPDATE folders
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return enrichFolder(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Delete a folder
 * Note: Saves remain in the database, just the folder-save linkage is removed
 * @param {string} folderId - Folder ID (UUID)
 * @param {string} userId - User ID (UUID) for ownership check
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function deleteFn(folderId, userId) {
  const client = await pool.connect();
  try {
    // First verify the folder exists and belongs to the user
    const existingFolder = await client.query(
      `SELECT id FROM folders WHERE id = $1 AND user_id = $2`,
      [folderId, userId]
    );

    if (existingFolder.rows.length === 0) {
      return false;
    }

    // Delete the folder (CASCADE will remove save_folders entries)
    const result = await client.query(
      `DELETE FROM folders WHERE id = $1 AND user_id = $2`,
      [folderId, userId]
    );

    return result.rowCount > 0;
  } finally {
    client.release();
  }
}

/**
 * Enrich folder object with save_count as integer
 * @param {object} folder - Folder object from database
 * @returns {object} - Folder with save_count as integer
 */
function enrichFolder(folder) {
  return {
    ...folder,
    save_count: folder.save_count !== undefined ? parseInt(folder.save_count, 10) : 0
  };
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteFn,
  enrichFolder,
  // Legacy exports for backward compatibility
  createFolder: create,
  getFolders: getAll,
  getFolderById: getById,
  updateFolder: update,
  deleteFolder: deleteFn
};
