/**
 * Save service for API calls
 */

import api from './api';

export const saveService = {
  /**
   * Get all saves for the current user
   * @param {object} params - Query parameters
   * @returns {Promise} - API response
   */
  getAll: (params = {}) => api.get('/saves', { params }),

  /**
   * Get a single save by ID
   * @param {number} id - Save ID
   * @returns {Promise} - API response
   */
  getById: (id) => api.get(`/saves/${id}`),

  /**
   * Create a new save
   * @param {object} data - Save data
   * @returns {Promise} - API response
   */
  create: (data) => api.post('/saves', data),

  /**
   * Update a save
   * @param {number} id - Save ID
   * @param {object} data - Updated save data
   * @returns {Promise} - API response
   */
  update: (id, data) => api.put(`/saves/${id}`, data),

  /**
   * Delete a save
   * @param {number} id - Save ID
   * @returns {Promise} - API response
   */
  delete: (id) => api.delete(`/saves/${id}`),

  /**
   * Bulk create saves
   * @param {object} data - Bulk save data
   * @returns {Promise} - API response
   */
  bulk: (data) => api.post('/saves/bulk', data),

  /**
   * Add save to folder
   * @param {string} saveId - Save ID
   * @param {string} folderId - Folder ID to add to
   * @returns {Promise} - API response
   */
  addToFolder: async (saveId, folderId) => {
    // Get current save data first
    const saveResponse = await api.get(`/saves/${saveId}`);
    const save = saveResponse.data.save || saveResponse.data;

    // Get current folders
    const currentFolders = save.folders || [];

    // Add new folder if not already present
    if (!currentFolders.includes(folderId)) {
      currentFolders.push(folderId);
    }

    // Update save with new folders array
    return api.put(`/saves/${saveId}`, { folders: currentFolders });
  },

  /**
   * Remove save from all folders
   * @param {string} saveId - Save ID
   * @returns {Promise} - API response
   */
  removeFromAllFolders: (saveId) => {
    return api.put(`/saves/${saveId}`, { folders: [] });
  }
};

export default saveService;
