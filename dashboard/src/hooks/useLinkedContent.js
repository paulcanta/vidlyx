import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:4051/api';

/**
 * Custom hook to fetch linked content/correlations at current time
 * @param {string} videoId - The video ID
 * @param {number} currentTime - The current playback time in seconds
 * @returns {Object} - { linkedFrames, loading, error }
 */
export function useLinkedContent(videoId, currentTime = 0) {
  const [linkedFrames, setLinkedFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedSecond = useRef(-1);

  useEffect(() => {
    if (!videoId) {
      setLinkedFrames([]);
      return;
    }

    const currentSecond = Math.floor(currentTime);

    // Only fetch if the second has changed
    if (currentSecond === lastFetchedSecond.current) {
      return;
    }

    lastFetchedSecond.current = currentSecond;

    const fetchLinkedContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/videos/${videoId}/correlations/at/${currentSecond}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setLinkedFrames([]);
          } else {
            throw new Error('Failed to fetch linked content');
          }
          return;
        }

        const data = await response.json();
        setLinkedFrames(data.correlations || data.linkedFrames || []);
      } catch (err) {
        console.error('Error fetching linked content:', err);
        setError(err.message);
        setLinkedFrames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedContent();
  }, [videoId, currentTime]);

  return { linkedFrames, loading, error };
}

export default useLinkedContent;
