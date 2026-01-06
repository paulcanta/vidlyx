/**
 * Folder service for API calls
 */

import api from './api';

export const folderService = {
  /**
   * Get all folders for the current user
   * @returns {Promise} - API response
   */
  getAll: () => api.get('/folders'),

  /**
   * Create a new folder
   * @param {object} data - Folder data
   * @returns {Promise} - API response
   */
  create: (data) => api.post('/folders', data),

  /**
   * Update a folder
   * @param {number} id - Folder ID
   * @param {object} data - Updated folder data
   * @returns {Promise} - API response
   */
  update: (id, data) => api.put(`/folders/${id}`, data),

  /**
   * Delete a folder
   * @param {number} id - Folder ID
   * @returns {Promise} - API response
   */
  delete: (id) => api.delete(`/folders/${id}`)
};

export default folderService;
