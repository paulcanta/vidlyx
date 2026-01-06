import React, { useState } from 'react';
import { FolderPlus, Folder, Check } from '@phosphor-icons/react';
import useFolders from '../../hooks/useFolders';
import Menu from '../common/Menu';

/**
 * FolderDropdown Component
 * Quick folder assignment dropdown for saves
 * Shows a trigger button with a dropdown menu to toggle folder assignments
 *
 * @param {String} saveId - The ID of the save to assign folders to
 * @param {Array} currentFolders - Array of currently assigned folder IDs
 * @param {Function} onUpdate - Callback when folders are updated, receives new array of folder IDs
 */
function FolderDropdown({ saveId, currentFolders = [], onUpdate }) {
  const { folders, loading } = useFolders();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleFolder = (folderId) => {
    let newFolders;

    if (currentFolders.includes(folderId)) {
      // Remove from folders
      newFolders = currentFolders.filter(id => id !== folderId);
    } else {
      // Add to folders
      newFolders = [...currentFolders, folderId];
    }

    onUpdate(newFolders);
  };

  const trigger = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        background: isOpen ? '#f3f4f6' : 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        color: '#6b7280'
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.borderColor = '#d1d5db';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#e5e7eb';
        }
      }}
      title="Manage folders"
    >
      <FolderPlus size={20} weight="regular" />
    </button>
  );

  return (
    <Menu trigger={trigger} open={isOpen} onClose={() => setIsOpen(false)}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6b7280'
        }}>
          Add to Folders
        </span>
      </div>

      {/* Folder List */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            Loading...
          </div>
        ) : folders.length === 0 ? (
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
            const isSelected = currentFolders.includes(folder.id);

            return (
              <div
                key={folder.id}
                onClick={() => handleToggleFolder(folder.id)}
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
                {/* Folder Icon */}
                <Folder
                  size={18}
                  weight={isSelected ? 'fill' : 'regular'}
                  color={isSelected ? '#3b82f6' : '#6b7280'}
                />

                {/* Folder Name */}
                <span style={{
                  flex: 1,
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  {folder.name}
                </span>

                {/* Checkmark */}
                {isSelected && (
                  <Check size={18} weight="bold" color="#3b82f6" />
                )}
              </div>
            );
          })
        )}
      </div>
    </Menu>
  );
}

export default FolderDropdown;
