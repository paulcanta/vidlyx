import React, { useState } from 'react';
import { Folder, Plus, CheckSquare, Square } from '@phosphor-icons/react';

/**
 * FolderPicker Component
 * Allows users to select folders and optionally create new ones
 */
function FolderPicker({ selected = [], onChange, allowCreate = true, folders = [] }) {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const toggleFolder = (folderId) => {
    if (selected.includes(folderId)) {
      onChange(selected.filter(id => id !== folderId));
    } else {
      onChange([...selected, folderId]);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreating(true);
    try {
      // This will be handled by parent component
      if (onChange.onCreate) {
        await onChange.onCreate({ name: newFolderName.trim() });
      }
      setNewFolderName('');
      setShowCreateInput(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateInput(false);
    setNewFolderName('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <label style={styles.label}>Folders</label>
        {allowCreate && !showCreateInput && (
          <button
            type="button"
            style={styles.createButton}
            onClick={() => setShowCreateInput(true)}
          >
            <Plus size={16} weight="bold" />
            <span>New Folder</span>
          </button>
        )}
      </div>

      {/* Create folder input */}
      {showCreateInput && (
        <form onSubmit={handleCreateFolder} style={styles.createForm}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            style={styles.createInput}
            autoFocus
            disabled={creating}
          />
          <div style={styles.createActions}>
            <button
              type="submit"
              style={styles.createSubmit}
              disabled={!newFolderName.trim() || creating}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              style={styles.createCancel}
              onClick={handleCancelCreate}
              disabled={creating}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Folder list */}
      <div style={styles.folderList}>
        {folders.length === 0 ? (
          <div style={styles.emptyState}>
            <Folder size={32} color="#9ca3af" />
            <p style={styles.emptyText}>No folders yet</p>
            {allowCreate && (
              <p style={styles.emptyHint}>Create one to organize your saves</p>
            )}
          </div>
        ) : (
          folders.map(folder => (
            <label
              key={folder.id}
              style={{
                ...styles.folderItem,
                ...(selected.includes(folder.id) ? styles.folderItemSelected : {})
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(folder.id)}
                onChange={() => toggleFolder(folder.id)}
                style={styles.hiddenCheckbox}
              />
              <div style={styles.checkbox}>
                {selected.includes(folder.id) ? (
                  <CheckSquare size={20} weight="fill" color="#2563eb" />
                ) : (
                  <Square size={20} weight="regular" color="#6b7280" />
                )}
              </div>
              <Folder
                size={18}
                weight={selected.includes(folder.id) ? 'fill' : 'regular'}
                color={selected.includes(folder.id) ? '#2563eb' : '#6b7280'}
              />
              <span style={styles.folderName}>{folder.name}</span>
              {folder.save_count !== undefined && (
                <span style={styles.folderCount}>({folder.save_count})</span>
              )}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  createButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '13px',
    color: '#2563eb',
    background: 'transparent',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  createForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  createInput: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  createActions: {
    display: 'flex',
    gap: '8px'
  },
  createSubmit: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    background: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  createCancel: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  folderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  folderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    background: 'white',
    border: '1px solid #e5e7eb'
  },
  folderItemSelected: {
    background: '#eff6ff',
    borderColor: '#2563eb'
  },
  hiddenCheckbox: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  folderName: {
    flex: 1,
    fontSize: '14px',
    color: '#374151'
  },
  folderCount: {
    fontSize: '13px',
    color: '#6b7280'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    textAlign: 'center'
  },
  emptyText: {
    marginTop: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280'
  },
  emptyHint: {
    marginTop: '4px',
    fontSize: '13px',
    color: '#9ca3af'
  }
};

export default FolderPicker;
