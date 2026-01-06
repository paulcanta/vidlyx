/**
 * Section service for API calls
 */

import api from './api';

export const sectionService = {
  /**
   * Get all sections for a video
   * @param {string} videoId - Video ID
   * @returns {Promise} - API response
   */
  getByVideoId: (videoId) => api.get(`/videos/${videoId}/sections`),

  /**
   * Get a single section by ID
   * @param {string} videoId - Video ID
   * @param {string} sectionId - Section ID
   * @returns {Promise} - API response
   */
  getById: (videoId, sectionId) => api.get(`/videos/${videoId}/sections/${sectionId}`),

  /**
   * Update a section
   * @param {string} sectionId - Section ID
   * @param {object} data - Section data
   * @param {string} data.title - Section title
   * @param {string} data.summary - Section summary
   * @param {Array} data.key_points - Section key points
   * @returns {Promise} - API response
   */
  update: (sectionId, data) => api.put(`/sections/${sectionId}`, data),

  /**
   * Detect sections in a video
   * @param {string} videoId - Video ID
   * @returns {Promise} - API response
   */
  detectSections: (videoId) => api.post(`/videos/${videoId}/detect-sections`),

  /**
   * Generate summaries for video sections
   * @param {string} videoId - Video ID
   * @returns {Promise} - API response
   */
  generateSummaries: (videoId) => api.post(`/videos/${videoId}/generate-summaries`)
};

export default sectionService;
