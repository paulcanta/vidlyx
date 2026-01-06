import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';

const DragDropContext = createContext(null);

/**
 * SaveDragPreview - Preview component shown when dragging a save
 */
function SaveDragPreview({ save }) {
  if (!save) return null;

  return (
    <div className="save-drag-preview">
      <div style={styles.preview}>
        <span style={styles.previewTitle}>{save.title || 'Untitled Save'}</span>
        <span style={styles.previewVideo}>{save.videoTitle || save.video_title}</span>
      </div>
    </div>
  );
}

/**
 * DragDropProvider - Manages drag and drop state for saves to folders
 * @param {Function} onDrop - Called when a save is dropped: { saveId, saveData, folderId, folderData }
 */
export function DragDropProvider({ children, onDrop }) {
  const [activeItem, setActiveItem] = useState(null);
  const [overId, setOverId] = useState(null);

  // Configure pointer sensor with distance threshold to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const handleDragStart = useCallback((event) => {
    const { active } = event;

    // Store the active item data
    if (active.data.current) {
      setActiveItem(active.data.current);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    const { over } = event;
    setOverId(over?.id || null);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    // If dropped on a valid target
    if (over && active.data.current && over.data.current) {
      const saveData = active.data.current;
      const folderData = over.data.current;

      // Call the onDrop callback
      if (onDrop) {
        onDrop({
          saveId: active.id,
          saveData,
          folderId: over.id,
          folderData
        });
      }
    }

    // Reset state
    setActiveItem(null);
    setOverId(null);
  }, [onDrop]);

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    setOverId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <DragDropContext.Provider value={{ activeItem, overId }}>
        {children}
      </DragDropContext.Provider>

      <DragOverlay>
        {activeItem ? <SaveDragPreview save={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Hook to access drag-drop context
 */
export function useDragDropContext() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDropContext must be used within DragDropProvider');
  }
  return context;
}

const styles = {
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    minWidth: '200px',
    maxWidth: '300px'
  },
  previewTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  previewVideo: {
    fontSize: '0.75rem',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
};
