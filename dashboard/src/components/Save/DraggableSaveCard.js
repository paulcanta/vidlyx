import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import SaveCard from '../Collection/SaveCard';

/**
 * DraggableSaveCard - Wraps SaveCard with drag functionality
 * @param {Object} save - Save object
 */
function DraggableSaveCard({ save }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging
  } = useDraggable({
    id: save.id,
    data: save // Store save data for access during drag
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'opacity 0.2s'
      }}
    >
      <SaveCard save={save} />
    </div>
  );
}

export default DraggableSaveCard;
