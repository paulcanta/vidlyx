import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Folder, FolderOpen, BookmarkSimple } from '@phosphor-icons/react';

/**
 * DroppableFolderItem - Folder item that accepts dropped saves
 * @param {Object} folder - Folder object with { id, name, saveCount, icon }
 * @param {boolean} isActive - Whether this folder is currently selected
 * @param {Function} onClick - Click handler for folder selection
 */
function DroppableFolderItem({ folder, isActive, onClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: folder // Store folder data for access during drop
  });

  const getIcon = () => {
    // Special icon for uncategorized
    if (folder.id === 'uncategorized') {
      return <BookmarkSimple size={20} />;
    }

    // Active folder icon
    if (isActive) {
      return <FolderOpen size={20} weight="fill" />;
    }

    // Default folder icon
    return <Folder size={20} />;
  };

  return (
    <div
      ref={setNodeRef}
      className={`folder-item ${isOver ? 'drop-target' : ''}`}
      style={{
        ...styles.folderItem,
        ...(isActive ? styles.folderItemActive : {}),
        ...(isOver ? styles.dropTarget : {})
      }}
      onClick={onClick}
    >
      <div style={styles.folderIcon}>
        {getIcon()}
      </div>
      <span style={styles.folderName}>{folder.name}</span>
      {folder.saveCount > 0 && (
        <span style={styles.count}>{folder.saveCount}</span>
      )}
    </div>
  );
}

const styles = {
  folderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '4px',
    backgroundColor: 'transparent',
    border: '2px solid transparent'
  },
  folderItemActive: {
    backgroundColor: '#dbeafe',
    color: '#2563eb'
  },
  dropTarget: {
    backgroundColor: '#dbeafe',
    border: '2px dashed #2563eb'
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

export default DroppableFolderItem;
