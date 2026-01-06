/**
 * Frame service for API calls
 */

import api from './api';

export const frameService = {
  /**
   * Get frames for a video with filters
   * @param {number} videoId - Video ID
   * @param {object} params - Query parameters
   * @param {boolean} params.keyframes - Filter for keyframes only
   * @param {boolean} params.hasText - Filter for frames with OCR text
   * @param {number} params.limit - Number of records to return
   * @param {number} params.offset - Number of records to skip
   * @returns {Promise} - API response
   */
  getFrames: (videoId, params = {}) =>
    api.get(`/videos/${videoId}/frames`, { params }),

  /**
   * Get frames with vision analysis
   * @param {number} videoId - Video ID
   * @returns {Promise} - API response
   */
  getFrameAnalysis: (videoId) =>
    api.get(`/videos/${videoId}/frames/analysis`),

  /**
   * Search frames by OCR text
   * @param {number} videoId - Video ID
   * @param {string} query - Search query
   * @returns {Promise} - API response
   */
  searchFrames: (videoId, query) =>
    api.get(`/videos/${videoId}/frames/search`, { params: { q: query } }),

  /**
   * Trigger frame analysis pipeline
   * @param {number} videoId - Video ID
   * @param {object} options - Analysis options
   * @param {boolean} options.extractKeyframes - Extract keyframes
   * @param {boolean} options.runOCR - Run OCR on frames
   * @param {boolean} options.runVision - Run vision analysis
   * @returns {Promise} - API response
   */
  triggerAnalysis: (videoId, options = {}) =>
    api.post(`/videos/${videoId}/frames/analyze`, options),

  /**
   * Get frame analysis pipeline status
   * @param {number} videoId - Video ID
   * @returns {Promise} - API response
   */
  getAnalysisStatus: (videoId) =>
    api.get(`/videos/${videoId}/frames/status`),

  /**
   * Extract frames from a video
   * @param {string} videoId - Video ID
   * @param {object} options - Extraction options
   * @param {number} options.interval - Interval between frames in seconds
   * @param {boolean} options.keyframesOnly - Extract keyframes only
   * @returns {Promise} - API response
   */
  extractFrames: (videoId, options = {}) =>
    api.post(`/videos/${videoId}/frames/extract`, options)
};

export default frameService;
