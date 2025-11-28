# Task 7 - Subtask 4: FolderPicker Component

## Objective
Build a reusable folder picker component for adding saves to folders.

## Prerequisites
- Task 7 - Subtask 3 completed (FolderList Component)

## Instructions

### 1. Create FolderPicker Component
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderPicker.js`:

```jsx
import React, { useState } from 'react';
import { Folder, Plus, Check } from '@phosphor-icons/react';
import { useFolders } from '../../hooks/useFolders';
import Input from '../ui/Input';
import Button from '../ui/Button';
import './FolderPicker.css';

function FolderPicker({ selected = [], onChange, allowCreate = false, maxHeight = '200px' }) {
  const { folders, loading, createFolder } = useFolders();
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleToggle = (folderId) => {
    if (selected.includes(folderId)) {
      onChange(selected.filter(id => id !== folderId));
    } else {
      onChange([...selected, folderId]);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setCreating(true);
    try {
      const folder = await createFolder({ name: newFolderName.trim() });
      onChange([...selected, folder.id]);
      setNewFolderName('');
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="folder-picker">
        <div className="folder-picker-loading">Loading folders...</div>
      </div>
    );
  }

  return (
    <div className="folder-picker">
      <div className="folder-picker-list" style={{ maxHeight }}>
        {folders.length === 0 ? (
          <div className="folder-picker-empty">
            No folders yet
          </div>
        ) : (
          folders.map(folder => (
            <label key={folder.id} className="folder-picker-item">
              <input
                type="checkbox"
                checked={selected.includes(folder.id)}
                onChange={() => handleToggle(folder.id)}
              />
              <span className="folder-checkbox">
                {selected.includes(folder.id) && <Check size={12} weight="bold" />}
              </span>
              <Folder size={16} style={{ color: folder.color }} />
              <span className="folder-picker-name">{folder.name}</span>
              <span className="folder-picker-count">{folder.save_count}</span>
            </label>
          ))
        )}
      </div>

      {allowCreate && (
        <div className="folder-picker-create">
          {showCreate ? (
            <div className="create-folder-inline">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                size="small"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateFolder();
                  } else if (e.key === 'Escape') {
                    setShowCreate(false);
                    setNewFolderName('');
                  }
                }}
                autoFocus
              />
              <Button
                size="small"
                onClick={handleCreateFolder}
                loading={creating}
                disabled={!newFolderName.trim()}
              >
                Add
              </Button>
              <Button
                size="small"
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  setNewFolderName('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              className="add-folder-btn"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} />
              <span>New Folder</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FolderPicker;
```

### 2. Style FolderPicker
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderPicker.css`:

```css
.folder-picker {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-primary);
}

.folder-picker-list {
  overflow-y: auto;
}

.folder-picker-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.folder-picker-item:hover {
  background: var(--bg-tertiary);
}

.folder-picker-item input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.folder-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.folder-picker-item input:checked + .folder-checkbox {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.folder-picker-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
}

.folder-picker-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.folder-picker-empty {
  padding: var(--space-4);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.folder-picker-loading {
  padding: var(--space-4);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.folder-picker-create {
  border-top: 1px solid var(--border-color);
  padding: var(--space-2);
}

.add-folder-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-2);
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: background var(--transition-fast);
}

.add-folder-btn:hover {
  background: var(--bg-tertiary);
}

.create-folder-inline {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.create-folder-inline .input-wrapper {
  flex: 1;
}
```

### 3. Create FolderDropdown Component
For quick folder assignment in list views:

Create `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderDropdown.js`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus, Folder, Check } from '@phosphor-icons/react';
import { useFolders } from '../../hooks/useFolders';
import './FolderDropdown.css';

function FolderDropdown({ saveId, currentFolders = [], onUpdate }) {
  const { folders } = useFolders();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(currentFolders);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelected(currentFolders);
  }, [currentFolders]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async (folderId) => {
    let newSelected;
    if (selected.includes(folderId)) {
      newSelected = selected.filter(id => id !== folderId);
    } else {
      newSelected = [...selected, folderId];
    }

    setSelected(newSelected);
    await onUpdate(newSelected);
  };

  return (
    <div className="folder-dropdown" ref={dropdownRef}>
      <button
        className="folder-dropdown-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Add to folder"
      >
        <FolderPlus size={18} />
      </button>

      {isOpen && (
        <div className="folder-dropdown-menu">
          <div className="folder-dropdown-header">Add to folder</div>
          <div className="folder-dropdown-list">
            {folders.length === 0 ? (
              <div className="folder-dropdown-empty">No folders</div>
            ) : (
              folders.map(folder => (
                <button
                  key={folder.id}
                  className="folder-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(folder.id);
                  }}
                >
                  <Folder size={16} style={{ color: folder.color }} />
                  <span>{folder.name}</span>
                  {selected.includes(folder.id) && (
                    <Check size={14} className="folder-check" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FolderDropdown;
```

### 4. Style FolderDropdown
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderDropdown.css`:

```css
.folder-dropdown {
  position: relative;
}

.folder-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.folder-dropdown-trigger:hover {
  color: var(--color-primary);
  background: var(--bg-tertiary);
}

.folder-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  margin-top: var(--space-1);
}

.folder-dropdown-header {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
}

.folder-dropdown-list {
  max-height: 200px;
  overflow-y: auto;
}

.folder-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.folder-dropdown-item:hover {
  background: var(--bg-tertiary);
}

.folder-dropdown-item span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-check {
  color: var(--color-primary);
}

.folder-dropdown-empty {
  padding: var(--space-3);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}
```

### 5. Create Index Export
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/index.js`:

```jsx
export { default as FolderList } from './FolderList';
export { default as FolderPicker } from './FolderPicker';
export { default as FolderDropdown } from './FolderDropdown';
export { default as CreateFolderModal } from './CreateFolderModal';
export { default as EditFolderModal } from './EditFolderModal';
```

## Verification
1. FolderPicker shows all folders with checkboxes
2. Selecting/deselecting folders updates state
3. Creating new folder inline works
4. FolderDropdown shows in list items
5. Quick folder assignment works

## Next Steps
Proceed to Task 7 - Subtask 5 (Drag-and-Drop Saves to Folders)

## Estimated Time
2-3 hours
