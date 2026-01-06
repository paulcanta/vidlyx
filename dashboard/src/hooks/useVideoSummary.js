/**
 * Custom hook for fetching video summary
 */

import { useState, useEffect } from 'react';
import summaryService from '../services/summaryService';

/**
 * Hook to fetch and manage video summary
 * @param {string|number} videoId - The video ID
 * @returns {Object} - { summary, loading, error }
 */
export function useVideoSummary(videoId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!videoId) {
        setLoading(false);
        setSummary(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await summaryService.getVideoSummary(videoId);
        // API returns { summary: {...}, video: {...} }
        setSummary(response.data?.summary || null);
      } catch (err) {
        console.error('Error fetching video summary:', err);
        if (err.response?.status === 404) {
          // No summary found - return null instead of error
          setSummary(null);
        } else {
          setError(err.response?.data?.error || 'Failed to load summary');
          setSummary(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [videoId]);

  return {
    summary,
    loading,
    error
  };
}

export default useVideoSummary;
