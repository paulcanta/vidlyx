import { useState, useEffect, useCallback } from 'react';
import saveService from '../services/saveService';

/**
 * Hook to fetch and manage saves (bookmarks/saved segments)
 * @param {Object} filters - Filter options (folderId, search, etc.)
 * @param {string} sortBy - Sort option (createdAt, title, etc.)
 * @returns {Object} { saves, total, loading, error, refetch }
 */
function useSaves(filters = {}, sortBy = 'created_at') {
  const [saves, setSaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        orderBy: sortBy,
        orderDir: 'DESC'
      };

      const response = await saveService.getAll(params);
      setSaves(response.data?.saves || response.data || []);
      setTotal(response.data?.total || 0);
    } catch (err) {
      console.error('Error fetching saves:', err);
      setError(err.message || 'Failed to fetch saves');
      setSaves([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const refetch = useCallback(() => {
    return fetchSaves();
  }, [fetchSaves]);

  return {
    saves,
    total,
    loading,
    error,
    refetch
  };
}

export default useSaves;
