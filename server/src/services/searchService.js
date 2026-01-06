/**
 * Search service for full-text search across videos, saves, and transcripts
 * Uses PostgreSQL full-text search with ts_vector and ts_query
 */

const pool = require('./db');

/**
 * Global search across all searchable content
 * @param {string} userId - User ID to filter results
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {Array<string>} options.types - Content types to search ['videos', 'saves', 'transcripts', 'frames']
 * @param {number} options.limit - Maximum results per type (default: 10)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Promise<object>} - Search results grouped by type
 */
async function search(userId, query, options = {}) {
  const {
    types = ['videos', 'saves', 'transcripts', 'frames'],
    limit = 10,
    offset = 0
  } = options;

  const results = {
    query,
    results: {}
  };

  // Execute searches in parallel for specified types
  const promises = [];

  if (types.includes('videos')) {
    promises.push(
      searchVideos(userId, query, { limit, offset })
        .then(videos => { results.results.videos = videos; })
        .catch(err => {
          console.error('Error searching videos:', err);
          results.results.videos = { items: [], total: 0 };
        })
    );
  }

  if (types.includes('saves')) {
    promises.push(
      searchSaves(userId, query, { limit, offset })
        .then(saves => { results.results.saves = saves; })
        .catch(err => {
          console.error('Error searching saves:', err);
          results.results.saves = { items: [], total: 0 };
        })
    );
  }

  if (types.includes('transcripts')) {
    promises.push(
      searchTranscripts(userId, query, { limit, offset })
        .then(transcripts => { results.results.transcripts = transcripts; })
        .catch(err => {
          console.error('Error searching transcripts:', err);
          results.results.transcripts = { items: [], total: 0 };
        })
    );
  }

  if (types.includes('frames')) {
    promises.push(
      searchFrames(userId, query, { limit, offset })
        .then(frames => { results.results.frames = frames; })
        .catch(err => {
          console.error('Error searching frames:', err);
          results.results.frames = { items: [], total: 0 };
        })
    );
  }

  await Promise.all(promises);

  // Calculate total results
  results.total = Object.values(results.results).reduce(
    (sum, typeResults) => sum + (typeResults.total || 0),
    0
  );

  return results;
}

/**
 * Search videos by title, description, and channel name
 * @param {string} userId - User ID to filter results
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @returns {Promise<object>} - Search results with items and total count
 */
async function searchVideos(userId, query, options = {}) {
  const { limit = 10, offset = 0 } = options;

  const client = await pool.connect();
  try {
    const searchQuery = `
      SELECT
        v.id,
        v.youtube_id,
        v.title,
        v.channel_name,
        v.duration,
        v.thumbnail_url,
        v.description,
        v.analysis_status,
        v.created_at,
        ts_rank(v.search_vector, query) AS rank,
        ts_headline('english', COALESCE(v.title, ''), query,
          'MaxWords=20, MinWords=10, StartSel=<mark>, StopSel=</mark>') AS title_highlight,
        ts_headline('english', COALESCE(v.description, ''), query,
          'MaxWords=50, MinWords=25, StartSel=<mark>, StopSel=</mark>') AS description_highlight
      FROM videos v,
           plainto_tsquery('english', $1) query
      WHERE v.user_id = $2
        AND v.search_vector @@ query
      ORDER BY rank DESC, v.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM videos v,
           plainto_tsquery('english', $1) query
      WHERE v.user_id = $2
        AND v.search_vector @@ query
    `;

    const [itemsResult, countResult] = await Promise.all([
      client.query(searchQuery, [query, userId, limit, offset]),
      client.query(countQuery, [query, userId])
    ]);

    return {
      items: itemsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset
    };
  } finally {
    client.release();
  }
}

/**
 * Search saves by title and notes
 * @param {string} userId - User ID to filter results
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @returns {Promise<object>} - Search results with items and total count
 */
async function searchSaves(userId, query, options = {}) {
  const { limit = 10, offset = 0 } = options;

  const client = await pool.connect();
  try {
    const searchQuery = `
      SELECT
        s.id,
        s.video_id,
        s.title,
        s.notes,
        s.auto_title,
        s.created_at,
        s.updated_at,
        v.title as video_title,
        v.youtube_id,
        v.thumbnail_url,
        ts_rank(s.search_vector, query) AS rank,
        ts_headline('english', COALESCE(s.title, ''), query,
          'MaxWords=20, MinWords=10, StartSel=<mark>, StopSel=</mark>') AS title_highlight,
        ts_headline('english', COALESCE(s.notes, ''), query,
          'MaxWords=50, MinWords=25, StartSel=<mark>, StopSel=</mark>') AS notes_highlight
      FROM saves s
      JOIN videos v ON s.video_id = v.id
      CROSS JOIN plainto_tsquery('english', $1) query
      WHERE s.user_id = $2
        AND s.search_vector @@ query
      ORDER BY rank DESC, s.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM saves s,
           plainto_tsquery('english', $1) query
      WHERE s.user_id = $2
        AND s.search_vector @@ query
    `;

    const [itemsResult, countResult] = await Promise.all([
      client.query(searchQuery, [query, userId, limit, offset]),
      client.query(countQuery, [query, userId])
    ]);

    return {
      items: itemsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset
    };
  } finally {
    client.release();
  }
}

/**
 * Search transcripts by full text
 * @param {string} userId - User ID to filter results
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @returns {Promise<object>} - Search results with items and total count
 */
async function searchTranscripts(userId, query, options = {}) {
  const { limit = 10, offset = 0 } = options;

  const client = await pool.connect();
  try {
    const searchQuery = `
      SELECT
        t.id,
        t.video_id,
        t.transcript_type,
        t.language,
        t.created_at,
        v.title as video_title,
        v.youtube_id,
        v.thumbnail_url,
        v.duration,
        ts_rank(t.search_vector, query) AS rank,
        ts_headline('english', t.full_text, query,
          'MaxWords=50, MinWords=25, StartSel=<mark>, StopSel=</mark>') AS text_highlight
      FROM transcriptions t
      JOIN videos v ON t.video_id = v.id
      CROSS JOIN plainto_tsquery('english', $1) query
      WHERE v.user_id = $2
        AND t.search_vector @@ query
      ORDER BY rank DESC, t.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM transcriptions t
      JOIN videos v ON t.video_id = v.id
      CROSS JOIN plainto_tsquery('english', $1) query
      WHERE v.user_id = $2
        AND t.search_vector @@ query
    `;

    const [itemsResult, countResult] = await Promise.all([
      client.query(searchQuery, [query, userId, limit, offset]),
      client.query(countQuery, [query, userId])
    ]);

    return {
      items: itemsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset
    };
  } finally {
    client.release();
  }
}

/**
 * Search frames by on-screen text and scene description
 * @param {string} userId - User ID to filter results
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @returns {Promise<object>} - Search results with items and total count
 */
async function searchFrames(userId, query, options = {}) {
  const { limit = 10, offset = 0 } = options;

  const client = await pool.connect();
  try {
    const searchQuery = `
      SELECT
        f.id,
        f.video_id,
        f.timestamp_seconds,
        f.frame_path,
        f.thumbnail_path,
        f.is_keyframe,
        f.content_type,
        f.created_at,
        v.title as video_title,
        v.youtube_id,
        v.thumbnail_url as video_thumbnail,
        ts_rank(f.search_vector, query) AS rank,
        ts_headline('english', COALESCE(f.on_screen_text, ''), query,
          'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') AS text_highlight,
        ts_headline('english', COALESCE(f.scene_description, ''), query,
          'MaxWords=50, MinWords=25, StartSel=<mark>, StopSel=</mark>') AS description_highlight
      FROM frames f
      JOIN videos v ON f.video_id = v.id
      CROSS JOIN plainto_tsquery('english', $1) query
      WHERE v.user_id = $2
        AND f.search_vector @@ query
      ORDER BY rank DESC, f.timestamp_seconds ASC
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM frames f
      JOIN videos v ON f.video_id = v.id
      CROSS JOIN plainto_tsquery('english', $1) query
      WHERE v.user_id = $2
        AND f.search_vector @@ query
    `;

    const [itemsResult, countResult] = await Promise.all([
      client.query(searchQuery, [query, userId, limit, offset]),
      client.query(countQuery, [query, userId])
    ]);

    return {
      items: itemsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset
    };
  } finally {
    client.release();
  }
}

/**
 * Get autocomplete suggestions based on search query
 * Uses trigram similarity for fuzzy matching on titles and common terms
 * @param {string} userId - User ID to filter results
 * @param {string} query - Partial search query
 * @param {object} options - Options
 * @param {number} options.limit - Maximum number of suggestions (default: 5)
 * @returns {Promise<Array>} - Array of suggestion objects
 */
async function getSuggestions(userId, query, options = {}) {
  const { limit = 5 } = options;

  if (!query || query.trim().length < 2) {
    return [];
  }

  const client = await pool.connect();
  try {
    // Get suggestions from video titles and channel names using trigram similarity
    const suggestionsQuery = `
      WITH video_suggestions AS (
        SELECT DISTINCT
          title as suggestion,
          'video_title' as type,
          similarity(title, $1) as score
        FROM videos
        WHERE user_id = $2
          AND title % $1
        ORDER BY score DESC
        LIMIT $3
      ),
      channel_suggestions AS (
        SELECT DISTINCT
          channel_name as suggestion,
          'channel' as type,
          similarity(channel_name, $1) as score
        FROM videos
        WHERE user_id = $2
          AND channel_name IS NOT NULL
          AND channel_name % $1
        ORDER BY score DESC
        LIMIT $3
      ),
      save_suggestions AS (
        SELECT DISTINCT
          title as suggestion,
          'save_title' as type,
          similarity(title, $1) as score
        FROM saves
        WHERE user_id = $2
          AND title IS NOT NULL
          AND title % $1
        ORDER BY score DESC
        LIMIT $3
      )
      SELECT suggestion, type, score
      FROM (
        SELECT * FROM video_suggestions
        UNION ALL
        SELECT * FROM channel_suggestions
        UNION ALL
        SELECT * FROM save_suggestions
      ) combined
      ORDER BY score DESC
      LIMIT $3
    `;

    const result = await client.query(suggestionsQuery, [query, userId, limit]);

    return result.rows;
  } finally {
    client.release();
  }
}

module.exports = {
  search,
  searchVideos,
  searchSaves,
  searchTranscripts,
  searchFrames,
  getSuggestions
};
