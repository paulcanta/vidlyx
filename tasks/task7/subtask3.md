# Task 7 - Subtask 3: FolderList Component

## Objective
Build the sidebar folder list component for the collection page.

## Prerequisites
- Task 7 - Subtask 2 completed (Many-to-Many relationships)

## Instructions

### 1. Create FolderList Component
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderList.js`:

```jsx
import React, { useState } from 'react';
import { Folder, FolderOpen, Plus, DotsThree, PencilSimple, Trash } from '@phosphor-icons/react';
import { useFolders } from '../../hooks/useFolders';
import { Menu, MenuItem } from '../ui/Menu';
import CreateFolderModal from './CreateFolderModal';
import EditFolderModal from './EditFolderModal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import './FolderList.css';

function FolderList({ activeFolder, onSelect }) {
  const { folders, loading, createFolder, updateFolder, deleteFolder } = useFolders();
  const [showCreate, setShowCreate] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const handleCreateFolder = async (data) => {
    await createFolder(data);
    setShowCreate(false);
  };

  const handleUpdateFolder = async (id, data) => {
    await updateFolder(id, data);
    setEditingFolder(null);
  };

  const handleDeleteFolder = async () => {
    if (deletingFolder) {
      await deleteFolder(deletingFolder.id);
      setDeletingFolder(null);
      if (activeFolder === deletingFolder.id) {
        onSelect(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="folder-list">
        <div className="folder-list-header">
          <h3>Folders</h3>
        </div>
        <div className="folder-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="folder-item-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="folder-list">
      <div className="folder-list-header">
        <h3>Folders</h3>
        <button
          className="btn-icon"
          onClick={() => setShowCreate(true)}
          title="Create folder"
        >
          <Plus size={18} />
        </button>
      </div>

      <nav className="folder-nav">
        {/* All Saves */}
        <button
          className={`folder-item ${activeFolder === null ? 'active' : ''}`}
          onClick={() => onSelect(null)}
        >
          <Folder size={18} />
          <span>All Saves</span>
        </button>

        {/* Uncategorized */}
        <button
          className={`folder-item ${activeFolder === 'uncategorized' ? 'active' : ''}`}
          onClick={() => onSelect('uncategorized')}
        >
          <Folder size={18} />
          <span>Uncategorized</span>
        </button>

        {/* Divider */}
        {folders.length > 0 && <div className="folder-divider" />}

        {/* User folders */}
        {folders.map(folder => (
          <div
            key={folder.id}
            className={`folder-item ${activeFolder === folder.id ? 'active' : ''}`}
          >
            <button
              className="folder-item-button"
              onClick={() => onSelect(folder.id)}
            >
              {activeFolder === folder.id ? (
                <FolderOpen size={18} style={{ color: folder.color }} />
              ) : (
                <Folder size={18} style={{ color: folder.color }} />
              )}
              <span className="folder-name">{folder.name}</span>
              <span className="folder-count">{folder.save_count}</span>
            </button>

            <Menu
              trigger={
                <button
                  className="folder-menu-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === folder.id ? null : folder.id);
                  }}
                >
                  <DotsThree size={16} />
                </button>
              }
              open={menuOpen === folder.id}
              onClose={() => setMenuOpen(null)}
            >
              <MenuItem
                icon={<PencilSimple size={16} />}
                onClick={() => {
                  setEditingFolder(folder);
                  setMenuOpen(null);
                }}
              >
                Edit
              </MenuItem>
              <MenuItem
                icon={<Trash size={16} />}
                variant="danger"
                onClick={() => {
                  setDeletingFolder(folder);
                  setMenuOpen(null);
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </div>
        ))}
      </nav>

      {/* Create Modal */}
      {showCreate && (
        <CreateFolderModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {/* Edit Modal */}
      {editingFolder && (
        <EditFolderModal
          folder={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSave={(data) => handleUpdateFolder(editingFolder.id, data)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingFolder && (
        <DeleteConfirmModal
          title="Delete Folder"
          message={`Are you sure you want to delete "${deletingFolder.name}"? Saves in this folder will not be deleted.`}
          onConfirm={handleDeleteFolder}
          onCancel={() => setDeletingFolder(null)}
        />
      )}
    </div>
  );
}

export default FolderList;
```

### 2. Create CreateFolderModal
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/CreateFolderModal.js`:

```jsx
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ColorPicker from '../ui/ColorPicker';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#64748b'  // Slate
];

function CreateFolderModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreate({ name: name.trim(), color });
    } catch (err) {
      setError(err.message || 'Failed to create folder');
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Folder" onClose={onClose}>
      <form onSubmit={handleSubmit} className="create-folder-form">
        <Input
          label="Folder Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter folder name"
          autoFocus
          error={error}
        />

        <div className="form-group">
          <label>Color</label>
          <ColorPicker
            colors={PRESET_COLORS}
            selected={color}
            onChange={setColor}
          />
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Create Folder
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateFolderModal;
```

### 3. Create EditFolderModal
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/EditFolderModal.js`:

```jsx
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ColorPicker from '../ui/ColorPicker';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#64748b'
];

function EditFolderModal({ folder, onClose, onSave }) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({ name: name.trim(), color });
    } catch (err) {
      setError(err.message || 'Failed to update folder');
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Folder" onClose={onClose}>
      <form onSubmit={handleSubmit} className="edit-folder-form">
        <Input
          label="Folder Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />

        <div className="form-group">
          <label>Color</label>
          <ColorPicker
            colors={PRESET_COLORS}
            selected={color}
            onChange={setColor}
          />
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditFolderModal;
```

### 4. Create ColorPicker Component
Create `/home/pgc/vidlyx/dashboard/src/components/ui/ColorPicker.js`:

```jsx
import React from 'react';
import { Check } from '@phosphor-icons/react';
import './ColorPicker.css';

function ColorPicker({ colors, selected, onChange }) {
  return (
    <div className="color-picker">
      {colors.map(color => (
        <button
          key={color}
          type="button"
          className={`color-option ${selected === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        >
          {selected === color && <Check size={14} weight="bold" />}
        </button>
      ))}
    </div>
  );
}

export default ColorPicker;
```

### 5. Style FolderList
Create `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderList.css`:

```css
.folder-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.folder-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
}

.folder-list-header h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.folder-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.folder-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.folder-item:hover {
  background: var(--bg-tertiary);
}

.folder-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.folder-item-button {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
}

.folder-menu-trigger {
  opacity: 0;
  padding: var(--space-1);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
}

.folder-item:hover .folder-menu-trigger {
  opacity: 1;
}

.folder-menu-trigger:hover {
  background: var(--bg-secondary);
}

.folder-divider {
  height: 1px;
  background: var(--border-color);
  margin: var(--space-2) var(--space-3);
}

.folder-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-3);
}

.folder-item-skeleton {
  height: 36px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 6. Style ColorPicker
Create `/home/pgc/vidlyx/dashboard/src/components/ui/ColorPicker.css`:

```css
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.color-option {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px currentColor;
}
```

## Verification
1. Folder list shows all user folders
2. "All Saves" and "Uncategorized" options work
3. Create new folder with name and color
4. Edit folder name and color
5. Delete folder with confirmation
6. Active folder is highlighted

## Next Steps
Proceed to Task 7 - Subtask 4 (FolderPicker Component)

## Estimated Time
2-3 hours
