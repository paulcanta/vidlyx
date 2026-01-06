/**
 * Search service for API calls
 */

import api from './api';

/**
 * Global search across all content types
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {Array<string>} options.types - Content types to search ['videos', 'saves', 'transcripts', 'frames']
 * @param {number} options.limit - Maximum results per type
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise} - API response with search results
 */
export const search = async (query, options = {}) => {
  const params = {
    q: query,
    ...options
  };

  // Convert types array to comma-separated string if provided
  if (options.types && Array.isArray(options.types)) {
    params.types = options.types.join(',');
  }

  return api.get('/search', { params });
};

/**
 * Search videos only
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise} - API response with video search results
 */
export const searchVideos = async (query, options = {}) => {
  const params = {
    q: query,
    ...options
  };

  return api.get('/search/videos', { params });
};

/**
 * Search saves only
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise} - API response with save search results
 */
export const searchSaves = async (query, options = {}) => {
  const params = {
    q: query,
    ...options
  };

  return api.get('/search/saves', { params });
};

/**
 * Search transcripts only
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise} - API response with transcript search results
 */
export const searchTranscripts = async (query, options = {}) => {
  const params = {
    q: query,
    ...options
  };

  return api.get('/search/transcripts', { params });
};

/**
 * Search frames only
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise} - API response with frame search results
 */
export const searchFrames = async (query, options = {}) => {
  const params = {
    q: query,
    ...options
  };

  return api.get('/search/frames', { params });
};

/**
 * Get autocomplete suggestions
 * @param {string} query - Partial search query
 * @param {object} options - Options
 * @param {number} options.limit - Maximum number of suggestions
 * @returns {Promise} - API response with suggestions
 */
export const getSuggestions = async (query, options = {}) => {
  const params = {
    q: query,
    ...options
  };

  return api.get('/search/suggestions', { params });
};

const searchService = {
  search,
  searchVideos,
  searchSaves,
  searchTranscripts,
  searchFrames,
  getSuggestions
};

export default searchService;
