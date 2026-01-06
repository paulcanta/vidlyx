/**
 * Tag service for managing tags in the database
 */

const pool = require('./db');

/**
 * Create a new tag
 * @param {string} userId - User ID (UUID)
 * @param {object} data - Tag data
 * @param {string} data.name - Tag name
 * @param {string} [data.color] - Tag color (hex code)
 * @returns {Promise<object>} - Created tag record
 */
async function create(userId, data) {
  const { name, color } = data;

  if (!name || name.trim().length === 0) {
    throw new Error('Tag name is required');
  }

  const client = await pool.connect();
  try {
    // Check if tag with same name already exists for this user (case-insensitive)
    const existingTag = await client.query(
      `SELECT * FROM tags WHERE user_id = $1 AND LOWER(name) = LOWER($2)`,
      [userId, name.trim()]
    );

    // If exists, return existing tag
    if (existingTag.rows.length > 0) {
      return existingTag.rows[0];
    }

    // Create new tag
    const result = await client.query(
      `INSERT INTO tags (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name.trim(), color || '#64748b']
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Legacy alias for create
 */
async function createTag(userId, data) {
  return create(userId, data);
}

/**
 * Get all tags for a user with save counts
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Array>} - Array of tags with save_count
 */
async function getAll(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        t.id,
        t.name,
        t.color,
        t.created_at,
        COUNT(st.save_id) AS save_count
       FROM tags t
       LEFT JOIN save_tags st ON t.id = st.tag_id
       WHERE t.user_id = $1
       GROUP BY t.id, t.name, t.color, t.created_at
       ORDER BY t.name ASC`,
      [userId]
    );

    // Convert save_count to integer
    return result.rows.map(tag => ({
      ...tag,
      save_count: parseInt(tag.save_count, 10)
    }));
  } finally {
    client.release();
  }
}

/**
 * Legacy alias for getAll
 */
async function getTags(userId) {
  return getAll(userId);
}

/**
 * Get a single tag by ID
 * @param {string} tagId - Tag ID (UUID)
 * @param {string} userId - User ID (UUID) for ownership check
 * @returns {Promise<object|null>} - Tag record or null
 */
async function getTagById(tagId, userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        t.id,
        t.name,
        t.color,
        COUNT(st.save_id) AS usage_count
       FROM tags t
       LEFT JOIN save_tags st ON t.id = st.tag_id
       WHERE t.id = $1 AND t.user_id = $2
       GROUP BY t.id, t.name, t.color`,
      [tagId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      usage_count: parseInt(result.rows[0].usage_count, 10)
    };
  } finally {
    client.release();
  }
}

/**
 * Search tags by name (ILIKE)
 * @param {string} userId - User ID (UUID)
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching tags
 */
async function search(userId, query) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        t.id,
        t.name,
        t.color,
        t.created_at,
        COUNT(st.save_id) AS save_count
       FROM tags t
       LEFT JOIN save_tags st ON t.id = st.tag_id
       WHERE t.user_id = $1 AND t.name ILIKE $2
       GROUP BY t.id, t.name, t.color, t.created_at
       ORDER BY t.name ASC`,
      [userId, `%${query}%`]
    );

    // Convert save_count to integer
    return result.rows.map(tag => ({
      ...tag,
      save_count: parseInt(tag.save_count, 10)
    }));
  } finally {
    client.release();
  }
}

/**
 * Update a tag
 * @param {string} tagId - Tag ID (UUID)
 * @param {string} userId - User ID (UUID) for ownership check
 * @param {object} data - Update data
 * @param {string} [data.name] - New tag name
 * @param {string} [data.color] - New tag color
 * @returns {Promise<object>} - Updated tag record
 */
async function update(tagId, userId, data) {
  const { name, color } = data;

  const client = await pool.connect();
  try {
    // First verify the tag exists and belongs to the user
    const existingTag = await client.query(
      `SELECT id FROM tags WHERE id = $1 AND user_id = $2`,
      [tagId, userId]
    );

    if (existingTag.rows.length === 0) {
      throw new Error('Tag not found or access denied');
    }

    // If name is being updated, check for duplicates (case-insensitive)
    if (name && name.trim().length > 0) {
      const duplicateTag = await client.query(
        `SELECT id FROM tags
         WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3`,
        [userId, name.trim(), tagId]
      );

      if (duplicateTag.rows.length > 0) {
        throw new Error('A tag with this name already exists');
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

    if (updates.length === 0) {
      // No updates, just return the existing tag
      return (await getTagById(tagId, userId));
    }

    values.push(tagId);
    values.push(userId);

    const result = await client.query(
      `UPDATE tags
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Delete a tag
 * Note: The CASCADE will remove save_tags entries
 * @param {string} tagId - Tag ID (UUID)
 * @param {string} userId - User ID (UUID) for ownership check
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function deleteTag(tagId, userId) {
  const client = await pool.connect();
  try {
    // First verify the tag exists and belongs to the user
    const existingTag = await client.query(
      `SELECT id FROM tags WHERE id = $1 AND user_id = $2`,
      [tagId, userId]
    );

    if (existingTag.rows.length === 0) {
      return false;
    }

    // Delete the tag (CASCADE will remove save_tags entries)
    const result = await client.query(
      `DELETE FROM tags WHERE id = $1 AND user_id = $2`,
      [tagId, userId]
    );

    return result.rowCount > 0;
  } finally {
    client.release();
  }
}

/**
 * Alias for delete
 */
async function _delete(tagId, userId) {
  return deleteTag(tagId, userId);
}

/**
 * Get existing tag or create new one
 * @param {string} userId - User ID (UUID)
 * @param {string} name - Tag name
 * @param {string} [color] - Tag color (hex code)
 * @returns {Promise<object>} - Tag record
 */
async function getOrCreate(userId, name, color) {
  return create(userId, { name, color });
}

module.exports = {
  create,
  createTag,
  getAll,
  getTags,
  search,
  update,
  getTagById,
  delete: _delete,
  deleteTag,
  getOrCreate
};
