# Task 6 - Subtask 5: Save Detail View

## Objective
Create a detailed view page for individual saves.

## Prerequisites
- Task 6 - Subtask 4 completed (Content selection)

## Instructions

### 1. Create SaveDetail Page
Create `/home/pgc/vidlyx/dashboard/src/pages/app/SaveView.js`:

```jsx
function SaveView() {
  const { saveId } = useParams();
  const [save, setSave] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchSave();
  }, [saveId]);

  const fetchSave = async () => {
    const response = await saveService.getById(saveId);
    setSave(response.data);
  };

  if (!save) return <Loading />;

  return (
    <div className="save-view">
      <div className="save-header">
        <div className="breadcrumb">
          <Link to="/app/collection">Collection</Link>
          <ChevronRight />
          <span>{save.title}</span>
        </div>

        <div className="header-actions">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <PencilSimple /> Edit
          </Button>
          <Button variant="ghost">
            <Export /> Export
          </Button>
          <DeleteButton onDelete={() => handleDelete(save.id)} />
        </div>
      </div>

      <div className="save-content">
        {/* Source video info */}
        <section className="source-video">
          <img src={save.thumbnail_url} alt="" />
          <div>
            <h3>{save.video_title}</h3>
            <Link to={`/app/video/${save.video_id}`}>
              View Full Analysis
            </Link>
          </div>
        </section>

        {/* Saved frames */}
        {save.frames?.length > 0 && (
          <section className="saved-frames">
            <h3>Frames ({save.frames.length})</h3>
            <div className="frame-grid">
              {save.frames.map(frame => (
                <div key={frame.id} className="saved-frame">
                  <img src={`/api/frames/${frame.id}/image`} alt="" />
                  <span className="timestamp">
                    {formatTimestamp(frame.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved transcript selections */}
        {save.transcript_selections?.length > 0 && (
          <section className="saved-transcripts">
            <h3>Transcript Selections</h3>
            {save.transcript_selections.map((sel, i) => (
              <blockquote key={i} className="transcript-quote">
                <span className="quote-time">
                  [{formatTimestamp(sel.start)} - {formatTimestamp(sel.end)}]
                </span>
                <p>{sel.text}</p>
              </blockquote>
            ))}
          </section>
        )}

        {/* Notes */}
        {save.notes && (
          <section className="save-notes">
            <h3>Notes</h3>
            <p>{save.notes}</p>
          </section>
        )}

        {/* Metadata */}
        <section className="save-metadata">
          <div className="meta-item">
            <label>Created</label>
            <span>{formatDate(save.created_at)}</span>
          </div>
          <div className="meta-item">
            <label>Folders</label>
            <div className="folder-badges">
              {save.folders?.map(folder => (
                <Link key={folder.id} to={`/app/collection/folder/${folder.id}`}>
                  <Folder size={14} /> {folder.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {editing && (
        <SaveEditModal
          save={save}
          onSave={(updated) => {
            setSave(updated);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
```

### 2. Create SaveEditModal
```jsx
function SaveEditModal({ save, onSave, onClose }) {
  const [title, setTitle] = useState(save.title);
  const [notes, setNotes] = useState(save.notes || '');
  const [folders, setFolders] = useState(save.folder_ids || []);

  const handleSave = async () => {
    const updated = await saveService.update(save.id, {
      title,
      notes,
      folders
    });
    onSave(updated.data);
  };

  return (
    <Modal onClose={onClose} title="Edit Save">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <FolderPicker
        selected={folders}
        onChange={setFolders}
      />
      <Button onClick={handleSave}>Save Changes</Button>
    </Modal>
  );
}
```

### 3. Style SaveView
```css
.save-view {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-6);
}

.save-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.source-video {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-6);
}

.source-video img {
  width: 160px;
  border-radius: var(--border-radius-sm);
}

.frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.saved-frame img {
  width: 100%;
  border-radius: var(--border-radius-sm);
}

.transcript-quote {
  background: var(--bg-tertiary);
  padding: var(--space-4);
  border-left: 3px solid var(--color-primary);
  margin-bottom: var(--space-3);
}
```

### 4. Add Route
```jsx
<Route path="collection/save/:saveId" element={<SaveView />} />
```

## Verification
1. Navigate to save detail page
2. View all saved content (frames, text)
3. Edit save metadata
4. Navigate to source video

## Next Steps
Proceed to Task 6 - Subtask 6 (Collection Page with Grid/List Views)

## Estimated Time
2-3 hours
