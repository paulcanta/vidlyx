import React, { useState } from 'react';
import { Folder, Plus, X } from '@phosphor-icons/react';

function FolderPicker({ selectedFolders = [], onChange }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      onChange([...selectedFolders, newFolderName.trim()]);
      setNewFolderName('');
      setShowInput(false);
    }
  };

  const handleRemoveFolder = (folderToRemove) => {
    onChange(selectedFolders.filter(f => f !== folderToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddFolder();
    } else if (e.key === 'Escape') {
      setNewFolderName('');
      setShowInput(false);
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '0.5rem'
      }}>
        Folders
      </label>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        {selectedFolders.map((folder, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#374151'
            }}
          >
            <Folder size={16} weight="fill" />
            {folder}
            <button
              onClick={() => handleRemoveFolder(folder)}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: '#6b7280'
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {showInput ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Folder name"
            autoFocus
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
          <button
            onClick={handleAddFolder}
            style={{
              padding: '0.5rem 1rem',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Add
          </button>
          <button
            onClick={() => {
              setNewFolderName('');
              setShowInput(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'white',
            color: '#7c3aed',
            border: '1px dashed #7c3aed',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Add Folder
        </button>
      )}
    </div>
  );
}

export default FolderPicker;
