import { useState, useEffect, useCallback } from 'react';
import tagService from '../services/tagService';

/**
 * Hook to fetch and manage tags
 * @returns {Object} { tags, loading, error, search, createTag, deleteTag, refetch }
 */
function useTags() {
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]); // Store all tags for local filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await tagService.getAll();
      const fetchedTags = response.data.tags || response.data || [];
      setTags(fetchedTags);
      setAllTags(fetchedTags);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err.message || 'Failed to fetch tags');
      setTags([]);
      setAllTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Filter tags locally by query
  const search = useCallback((query) => {
    if (!query || query.trim() === '') {
      setTags(allTags);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allTags.filter(tag =>
      tag.name.toLowerCase().includes(lowerQuery)
    );
    setTags(filtered);
  }, [allTags]);

  // Create a new tag and add to state
  const createTag = useCallback(async (data) => {
    try {
      const response = await tagService.create(data);
      const newTag = response.data.tag || response.data;

      // Add the new tag to both tags and allTags
      setTags(prev => [...prev, newTag]);
      setAllTags(prev => [...prev, newTag]);

      return newTag;
    } catch (err) {
      console.error('Error creating tag:', err);
      throw err;
    }
  }, []);

  // Delete a tag and remove from state
  const deleteTag = useCallback(async (id) => {
    try {
      await tagService.delete(id);

      // Remove the tag from both tags and allTags
      setTags(prev => prev.filter(tag => tag._id !== id));
      setAllTags(prev => prev.filter(tag => tag._id !== id));
    } catch (err) {
      console.error('Error deleting tag:', err);
      throw err;
    }
  }, []);

  // Refresh tags from the server
  const refetch = useCallback(() => {
    return fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    search,
    createTag,
    deleteTag,
    refetch
  };
}

export default useTags;
