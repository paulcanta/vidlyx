import { useState, useEffect, useCallback, useRef } from 'react';
import searchService from '../services/searchService';

/**
 * Custom hook for search functionality with debouncing
 * @param {object} initialOptions - Initial search options
 * @param {Array<string>} initialOptions.types - Content types to search
 * @param {number} initialOptions.limit - Maximum results per type
 * @param {number} initialOptions.debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns {object} Search state and methods
 */
function useSearch(initialOptions = {}) {
  const {
    types = ['videos', 'saves', 'transcripts', 'frames'],
    limit = 10,
    debounceMs = 300
  } = initialOptions;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);

  // Ref for debounce timer
  const debounceTimer = useRef(null);
  // Ref to track the latest query
  const latestQuery = useRef('');

  /**
   * Execute search
   */
  const executeSearch = useCallback(async (searchQuery, searchOffset = 0) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      latestQuery.current = searchQuery;

      const response = await searchService.search(searchQuery.trim(), {
        types,
        limit,
        offset: searchOffset
      });

      // Only update results if this is still the latest query
      if (latestQuery.current === searchQuery) {
        setResults(response.data);
      }
    } catch (err) {
      console.error('Search error:', err);
      if (latestQuery.current === searchQuery) {
        setError(err.response?.data?.message || err.message || 'Search failed');
        setResults(null);
      }
    } finally {
      if (latestQuery.current === searchQuery) {
        setLoading(false);
      }
    }
  }, [types, limit]);

  /**
   * Fetch autocomplete suggestions
   */
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await searchService.getSuggestions(searchQuery.trim(), {
        limit: 5
      });

      // Only update suggestions if this is still the current query
      if (query === searchQuery) {
        setSuggestions(response.data?.suggestions || []);
      }
    } catch (err) {
      console.error('Suggestions error:', err);
      setSuggestions([]);
    }
  }, [query]);

  /**
   * Update search query with debouncing
   */
  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
    setOffset(0);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for search
    debounceTimer.current = setTimeout(() => {
      executeSearch(newQuery, 0);
    }, debounceMs);

    // Fetch suggestions immediately (with shorter debounce)
    setTimeout(() => {
      fetchSuggestions(newQuery);
    }, 150);
  }, [executeSearch, fetchSuggestions, debounceMs]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setSuggestions([]);
    setError(null);
    setOffset(0);
    latestQuery.current = '';

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(() => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    executeSearch(query, newOffset);
  }, [query, offset, limit, executeSearch]);

  /**
   * Retry search
   */
  const retry = useCallback(() => {
    executeSearch(query, offset);
  }, [query, offset, executeSearch]);

  /**
   * Search specific content type
   */
  const searchByType = useCallback(async (searchQuery, type) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      switch (type) {
        case 'videos':
          response = await searchService.searchVideos(searchQuery.trim(), { limit });
          break;
        case 'saves':
          response = await searchService.searchSaves(searchQuery.trim(), { limit });
          break;
        case 'transcripts':
          response = await searchService.searchTranscripts(searchQuery.trim(), { limit });
          break;
        case 'frames':
          response = await searchService.searchFrames(searchQuery.trim(), { limit });
          break;
        default:
          throw new Error(`Invalid search type: ${type}`);
      }

      return response.data;
    } catch (err) {
      console.error(`Search ${type} error:`, err);
      setError(err.response?.data?.message || err.message || `Search ${type} failed`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    query,
    results,
    suggestions,
    loading,
    error,
    offset,
    updateQuery,
    clearSearch,
    loadMore,
    retry,
    searchByType
  };
}

export default useSearch;
