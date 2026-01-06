import React from 'react';
import { CheckSquare, X, BookmarkSimple } from '@phosphor-icons/react';
import { useSelection } from '../../contexts/SelectionContext';

/**
 * SelectionToolbar Component
 * Fixed toolbar at bottom showing selection status and actions
 */
function SelectionToolbar({ onSaveClick }) {
  const {
    selectedFrames,
    selectedTranscript,
    selectionMode,
    setSelectionMode,
    clearSelection,
    hasSelection
  } = useSelection();

  return (
    <div className={`selection-toolbar ${hasSelection ? 'visible' : ''}`}>
      <div className="toolbar-content">
        {/* Selection Summary */}
        <div className="selection-summary">
          <span className="selection-count">
            {selectedFrames.length} frame{selectedFrames.length !== 1 ? 's' : ''}
            {selectedFrames.length > 0 && selectedTranscript.length > 0 && ', '}
            {selectedTranscript.length > 0 && (
              <>
                {selectedTranscript.length} text selection{selectedTranscript.length !== 1 ? 's' : ''}
              </>
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="toolbar-actions">
          {/* Toggle Selection Mode */}
          <button
            className={`toolbar-btn ${selectionMode ? 'active' : ''}`}
            onClick={() => setSelectionMode(!selectionMode)}
            title={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
          >
            <CheckSquare size={20} weight={selectionMode ? 'fill' : 'regular'} />
            {selectionMode ? 'Exit Selection' : 'Select Frames'}
          </button>

          {/* Clear Selection */}
          <button
            className="toolbar-btn clear-btn"
            onClick={clearSelection}
            title="Clear selection"
          >
            <X size={20} />
            Clear
          </button>

          {/* Save Button */}
          <button
            className="toolbar-btn save-btn"
            onClick={onSaveClick}
            title="Save selection"
          >
            <BookmarkSimple size={20} weight="fill" />
            Save
          </button>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .selection-toolbar {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    transition: transform 0.3s ease;
    z-index: 100;
  }

  .selection-toolbar.visible {
    transform: translateX(-50%) translateY(0);
  }

  .toolbar-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    border: 1px solid #e5e7eb;
  }

  .selection-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .selection-count {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toolbar-btn:hover {
    background: #e5e7eb;
  }

  .toolbar-btn.active {
    background: #dbeafe;
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  .toolbar-btn.clear-btn:hover {
    background: #fee2e2;
    border-color: #fecaca;
    color: #dc2626;
  }

  .toolbar-btn.save-btn {
    background: #2563eb;
    border-color: #2563eb;
    color: white;
  }

  .toolbar-btn.save-btn:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .toolbar-content {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
    }

    .toolbar-actions {
      width: 100%;
      justify-content: space-between;
    }

    .toolbar-btn {
      flex: 1;
      justify-content: center;
      padding: 0.5rem;
      font-size: 0.75rem;
    }
  }
`;

export default SelectionToolbar;
