import React, { useState } from 'react';
import { Plus, Check } from '@phosphor-icons/react';
import useFolders from '../../hooks/useFolders';

/**
 * FolderPicker Component
 * Shows a list of folders with checkboxes for multi-selection
 * Optionally allows creating new folders inline
 *
 * @param {Array} selected - Array of selected folder IDs
 * @param {Function} onChange - Callback when selection changes, receives new array of IDs
 * @param {Boolean} allowCreate - If true, shows create form at bottom
 * @param {String} maxHeight - CSS max-height for scrollable list (default: '300px')
 */
function FolderPicker({ selected = [], onChange, allowCreate = false, maxHeight = '300px' }) {
  const { folders, loading, createFolder } = useFolders();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleToggle = (folderId) => {
    if (selected.includes(folderId)) {
      // Remove from selection
      onChange(selected.filter(id => id !== folderId));
    } else {
      // Add to selection
      onChange([...selected, folderId]);
    }
  };

  const handleCreateClick = () => {
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewFolderName('');
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setCreating(true);
      const newFolder = await createFolder({ name: newFolderName.trim() });

      // Add the new folder to selection
      if (newFolder && newFolder.id) {
        onChange([...selected, newFolder.id]);
      }

      setNewFolderName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFolder();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelCreate();
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        Loading folders...
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      background: 'white',
      overflow: 'hidden'
    }}>
      {/* Folder List */}
      <div style={{
        maxHeight,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {folders.length === 0 ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            No folders yet
          </div>
        ) : (
          folders.map(folder => {
            const isSelected = selected.includes(folder.id);

            return (
              <div
                key={folder.id}
                onClick={() => handleToggle(folder.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Custom Checkbox */}
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: isSelected ? '2px solid #3b82f6' : '2px solid #d1d5db',
                  borderRadius: '4px',
                  background: isSelected ? '#3b82f6' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s'
                }}>
                  {isSelected && (
                    <Check size={14} color="white" weight="bold" />
                  )}
                </div>

                {/* Folder Name */}
                <span style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  flex: 1
                }}>
                  {folder.name}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Create New Folder Section */}
      {allowCreate && (
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '0.75rem 1rem'
        }}>
          {!isCreating ? (
            <button
              onClick={handleCreateClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = 'none';
              }}
            >
              <Plus size={16} weight="bold" />
              Create New Folder
            </button>
          ) : (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Folder name"
                autoFocus
                disabled={creating}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
              <button
                onClick={handleAddFolder}
                disabled={creating || !newFolderName.trim()}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: creating || !newFolderName.trim() ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: creating || !newFolderName.trim() ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {creating ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={handleCancelCreate}
                disabled={creating}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FolderPicker;
