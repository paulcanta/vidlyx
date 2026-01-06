/**
 * Home service for API calls
 */

import api from './api';

export const homeService = {
  /**
   * Get aggregated stats for home page
   * @returns {Promise} - API response with stats
   */
  getStats: () => api.get('/home/stats'),

  /**
   * Get recently accessed videos
   * @param {number} limit - Max videos to return
   * @returns {Promise} - API response with videos
   */
  getRecentVideos: (limit = 6) => api.get('/home/recent-videos', { params: { limit } }),

  /**
   * Get recent saves/highlights
   * @param {number} limit - Max saves to return
   * @returns {Promise} - API response with saves
   */
  getRecentSaves: (limit = 5) => api.get('/home/recent-saves', { params: { limit } }),

  /**
   * Get user's folders with item counts
   * @returns {Promise} - API response with folders
   */
  getFolders: () => api.get('/home/folders'),

  /**
   * Get videos currently being processed
   * @returns {Promise} - API response with processing videos
   */
  getProcessingVideos: () => api.get('/home/processing'),

  /**
   * Get recent insights/key takeaways
   * @param {number} limit - Max insights to return
   * @returns {Promise} - API response with insights
   */
  getInsights: (limit = 5) => api.get('/home/insights', { params: { limit } })
};

export default homeService;
