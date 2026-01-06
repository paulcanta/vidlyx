/**
 * Transcript Service for API calls
 */

import api from './api';

export const transcriptService = {
  /**
   * Get transcript for a video
   * @param {string} videoId - Video ID
   * @returns {Promise} - API response
   */
  getByVideoId: (videoId) => api.get(`/videos/${videoId}/transcript`),

  /**
   * Search within a video transcript
   * @param {string} videoId - Video ID
   * @param {string} query - Search query
   * @returns {Promise} - API response
   */
  search: (videoId, query) => api.get(`/videos/${videoId}/transcript/search`, {
    params: { q: query }
  })
};

export default transcriptService;
