import React, { useState, useRef, useEffect } from 'react';
import { Folder, FolderOpen, Plus, DotsThree, PencilSimple, Trash } from '@phosphor-icons/react';
import useFolders from '../../hooks/useFolders';
import CreateFolderModal from './CreateFolderModal';
import EditFolderModal from './EditFolderModal';

/**
 * FolderList component for displaying and managing folders
 * @param {Object} props
 * @param {string|null} props.activeFolder - Currently active folder ID or special value ('uncategorized', null)
 * @param {Function} props.onSelect - Callback when a folder is selected
 */
function FolderList({ activeFolder, onSelect }) {
  const { folders, loading, error, createFolder, updateFolder, deleteFolder } = useFolders();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleCreateFolder = async (data) => {
    await createFolder(data);
    setShowCreateModal(false);
  };

  const handleUpdateFolder = async (data) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, data);
      setEditingFolder(null);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (window.confirm(`Are you sure you want to delete "${folder.name}"? Saves in this folder will be moved to Uncategorized.`)) {
      await deleteFolder(folder.id);
      setOpenMenuId(null);

      // If deleting the active folder, switch to "All Saves"
      if (activeFolder === folder.id) {
        onSelect(null);
      }
    }
  };

  const toggleMenu = (folderId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === folderId ? null : folderId);
  };

  const handleEdit = (folder, e) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setOpenMenuId(null);
  };

  const handleDelete = (folder, e) => {
    e.stopPropagation();
    handleDeleteFolder(folder);
  };

  const renderFolderItem = (folder, isSpecial = false) => {
    const isActive = activeFolder === folder.id;
    const Icon = isActive ? FolderOpen : Folder;

    return (
      <div
        key={folder.id}
        onClick={() => onSelect(folder.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          cursor: 'pointer',
          borderRadius: '6px',
          backgroundColor: isActive ? '#eff6ff' : 'transparent',
          transition: 'background-color 0.2s ease',
          marginBottom: '4px',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {folder.color && !isSpecial && (
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: folder.color,
                flexShrink: 0
              }}
            />
          )}
          <Icon
            size={20}
            weight={isActive ? 'fill' : 'regular'}
            color={isActive ? '#3b82f6' : '#6b7280'}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? '#3b82f6' : '#374151',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {folder.name}
          </span>
          {folder.save_count !== undefined && (
            <span
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                backgroundColor: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '10px',
                marginLeft: 'auto',
                flexShrink: 0
              }}
            >
              {folder.save_count}
            </span>
          )}
        </div>

        {!isSpecial && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => toggleMenu(folder.id, e)}
              style={{
                padding: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <DotsThree size={20} weight="bold" color="#6b7280" />
            </button>

            {openMenuId === folder.id && (
              <div
                ref={menuRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  minWidth: '140px',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={(e) => handleEdit(folder, e)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <PencilSimple size={16} />
                  Edit
                </button>
                <button
                  onClick={(e) => handleDelete(folder, e)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#ef4444',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        Loading folders...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '14px' }}>
        Error loading folders
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          Folders
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '6px',
            border: 'none',
            backgroundColor: '#3b82f6',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
          title="Create new folder"
        >
          <Plus size={20} weight="bold" color="#ffffff" />
        </button>
      </div>

      {/* Folder List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* Special folders */}
        {renderFolderItem({ id: null, name: 'All Saves', save_count: folders.reduce((sum, f) => sum + (f.save_count || 0), 0) }, true)}
        {renderFolderItem({ id: 'uncategorized', name: 'Uncategorized' }, true)}

        {/* Divider */}
        {folders.length > 0 && (
          <div
            style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}
          />
        )}

        {/* User folders */}
        {folders.map((folder) => renderFolderItem(folder))}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateFolderModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {editingFolder && (
        <EditFolderModal
          folder={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSave={handleUpdateFolder}
        />
      )}
    </div>
  );
}

export default FolderList;
