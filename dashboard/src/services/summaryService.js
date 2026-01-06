/**
 * Summary service for API calls
 */

import api, { AI_TIMEOUT } from './api';

export const summaryService = {
  /**
   * Get video summary by video ID
   * @param {number} id - Video ID
   * @returns {Promise} - API response
   */
  getVideoSummary: (id) => api.get(`/videos/${id}/full-summary`),

  /**
   * Get sections for a video
   * @param {number} id - Video ID
   * @returns {Promise} - API response
   */
  getSections: (id) => api.get(`/videos/${id}/sections`),

  /**
   * Detect sections in a video (required before generating summaries)
   * @param {string} id - Video ID
   * @returns {Promise} - API response
   */
  detectSections: (id) => api.post(`/videos/${id}/detect-sections`, {}, { timeout: AI_TIMEOUT }),

  /**
   * Generate section summaries for a video
   * @param {string} id - Video ID
   * @returns {Promise} - API response
   */
  generateSummaries: (id) => api.post(`/videos/${id}/generate-summaries`, {}, { timeout: AI_TIMEOUT }),

  /**
   * Generate full enhanced video summary
   * @param {string} id - Video ID
   * @returns {Promise} - API response
   */
  generateFullSummary: (id) => api.post(`/videos/${id}/generate-full-summary`, {}, { timeout: AI_TIMEOUT }),

  /**
   * Extract key points from video
   * @param {string} id - Video ID
   * @returns {Promise} - API response
   */
  extractKeyPoints: (id) => api.post(`/videos/${id}/extract-key-points`, {}, { timeout: AI_TIMEOUT }),

  /**
   * Get comprehensive analysis for a video
   * @param {string} id - Video ID
   * @returns {Promise} - API response
   */
  getComprehensiveAnalysis: (id) => api.get(`/videos/${id}/comprehensive-analysis`),

  /**
   * Generate comprehensive analysis for a video
   * @param {string} id - Video ID
   * @returns {Promise} - API response
   */
  generateComprehensiveAnalysis: (id) => api.post(`/videos/${id}/generate-comprehensive-analysis`, {}, { timeout: AI_TIMEOUT }),

  // Task 11: Regeneration endpoints

  /**
   * Regenerate all analysis for a video
   * @param {string} id - Video ID
   * @param {string} reason - Regeneration reason
   * @returns {Promise} - API response
   */
  regenerateAnalysis: (id, reason = 'manual') => api.post(`/videos/${id}/regenerate`, { reason }, { timeout: AI_TIMEOUT }),

  /**
   * Get regeneration history for a video
   * @param {string} id - Video ID
   * @param {number} limit - Max results
   * @returns {Promise} - API response
   */
  getRegenerationHistory: (id, limit = 10) => api.get(`/videos/${id}/regeneration-history`, { params: { limit } }),

  /**
   * Check if regeneration is needed for a video
   * @param {string} id - Video ID
   * @returns {Promise} - API response
   */
  checkRegenerationNeeded: (id) => api.get(`/videos/${id}/regeneration-check`),

  /**
   * Get usage statistics for current user
   * @returns {Promise} - API response
   */
  getUsageStats: () => api.get('/usage/stats')
};

export default summaryService;
