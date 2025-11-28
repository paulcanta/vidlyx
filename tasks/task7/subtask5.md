# Task 7 - Subtask 5: Drag-and-Drop Saves to Folders

## Objective
Implement drag-and-drop functionality to organize saves into folders.

## Prerequisites
- Task 7 - Subtask 4 completed (FolderPicker Component)

## Instructions

### 1. Install DnD Library
```bash
cd /home/pgc/vidlyx/dashboard
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. Create DnD Context Provider
Create `/home/pgc/vidlyx/dashboard/src/contexts/DragDropContext.js`:

```jsx
import React, { createContext, useContext, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';

const DragDropContext = createContext();

export function DragDropProvider({ children, onDrop }) {
  const [activeItem, setActiveItem] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Minimum drag distance before activation
      }
    })
  );

  const handleDragStart = (event) => {
    setActiveItem(event.active.data.current);
  };

  const handleDragOver = (event) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onDrop({
        saveId: active.id,
        saveData: active.data.current,
        folderId: over.id,
        folderData: over.data.current
      });
    }

    setActiveItem(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    setOverId(null);
  };

  return (
    <DragDropContext.Provider value={{ activeItem, overId }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay>
          {activeItem && (
            <SaveDragPreview save={activeItem} />
          )}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
}

export function useDragDropContext() {
  return useContext(DragDropContext);
}

// Drag preview component
function SaveDragPreview({ save }) {
  return (
    <div className="save-drag-preview">
      {save.frames?.[0] ? (
        <img
          src={`/api/frames/${save.frames[0].id}/image`}
          alt=""
          className="drag-preview-thumbnail"
        />
      ) : (
        <div className="drag-preview-placeholder" />
      )}
      <span className="drag-preview-title">
        {save.title || save.auto_title || 'Untitled Save'}
      </span>
    </div>
  );
}
```

### 3. Create Draggable Save Card
Create `/home/pgc/vidlyx/dashboard/src/components/Save/DraggableSaveCard.js`:

```jsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import SaveCard from './SaveCard';

function DraggableSaveCard({ save, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: save.id,
    data: save
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <SaveCard save={save} {...props} />
    </div>
  );
}

export default DraggableSaveCard;
```

### 4. Create Droppable Folder Item
Update `/home/pgc/vidlyx/dashboard/src/components/Folder/DroppableFolderItem.js`:

```jsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Folder, FolderOpen } from '@phosphor-icons/react';
import { useDragDropContext } from '../../contexts/DragDropContext';

function DroppableFolderItem({ folder, isActive, onClick, children }) {
  const { overId } = useDragDropContext();
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: folder
  });

  const isDropTarget = isOver || overId === folder.id;

  return (
    <div
      ref={setNodeRef}
      className={`folder-item ${isActive ? 'active' : ''} ${isDropTarget ? 'drop-target' : ''}`}
      onClick={onClick}
    >
      {isActive ? (
        <FolderOpen size={18} style={{ color: folder.color }} />
      ) : (
        <Folder size={18} style={{ color: folder.color }} />
      )}
      <span className="folder-name">{folder.name}</span>
      <span className="folder-count">{folder.save_count}</span>
      {children}
    </div>
  );
}

export default DroppableFolderItem;
```

### 5. Update FolderList with Droppable
Update `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderList.js`:

```jsx
import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Folder, FolderOpen, Plus, DotsThree } from '@phosphor-icons/react';
import { useFolders } from '../../hooks/useFolders';
import { useDragDropContext } from '../../contexts/DragDropContext';
import DroppableFolderItem from './DroppableFolderItem';
// ... other imports

function DroppableNavItem({ id, isActive, onClick, icon, label, count }) {
  const { overId } = useDragDropContext();
  const { setNodeRef, isOver } = useDroppable({ id, data: { id, type: 'nav' } });
  const isDropTarget = isOver || overId === id;

  return (
    <button
      ref={setNodeRef}
      className={`folder-item ${isActive ? 'active' : ''} ${isDropTarget ? 'drop-target' : ''}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && <span className="folder-count">{count}</span>}
    </button>
  );
}

function FolderList({ activeFolder, onSelect }) {
  const { folders, loading, createFolder, updateFolder, deleteFolder } = useFolders();
  // ... existing state

  return (
    <div className="folder-list">
      {/* ... header */}

      <nav className="folder-nav">
        {/* All Saves - not droppable */}
        <button
          className={`folder-item ${activeFolder === null ? 'active' : ''}`}
          onClick={() => onSelect(null)}
        >
          <Folder size={18} />
          <span>All Saves</span>
        </button>

        {/* Uncategorized - droppable for removing from folders */}
        <DroppableNavItem
          id="uncategorized"
          isActive={activeFolder === 'uncategorized'}
          onClick={() => onSelect('uncategorized')}
          icon={<Folder size={18} />}
          label="Uncategorized"
        />

        {folders.length > 0 && <div className="folder-divider" />}

        {/* User folders - droppable */}
        {folders.map(folder => (
          <DroppableFolderItem
            key={folder.id}
            folder={folder}
            isActive={activeFolder === folder.id}
            onClick={() => onSelect(folder.id)}
          >
            {/* Menu button */}
          </DroppableFolderItem>
        ))}
      </nav>

      {/* ... modals */}
    </div>
  );
}

export default FolderList;
```

### 6. Update Collection Page with DnD
Update `/home/pgc/vidlyx/dashboard/src/pages/app/Collection.js`:

```jsx
import React, { useState } from 'react';
import { DragDropProvider } from '../../contexts/DragDropContext';
import { useSaves } from '../../hooks/useSaves';
import { useFolders } from '../../hooks/useFolders';
import saveService from '../../services/saveService';
import { showToast } from '../../utils/toast';
import FolderList from '../../components/Folder/FolderList';
import DraggableSaveCard from '../../components/Save/DraggableSaveCard';
// ... other imports

function Collection() {
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const { saves, total, loading, refetch } = useSaves(filters, sortBy);
  const { folders, refetch: refetchFolders } = useFolders();

  const handleDrop = async ({ saveId, folderId, folderData }) => {
    try {
      if (folderId === 'uncategorized') {
        // Remove from all folders
        await saveService.setFolders(saveId, []);
        showToast('Save removed from all folders');
      } else {
        // Add to specific folder
        await saveService.addToFolders(saveId, [folderId]);
        showToast(`Added to "${folderData.name}"`);
      }

      refetch();
      refetchFolders();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <DragDropProvider onDrop={handleDrop}>
      <div className="collection-page">
        <div className="collection-layout">
          <aside className="collection-sidebar">
            <FolderList
              folders={folders}
              activeFolder={filters.folderId}
              onSelect={(folderId) => setFilters({ ...filters, folderId })}
            />
          </aside>

          <main className="collection-main">
            {/* ... header and toolbar */}

            {loading ? (
              <SavesSkeleton viewMode={viewMode} />
            ) : saves.length === 0 ? (
              <EmptyState /* ... */ />
            ) : viewMode === 'grid' ? (
              <div className="save-grid">
                {saves.map(save => (
                  <DraggableSaveCard key={save.id} save={save} />
                ))}
              </div>
            ) : (
              <SaveList saves={saves} />
            )}
          </main>
        </div>
      </div>
    </DragDropProvider>
  );
}

export default Collection;
```

### 7. Add DnD Styles
Add to `/home/pgc/vidlyx/dashboard/src/components/Folder/FolderList.css`:

```css
/* Drop target highlight */
.folder-item.drop-target {
  background: var(--color-primary-light);
  border: 2px dashed var(--color-primary);
}

/* Drag preview styles */
.save-drag-preview {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  max-width: 250px;
}

.drag-preview-thumbnail {
  width: 48px;
  height: 27px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
}

.drag-preview-placeholder {
  width: 48px;
  height: 27px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.drag-preview-title {
  font-size: var(--text-sm);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

## Verification
1. Drag a save card toward a folder
2. Folder highlights when dragging over
3. Dropping adds save to folder
4. Dropping on "Uncategorized" removes from all folders
5. Folder save counts update after drop
6. Drag preview shows save thumbnail and title

## Next Steps
Proceed to Task 7 - Subtask 6 (Tag System Implementation)

## Estimated Time
3-4 hours
