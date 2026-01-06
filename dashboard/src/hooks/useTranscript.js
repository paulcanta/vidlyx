import { useState, useEffect } from 'react';
import transcriptService from '../services/transcriptService';

/**
 * Custom hook for fetching and managing video transcript
 * @param {string} videoId - Video ID
 * @returns {object} - Transcript data and state
 */
export function useTranscript(videoId) {
  const [transcript, setTranscript] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!videoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await transcriptService.getByVideoId(videoId);

        if (response.data?.transcript) {
          setTranscript(response.data.transcript);

          // Parse segments if they're stored as a string
          let parsedSegments = response.data.transcript.segments;
          if (typeof parsedSegments === 'string') {
            parsedSegments = JSON.parse(parsedSegments);
          }
          setSegments(parsedSegments || []);
        }
      } catch (err) {
        console.error('Error fetching transcript:', err);
        if (err.response?.status === 404) {
          setError('Transcript not available');
        } else {
          setError(err.message || 'Failed to load transcript');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [videoId]);

  /**
   * Find active segment based on current time
   * @param {number} currentTime - Current video time in seconds
   * @returns {number} - Index of active segment
   */
  const findActiveSegmentIndex = (currentTime) => {
    return segments.findIndex(segment =>
      currentTime >= segment.start && currentTime <= segment.end
    );
  };

  /**
   * Search within transcript
   * @param {string} query - Search query
   * @returns {Array} - Matching segments
   */
  const searchSegments = (query) => {
    if (!query || !segments.length) return segments;

    const lowerQuery = query.toLowerCase();
    return segments.filter(segment =>
      segment.text.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    transcript,
    segments,
    loading,
    error,
    findActiveSegmentIndex,
    searchSegments
  };
}

export default useTranscript;
