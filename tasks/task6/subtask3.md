# Task 6 - Subtask 3: SaveCreator Component

## Objective
Build the UI component for creating saves from video analysis page.

## Prerequisites
- Task 6 - Subtask 2 completed (Save API operations)

## Instructions

### 1. Create SaveCreator Modal
Create `/home/pgc/vidlyx/dashboard/src/components/Save/SaveCreator.js`:

```jsx
function SaveCreator({ videoId, selectedContent, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveData = {
        videoId,
        title: title || undefined,
        notes,
        frames: selectedContent.frames.map(f => f.id),
        transcriptSelections: selectedContent.transcriptSelections,
        summaryExcerpts: selectedContent.summaryExcerpts,
        folders: selectedFolders,
        tags: selectedTags
      };

      const save = await saveService.create(saveData);
      onSave(save);
      showToast('Save created!', 'success');
      onClose();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Save to Collection">
      <div className="save-creator">
        {/* Preview of selected content */}
        <div className="selected-preview">
          {selectedContent.frames.length > 0 && (
            <div className="preview-section">
              <h4>Frames ({selectedContent.frames.length})</h4>
              <div className="frame-preview-grid">
                {selectedContent.frames.slice(0, 4).map(frame => (
                  <img key={frame.id} src={`/api/frames/${frame.id}/image`} />
                ))}
                {selectedContent.frames.length > 4 && (
                  <span>+{selectedContent.frames.length - 4} more</span>
                )}
              </div>
            </div>
          )}

          {selectedContent.transcriptSelections.length > 0 && (
            <div className="preview-section">
              <h4>Transcript Selections</h4>
              {selectedContent.transcriptSelections.map((sel, i) => (
                <p key={i} className="transcript-preview">
                  <span className="time">[{formatTimestamp(sel.start)}]</span>
                  {sel.text.substring(0, 100)}...
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Save form */}
        <div className="save-form">
          <Input
            label="Title (optional)"
            placeholder="Auto-generated if empty"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Notes"
            placeholder="Add notes about this save..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          <div className="form-group">
            <label>Add to Folders</label>
            <FolderPicker
              selected={selectedFolders}
              onChange={setSelectedFolders}
              allowCreate
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <TagPicker
              selected={selectedTags}
              onChange={setSelectedTags}
              allowCreate
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={selectedContent.frames.length === 0 &&
                      selectedContent.transcriptSelections.length === 0}
          >
            <BookmarkSimple /> Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

### 2. Create FolderPicker Component
```jsx
function FolderPicker({ selected, onChange, allowCreate }) {
  const { folders } = useFolders();
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleToggleFolder = (folderId) => {
    if (selected.includes(folderId)) {
      onChange(selected.filter(id => id !== folderId));
    } else {
      onChange([...selected, folderId]);
    }
  };

  const handleCreateFolder = async () => {
    const folder = await folderService.create({ name: newFolderName });
    onChange([...selected, folder.id]);
    setNewFolderName('');
    setShowCreate(false);
  };

  return (
    <div className="folder-picker">
      <div className="folder-list">
        {folders.map(folder => (
          <label key={folder.id} className="folder-option">
            <input
              type="checkbox"
              checked={selected.includes(folder.id)}
              onChange={() => handleToggleFolder(folder.id)}
            />
            <Folder size={16} />
            <span>{folder.name}</span>
          </label>
        ))}
      </div>

      {allowCreate && (
        showCreate ? (
          <div className="create-folder-inline">
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <Button size="small" onClick={handleCreateFolder}>Add</Button>
            <Button size="small" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <button className="add-folder-btn" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Folder
          </button>
        )
      )}
    </div>
  );
}
```

### 3. Style SaveCreator
```css
.save-creator {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.selected-preview {
  background: var(--bg-tertiary);
  padding: var(--space-3);
  border-radius: var(--border-radius-md);
  max-height: 200px;
  overflow-y: auto;
}

.frame-preview-grid {
  display: flex;
  gap: var(--space-2);
}

.frame-preview-grid img {
  width: 80px;
  height: 45px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
}

.folder-picker {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: var(--space-2);
}

.folder-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  cursor: pointer;
}

.folder-option:hover {
  background: var(--bg-tertiary);
}
```

### 4. Integrate with Video Analysis
Add save trigger to video analysis page:

```jsx
const [selectedContent, setSelectedContent] = useState({
  frames: [],
  transcriptSelections: [],
  summaryExcerpts: []
});
const [showSaveCreator, setShowSaveCreator] = useState(false);

// Save button in header
<Button onClick={() => setShowSaveCreator(true)} disabled={!hasSelection}>
  <BookmarkSimple /> Save Selected
</Button>

{showSaveCreator && (
  <SaveCreator
    videoId={video.id}
    selectedContent={selectedContent}
    onSave={() => setSelectedContent({ frames: [], transcriptSelections: [], summaryExcerpts: [] })}
    onClose={() => setShowSaveCreator(false)}
  />
)}
```

## Verification
1. Select frames and transcript, click Save
2. Preview shows selected content
3. Can add to multiple folders
4. Save is created with all content

## Next Steps
Proceed to Task 6 - Subtask 4 (ContentSelector Component)

## Estimated Time
3-4 hours
