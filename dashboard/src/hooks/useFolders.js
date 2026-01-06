import { useState, useEffect, useCallback } from 'react';
import folderService from '../services/folderService';

/**
 * Hook to fetch and manage folders for organizing saves
 * @returns {Object} { folders, loading, error, refreshFolders, createFolder }
 */
function useFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await folderService.getAll();
      setFolders(response.data.folders || response.data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err.message || 'Failed to fetch folders');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const refetch = useCallback(() => {
    return fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (data) => {
    try {
      const response = await folderService.create(data);
      const newFolder = response.data.folder || response.data;

      // Add to state immediately for optimistic update
      setFolders(prevFolders => [...prevFolders, newFolder]);

      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      throw err;
    }
  }, []);

  const updateFolder = useCallback(async (id, data) => {
    try {
      const response = await folderService.update(id, data);
      const updatedFolder = response.data.folder || response.data;

      // Update in state
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === id ? { ...folder, ...updatedFolder } : folder
        )
      );

      return updatedFolder;
    } catch (err) {
      console.error('Error updating folder:', err);
      throw err;
    }
  }, []);

  const deleteFolder = useCallback(async (id) => {
    try {
      await folderService.delete(id);

      // Remove from state
      setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));
    } catch (err) {
      console.error('Error deleting folder:', err);
      throw err;
    }
  }, []);

  return {
    folders,
    loading,
    error,
    refetch,
    createFolder,
    updateFolder,
    deleteFolder
  };
}

export default useFolders;
