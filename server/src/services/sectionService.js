/**
 * Section service for managing video sections
 */

const pool = require('./db');

/**
 * Get all sections for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<Array>} - Array of sections
 */
async function getSectionsByVideoId(videoId) {
  const query = `
    SELECT
      id,
      video_id,
      title,
      start_time,
      end_time,
      summary,
      key_points,
      section_order,
      generated_at,
      created_at
    FROM sections
    WHERE video_id = $1
    ORDER BY section_order ASC, start_time ASC
  `;

  const result = await pool.query(query, [videoId]);
  return result.rows;
}

/**
 * Get a single section by ID
 * @param {string} sectionId - Section ID
 * @returns {Promise<object|null>} - Section object or null
 */
async function getSectionById(sectionId) {
  const query = `
    SELECT
      id,
      video_id,
      title,
      start_time,
      end_time,
      summary,
      key_points,
      section_order,
      generated_at,
      created_at
    FROM sections
    WHERE id = $1
  `;

  const result = await pool.query(query, [sectionId]);
  return result.rows[0] || null;
}

/**
 * Update a section
 * @param {string} sectionId - Section ID
 * @param {object} data - Update data
 * @param {string} data.title - Section title
 * @param {string} data.summary - Section summary
 * @param {Array} data.key_points - Section key points
 * @returns {Promise<object>} - Updated section
 */
async function updateSection(sectionId, data) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }

  if (data.summary !== undefined) {
    updates.push(`summary = $${paramIndex++}`);
    values.push(data.summary);
  }

  if (data.key_points !== undefined) {
    updates.push(`key_points = $${paramIndex++}`);
    values.push(JSON.stringify(data.key_points));
  }

  if (data.summary !== undefined || data.key_points !== undefined) {
    updates.push(`generated_at = $${paramIndex++}`);
    values.push(new Date());
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(sectionId);

  const query = `
    UPDATE sections
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING
      id,
      video_id,
      title,
      start_time,
      end_time,
      summary,
      key_points,
      section_order,
      generated_at,
      created_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Create a new section
 * @param {string} videoId - Video ID
 * @param {object} data - Section data
 * @returns {Promise<object>} - Created section
 */
async function createSection(videoId, data) {
  const query = `
    INSERT INTO sections (
      video_id,
      title,
      start_time,
      end_time,
      summary,
      key_points,
      section_order,
      generated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      video_id,
      title,
      start_time,
      end_time,
      summary,
      key_points,
      section_order,
      generated_at,
      created_at
  `;

  const values = [
    videoId,
    data.title,
    data.start_time,
    data.end_time,
    data.summary || null,
    data.key_points ? JSON.stringify(data.key_points) : null,
    data.section_order,
    data.summary || data.key_points ? new Date() : null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Delete a section
 * @param {string} sectionId - Section ID
 * @returns {Promise<boolean>} - True if deleted
 */
async function deleteSection(sectionId) {
  const query = 'DELETE FROM sections WHERE id = $1';
  const result = await pool.query(query, [sectionId]);
  return result.rowCount > 0;
}

module.exports = {
  getSectionsByVideoId,
  getSectionById,
  updateSection,
  createSection,
  deleteSection
};
