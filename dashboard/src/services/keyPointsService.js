import api from './api';

export const keyPointsService = {
  /**
   * Get key points for a video
   * @param {string} videoId - Video UUID
   * @param {string} category - Optional category filter ('all', 'insight', 'action', 'definition', 'example')
   * @returns {Promise} API response with key points
   */
  getByVideoId: (videoId, category = null) => {
    const params = category && category !== 'all' ? { category } : {};
    return api.get(`/videos/${videoId}/key-points`, { params });
  },

  /**
   * Extract key points from a video using AI
   * @param {string} videoId - Video UUID
   * @returns {Promise} API response with extracted key points
   */
  extract: (videoId) => {
    return api.post(`/videos/${videoId}/extract-key-points`);
  }
};

export default keyPointsService;
