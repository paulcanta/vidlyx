/**
 * Custom hook for fetching and managing video sections
 */

import { useState, useEffect } from 'react';
import sectionService from '../services/sectionService';

/**
 * Hook to fetch and manage video sections
 * @param {string|number} videoId - The video ID
 * @returns {Object} - { sections, loading, error, refreshSections, findSectionAtTime, updateSection }
 */
export function useSections(videoId) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSections = async () => {
    if (!videoId) {
      setLoading(false);
      setSections([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await sectionService.getByVideoId(videoId);

      if (response.data?.sections) {
        setSections(response.data.sections);
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      if (err.response?.status === 404) {
        // No sections found - return empty array instead of error
        setSections([]);
      } else {
        setError(err.response?.data?.error || 'Failed to load sections');
        setSections([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [videoId]);

  /**
   * Refresh sections from the API
   * @returns {Promise<void>}
   */
  const refreshSections = async () => {
    await fetchSections();
  };

  /**
   * Find section at a specific timestamp
   * @param {number} timestamp - Time in seconds
   * @returns {object|null} - Section object or null
   */
  const findSectionAtTime = (timestamp) => {
    return sections.find(section =>
      timestamp >= section.start_time && timestamp <= section.end_time
    ) || null;
  };

  /**
   * Update a section
   * @param {string} sectionId - Section ID
   * @param {object} data - Section data
   * @returns {Promise<object>}
   */
  const updateSection = async (sectionId, data) => {
    try {
      const response = await sectionService.update(sectionId, data);

      if (response.data?.section) {
        // Update local state
        setSections(prevSections =>
          prevSections.map(section =>
            section.id === sectionId ? response.data.section : section
          )
        );
      }

      return response.data;
    } catch (err) {
      console.error('Error updating section:', err);
      throw err;
    }
  };

  return {
    sections,
    loading,
    error,
    refreshSections,
    findSectionAtTime,
    updateSection
  };
}

export default useSections;
