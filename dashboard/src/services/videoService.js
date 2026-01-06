/**
 * Video service for API calls
 */

import api from './api';

export const videoService = {
  /**
   * Create a new video for analysis
   * @param {string} url - YouTube URL
   * @returns {Promise} - API response
   */
  create: (url) => api.post('/videos', { url }),

  /**
   * Get all videos for the current user
   * @param {object} params - Query parameters
   * @param {number} params.limit - Number of records to return
   * @param {number} params.offset - Number of records to skip
   * @param {string} params.orderBy - Column to order by
   * @param {string} params.orderDir - Order direction (ASC/DESC)
   * @returns {Promise} - API response
   */
  getAll: (params = {}) => api.get('/videos', { params }),

  /**
   * Get a single video by ID
   * @param {number} id - Video ID
   * @returns {Promise} - API response
   */
  getById: (id) => api.get(`/videos/${id}`),

  /**
   * Delete a video
   * @param {number} id - Video ID
   * @returns {Promise} - API response
   */
  delete: (id) => api.delete(`/videos/${id}`)
};

export default videoService;
