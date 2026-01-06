import React, { useState, useMemo } from 'react';
import { GridFour, List, BookmarkSimple, CaretDown } from '@phosphor-icons/react';
import useSaves from '../../hooks/useSaves';
import useFolders from '../../hooks/useFolders';
import { useToast } from '../../contexts/ToastContext';
import { DragDropProvider } from '../../contexts/DragDropContext';
import saveService from '../../services/saveService';
import {
  FolderList,
  SearchInput,
  SaveGrid,
  SaveList
} from '../../components/Collection';

function Collection() {
  // State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filters, setFilters] = useState({
    folderId: null,
    search: ''
  });
  const [sortBy, setSortBy] = useState('created_at');

  // Hooks
  const { saves, total, loading: savesLoading, error: savesError, refetch: refetchSaves } = useSaves(filters, sortBy);
  const { folders, loading: foldersLoading, refetch: refetchFolders } = useFolders();
  const { showToast } = useToast();

  // Handle folder selection
  const handleFolderSelect = (folderId) => {
    setFilters(prev => ({
      ...prev,
      folderId: folderId
    }));
  };

  // Handle search
  const handleSearch = (searchValue) => {
    setFilters(prev => ({
      ...prev,
      search: searchValue
    }));
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Handle view mode toggle
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Handle drag and drop
  const handleDrop = async ({ saveId, saveData, folderId, folderData }) => {
    try {
      if (folderId === 'uncategorized') {
        // Remove from all folders
        await saveService.removeFromAllFolders(saveId);
        showToast('Save removed from all folders', 'success');
      } else {
        // Add to folder
        await saveService.addToFolder(saveId, folderId);
        showToast(`Save added to "${folderData.name}"`, 'success');
      }

      // Refetch data to update UI
      await Promise.all([refetchSaves(), refetchFolders()]);
    } catch (error) {
      console.error('Error updating save folder:', error);
      showToast('Failed to update folder', 'error');
    }
  };

  // Get active folder name
  const activeFolderName = useMemo(() => {
    if (filters.folderId === null) return 'All Saves';
    if (filters.folderId === 'uncategorized') return 'Uncategorized';
    const folder = folders.find(f => f.id === filters.folderId);
    return folder ? folder.name : 'All Saves';
  }, [filters.folderId, folders]);

  // Loading state
  if (foldersLoading && savesLoading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading collection...</p>
      </div>
    );
  }

  return (
    <DragDropProvider onDrop={handleDrop}>
      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <FolderList
            folders={folders}
            activeFolder={filters.folderId}
            onSelect={handleFolderSelect}
          />
        </div>

        {/* Main Content */}
        <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <h1 style={styles.title}>{activeFolderName}</h1>
            <span style={styles.count}>
              {total} {total === 1 ? 'save' : 'saves'}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          {/* Search */}
          <SearchInput
            value={filters.search}
            onChange={handleSearch}
            placeholder="Search saves..."
          />

          <div style={styles.toolbarRight}>
            {/* Sort dropdown */}
            <div style={styles.sortContainer}>
              <select
                value={sortBy}
                onChange={handleSortChange}
                style={styles.sortSelect}
              >
                <option value="created_at">Newest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="video_title">Video Title</option>
              </select>
              <CaretDown size={16} style={styles.sortIcon} />
            </div>

            {/* View toggle */}
            <div style={styles.viewToggle}>
              <button
                onClick={() => toggleViewMode('grid')}
                style={{
                  ...styles.viewButton,
                  ...(viewMode === 'grid' ? styles.viewButtonActive : {})
                }}
                aria-label="Grid view"
                title="Grid view"
              >
                <GridFour size={20} weight={viewMode === 'grid' ? 'fill' : 'regular'} />
              </button>
              <button
                onClick={() => toggleViewMode('list')}
                style={{
                  ...styles.viewButton,
                  ...(viewMode === 'list' ? styles.viewButtonActive : {})
                }}
                aria-label="List view"
                title="List view"
              >
                <List size={20} weight={viewMode === 'list' ? 'fill' : 'regular'} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {savesLoading && (
            <div style={styles.loadingState}>
              <p>Loading saves...</p>
            </div>
          )}

          {savesError && (
            <div style={styles.errorState}>
              <p>Error loading saves: {savesError}</p>
            </div>
          )}

          {!savesLoading && !savesError && saves.length === 0 && (
            <div style={styles.emptyState}>
              <BookmarkSimple size={64} weight="thin" style={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>No saves found</h3>
              <p style={styles.emptyText}>
                {filters.search
                  ? 'Try adjusting your search or filters'
                  : 'Start analyzing videos to build your collection'}
              </p>
            </div>
          )}

          {!savesLoading && !savesError && saves.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <SaveGrid saves={saves} />
              ) : (
                <SaveList saves={saves} />
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </DragDropProvider>
  );
}

const styles = {
  layout: {
    display: 'flex',
    height: 'calc(100vh - 60px)',
    overflow: 'hidden'
  },
  sidebar: {
    width: '250px',
    borderRight: '1px solid #e5e7eb',
    padding: '16px',
    overflowY: 'auto',
    backgroundColor: '#f9fafb'
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: 'white'
  },
  header: {
    marginBottom: '24px'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#111827',
    margin: 0
  },
  count: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: 500,
    backgroundColor: '#f3f4f6',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  sortContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  sortSelect: {
    padding: '8px 32px 8px 12px',
    fontSize: '0.875rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none'
  },
  sortIcon: {
    position: 'absolute',
    right: '10px',
    pointerEvents: 'none',
    color: '#6b7280'
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f3f4f6',
    padding: '4px',
    borderRadius: '8px'
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s'
  },
  viewButtonActive: {
    backgroundColor: '#dbeafe',
    color: '#2563eb'
  },
  content: {
    minHeight: '200px'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: '#6b7280'
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: '#6b7280'
  },
  errorState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    padding: '20px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    textAlign: 'center',
    padding: '40px'
  },
  emptyIcon: {
    color: '#d1d5db',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 8px 0'
  },
  emptyText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    maxWidth: '400px',
    margin: 0
  }
};

export default Collection;
