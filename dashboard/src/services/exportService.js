/**
 * Export service for API calls
 */

import api from './api';

export const exportService = {
  /**
   * Export a save in specified format
   * @param {string} id - Save ID
   * @param {string} format - Export format (json, markdown, txt)
   * @returns {Promise} - API response with blob data
   */
  exportSave: async (id, format = 'json') => {
    const response = await api.get(`/export/saves/${id}`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Export video transcript in specified format
   * @param {string} videoId - Video ID
   * @param {string} format - Export format (txt, srt, vtt)
   * @returns {Promise} - API response with blob data
   */
  exportTranscript: async (videoId, format = 'txt') => {
    const response = await api.get(`/export/videos/${videoId}/transcript`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Export video analysis in specified format
   * @param {string} videoId - Video ID
   * @param {string} format - Export format (md, pdf, json, txt)
   * @returns {Promise} - API response with blob data
   */
  exportAnalysis: async (videoId, format = 'md') => {
    const response = await api.get(`/export/videos/${videoId}/analysis`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Download analysis as markdown file (client-side)
   * @param {string} content - Markdown content
   * @param {string} filename - Output filename
   */
  downloadAsMarkdown: (content, filename = 'analysis.md') => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Download analysis as JSON file (client-side)
   * @param {Object} data - Data to export
   * @param {string} filename - Output filename
   */
  downloadAsJson: (data, filename = 'analysis.json') => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Download analysis as plain text file (client-side)
   * @param {string} content - Text content
   * @param {string} filename - Output filename
   */
  downloadAsText: (content, filename = 'analysis.txt') => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Copy content to clipboard
   * @param {string} content - Content to copy
   * @returns {Promise<boolean>} - Success status
   */
  copyToClipboard: async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  }
};

export default exportService;
