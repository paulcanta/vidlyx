/**
 * Video service for managing video records in the database
 */

const pool = require('./db');

/**
 * Create a new video record
 * @param {number} userId - User ID
 * @param {string} youtubeId - YouTube video ID (11 characters)
 * @param {string} originalUrl - Original YouTube URL provided by user
 * @returns {Promise<object>} - Created video record
 */
async function createVideo(userId, youtubeId, originalUrl) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO videos (user_id, youtube_id, original_url, analysis_status, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', NOW(), NOW())
       RETURNING *`,
      [userId, youtubeId, originalUrl]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Find a video by YouTube ID for a specific user
 * @param {number} userId - User ID
 * @param {string} youtubeId - YouTube video ID
 * @returns {Promise<object|null>} - Video record or null
 */
async function findVideoByYoutubeId(userId, youtubeId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM videos WHERE user_id = $1 AND youtube_id = $2`,
      [userId, youtubeId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Find a video by its database ID
 * @param {number} videoId - Video database ID
 * @returns {Promise<object|null>} - Video record or null
 */
async function findVideoById(videoId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM videos WHERE id = $1`,
      [videoId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Find all videos for a user with pagination
 * @param {number} userId - User ID
 * @param {object} options - Query options
 * @param {number} options.limit - Number of records to return (default 10)
 * @param {number} options.offset - Number of records to skip (default 0)
 * @param {string} options.orderBy - Column to order by (default 'created_at')
 * @param {string} options.orderDir - Order direction 'ASC' or 'DESC' (default 'DESC')
 * @returns {Promise<{videos: Array, total: number}>} - Videos and total count
 */
async function findVideosByUser(userId, options = {}) {
  const {
    limit = 10,
    offset = 0,
    orderBy = 'created_at',
    orderDir = 'DESC'
  } = options;

  // Validate orderBy to prevent SQL injection
  const allowedColumns = ['created_at', 'updated_at', 'title', 'analysis_status'];
  const column = allowedColumns.includes(orderBy) ? orderBy : 'created_at';
  const direction = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const client = await pool.connect();
  try {
    // Get videos
    const videosResult = await client.query(
      `SELECT * FROM videos
       WHERE user_id = $1
       ORDER BY ${column} ${direction}
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM videos WHERE user_id = $1`,
      [userId]
    );

    return {
      videos: videosResult.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  } finally {
    client.release();
  }
}

/**
 * Update video status
 * @param {number} videoId - Video database ID
 * @param {string} status - New status (pending, processing, completed, failed)
 * @returns {Promise<object>} - Updated video record
 */
async function updateVideoStatus(videoId, status) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE videos
       SET analysis_status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, videoId]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Update video metadata
 * @param {number} videoId - Video database ID
 * @param {object} metadata - Metadata to update
 * @param {string} metadata.title - Video title
 * @param {string} metadata.channel_name - Channel name
 * @param {number} metadata.duration - Duration in seconds
 * @param {string} metadata.thumbnail_url - Thumbnail URL
 * @param {string} metadata.description - Video description
 * @returns {Promise<object>} - Updated video record
 */
async function updateVideoMetadata(videoId, metadata) {
  const client = await pool.connect();
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (metadata.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(metadata.title);
    }
    if (metadata.channel_name !== undefined) {
      updates.push(`channel_name = $${paramIndex++}`);
      values.push(metadata.channel_name);
    }
    if (metadata.duration !== undefined) {
      updates.push(`duration = $${paramIndex++}`);
      values.push(metadata.duration);
    }
    if (metadata.thumbnail_url !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex++}`);
      values.push(metadata.thumbnail_url);
    }
    if (metadata.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(metadata.description);
    }

    if (updates.length === 0) {
      throw new Error('No metadata provided to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(videoId);

    const result = await client.query(
      `UPDATE videos
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Delete a video and its associated data
 * @param {number} videoId - Video database ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function deleteVideo(videoId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM videos WHERE id = $1`,
      [videoId]
    );
    return result.rowCount > 0;
  } finally {
    client.release();
  }
}

module.exports = {
  createVideo,
  findVideoByYoutubeId,
  findVideoById,
  findVideosByUser,
  updateVideoStatus,
  updateVideoMetadata,
  deleteVideo
};
