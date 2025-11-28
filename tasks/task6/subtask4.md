# Task 6 - Subtask 4: ContentSelector Component

## Objective
Build selection UI for frames and transcript text to be saved.

## Prerequisites
- Task 6 - Subtask 3 completed (SaveCreator)

## Instructions

### 1. Create Selection Context
```jsx
// contexts/SelectionContext.js
const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [selectedFrames, setSelectedFrames] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const toggleFrameSelection = (frame) => {
    setSelectedFrames(prev =>
      prev.find(f => f.id === frame.id)
        ? prev.filter(f => f.id !== frame.id)
        : [...prev, frame]
    );
  };

  const addTranscriptSelection = (selection) => {
    setSelectedTranscript(prev => [...prev, selection]);
  };

  const clearSelection = () => {
    setSelectedFrames([]);
    setSelectedTranscript([]);
  };

  return (
    <SelectionContext.Provider value={{
      selectedFrames,
      selectedTranscript,
      selectionMode,
      setSelectionMode,
      toggleFrameSelection,
      addTranscriptSelection,
      clearSelection,
      hasSelection: selectedFrames.length > 0 || selectedTranscript.length > 0
    }}>
      {children}
    </SelectionContext.Provider>
  );
}
```

### 2. Frame Selection Mode
Update FrameCard to support selection:

```jsx
function FrameCard({ frame, onSeek }) {
  const { selectionMode, selectedFrames, toggleFrameSelection } = useSelection();
  const isSelected = selectedFrames.find(f => f.id === frame.id);

  return (
    <div
      className={`frame-card ${isSelected ? 'selected' : ''}`}
      onClick={() => {
        if (selectionMode) {
          toggleFrameSelection(frame);
        } else {
          onSeek(frame.timestamp_seconds);
        }
      }}
    >
      {selectionMode && (
        <div className="selection-checkbox">
          {isSelected ? <CheckSquare /> : <Square />}
        </div>
      )}
      {/* rest of frame content */}
    </div>
  );
}
```

### 3. Transcript Selection
Enable text selection in transcript:

```jsx
function TranscriptSegment({ segment, videoId }) {
  const { addTranscriptSelection, selectionMode } = useSelection();
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 5) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setPopupPosition({ x: rect.left, y: rect.top - 40 });
      setShowSavePopup(true);
    }
  };

  const handleSaveSelection = () => {
    const selection = window.getSelection();
    addTranscriptSelection({
      start: segment.start,
      end: segment.end,
      text: selection.toString()
    });
    selection.removeAllRanges();
    setShowSavePopup(false);
    showToast('Text added to selection');
  };

  return (
    <div className="transcript-segment" onMouseUp={handleMouseUp}>
      {/* segment content */}

      {showSavePopup && (
        <div
          className="selection-popup"
          style={{ left: popupPosition.x, top: popupPosition.y }}
        >
          <button onClick={handleSaveSelection}>
            <BookmarkSimple /> Add to Save
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4. Selection Toolbar
```jsx
function SelectionToolbar() {
  const {
    selectedFrames,
    selectedTranscript,
    selectionMode,
    setSelectionMode,
    clearSelection,
    hasSelection
  } = useSelection();
  const [showSaveCreator, setShowSaveCreator] = useState(false);

  return (
    <div className={`selection-toolbar ${hasSelection ? 'visible' : ''}`}>
      <div className="selection-info">
        <span>{selectedFrames.length} frames</span>
        <span>{selectedTranscript.length} text selections</span>
      </div>

      <div className="selection-actions">
        <Button
          variant="ghost"
          size="small"
          onClick={() => setSelectionMode(!selectionMode)}
        >
          {selectionMode ? <X /> : <CheckSquare />}
          {selectionMode ? 'Exit Selection' : 'Select Mode'}
        </Button>

        <Button variant="ghost" size="small" onClick={clearSelection}>
          Clear
        </Button>

        <Button
          variant="primary"
          size="small"
          onClick={() => setShowSaveCreator(true)}
          disabled={!hasSelection}
        >
          <BookmarkSimple /> Save ({selectedFrames.length + selectedTranscript.length})
        </Button>
      </div>
    </div>
  );
}
```

### 5. Style Selection UI
```css
.frame-card.selected {
  ring: 2px solid var(--color-primary);
}

.selection-checkbox {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  background: white;
  border-radius: 4px;
  padding: 2px;
}

.selection-popup {
  position: fixed;
  background: var(--bg-primary);
  box-shadow: var(--shadow-lg);
  border-radius: var(--border-radius-sm);
  padding: var(--space-1);
  z-index: var(--z-dropdown);
}

.selection-toolbar {
  position: fixed;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--bg-primary);
  box-shadow: var(--shadow-lg);
  border-radius: var(--border-radius-lg);
  padding: var(--space-2) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: transform var(--transition-normal);
}

.selection-toolbar.visible {
  transform: translateX(-50%) translateY(0);
}
```

## Verification
1. Enable selection mode, select multiple frames
2. Highlight transcript text, click save
3. Selection toolbar appears with count
4. Clear selection works

## Next Steps
Proceed to Task 6 - Subtask 5 (Save Detail View)

## Estimated Time
2-3 hours
