import React from 'react';
import { Folder, FolderOpen } from '@phosphor-icons/react';
import DroppableFolderItem from '../Folder/DroppableFolderItem';

/**
 * FolderList component - displays folders for filtering saves
 * @param {Array} folders - List of folders
 * @param {string|null} activeFolder - Currently selected folder ID
 * @param {Function} onSelect - Callback when a folder is selected
 */
function FolderList({ folders = [], activeFolder, onSelect }) {
  const handleSelect = (folderId) => {
    onSelect(folderId);
  };

  // Calculate total saves count across all folders
  const totalSaves = folders.reduce((sum, folder) => sum + (folder.saveCount || 0), 0);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Folders</h3>

      {/* All Saves option - NOT droppable */}
      <div
        style={{
          ...styles.folderItem,
          ...(activeFolder === null ? styles.folderItemActive : {})
        }}
        onClick={() => handleSelect(null)}
      >
        <div style={styles.folderIcon}>
          {activeFolder === null ? (
            <FolderOpen size={20} weight="fill" />
          ) : (
            <Folder size={20} />
          )}
        </div>
        <span style={styles.folderName}>All Saves</span>
        {totalSaves > 0 && (
          <span style={styles.count}>{totalSaves}</span>
        )}
      </div>

      {/* Folder list - droppable */}
      {folders.map((folder) => (
        <DroppableFolderItem
          key={folder.id}
          folder={folder}
          isActive={activeFolder === folder.id}
          onClick={() => handleSelect(folder.id)}
        />
      ))}

      {/* Uncategorized option - droppable for removing from folders */}
      <DroppableFolderItem
        folder={{
          id: 'uncategorized',
          name: 'Uncategorized',
          saveCount: 0
        }}
        isActive={activeFolder === 'uncategorized'}
        onClick={() => handleSelect('uncategorized')}
      />
    </div>
  );
}

const styles = {
  container: {
    width: '100%'
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
    marginTop: 0
  },
  folderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '4px',
    backgroundColor: 'transparent'
  },
  folderItemActive: {
    backgroundColor: '#dbeafe',
    color: '#2563eb'
  },
  folderIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit'
  },
  folderName: {
    flex: 1,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'inherit'
  },
  count: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '10px'
  }
};

export default FolderList;
