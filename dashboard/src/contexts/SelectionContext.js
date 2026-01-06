import React, { createContext, useContext, useState, useMemo } from 'react';

const SelectionContext = createContext(null);

export function SelectionProvider({ children }) {
  const [selectedFrames, setSelectedFrames] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  /**
   * Toggle frame selection
   * @param {Object} frame - Frame object to toggle
   */
  const toggleFrameSelection = (frame) => {
    setSelectedFrames((prev) => {
      const index = prev.findIndex((f) => f.id === frame.id);
      if (index >= 0) {
        // Remove if already selected
        return prev.filter((f) => f.id !== frame.id);
      } else {
        // Add if not selected
        return [...prev, frame];
      }
    });
  };

  /**
   * Add transcript selection
   * @param {Object} selection - { start, end, text }
   */
  const addTranscriptSelection = (selection) => {
    setSelectedTranscript((prev) => [...prev, selection]);
  };

  /**
   * Remove transcript selection by index
   * @param {number} index - Index to remove
   */
  const removeTranscriptSelection = (index) => {
    setSelectedTranscript((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Clear all selections
   */
  const clearSelection = () => {
    setSelectedFrames([]);
    setSelectedTranscript([]);
  };

  /**
   * Check if there are any selections
   */
  const hasSelection = useMemo(() => {
    return selectedFrames.length > 0 || selectedTranscript.length > 0;
  }, [selectedFrames.length, selectedTranscript.length]);

  const value = {
    selectedFrames,
    selectedTranscript,
    selectionMode,
    setSelectionMode,
    toggleFrameSelection,
    addTranscriptSelection,
    removeTranscriptSelection,
    clearSelection,
    hasSelection
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
