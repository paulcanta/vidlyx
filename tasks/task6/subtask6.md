# Task 6 - Subtask 6: Collection Page with Grid/List Views

## Objective
Build the main collection page with multiple view modes and filtering.

## Prerequisites
- Task 6 - Subtask 5 completed (Save detail view)

## Instructions

### 1. Create Collection Page
Create `/home/pgc/vidlyx/dashboard/src/pages/app/Collection.js`:

```jsx
function Collection() {
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const { saves, total, loading, refetch } = useSaves(filters, sortBy);
  const { folders } = useFolders();

  return (
    <div className="collection-page">
      <div className="collection-layout">
        {/* Sidebar with folders */}
        <aside className="collection-sidebar">
          <FolderList
            folders={folders}
            activeFolder={filters.folderId}
            onSelect={(folderId) => setFilters({ ...filters, folderId })}
          />
        </aside>

        {/* Main content */}
        <main className="collection-main">
          <div className="collection-header">
            <h2>
              {filters.folderId
                ? folders.find(f => f.id === filters.folderId)?.name
                : 'All Saves'}
            </h2>
            <span className="count">{total} saves</span>
          </div>

          <div className="collection-toolbar">
            <SearchInput
              placeholder="Search saves..."
              value={filters.searchQuery || ''}
              onChange={(q) => setFilters({ ...filters, searchQuery: q })}
            />

            <div className="toolbar-actions">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Newest</option>
                <option value="updated_at">Recently Updated</option>
                <option value="title">Title A-Z</option>
              </select>

              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <GridFour />
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <List />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <SavesSkeleton viewMode={viewMode} />
          ) : saves.length === 0 ? (
            <EmptyState
              icon={<BookmarkSimple size={48} />}
              title="No saves yet"
              description="Save frames and transcript selections from videos"
              action={<Link to="/app/new">Analyze a Video</Link>}
            />
          ) : viewMode === 'grid' ? (
            <SaveGrid saves={saves} />
          ) : (
            <SaveList saves={saves} />
          )}
        </main>
      </div>
    </div>
  );
}
```

### 2. Create SaveGrid Component
```jsx
function SaveGrid({ saves, onSelect }) {
  return (
    <div className="save-grid">
      {saves.map(save => (
        <SaveCard key={save.id} save={save} onClick={() => onSelect(save)} />
      ))}
    </div>
  );
}

function SaveCard({ save, onClick }) {
  const navigate = useNavigate();

  return (
    <div
      className="save-card"
      onClick={() => navigate(`/app/collection/save/${save.id}`)}
    >
      <div className="save-card-thumbnail">
        {save.frames?.[0] ? (
          <img src={`/api/frames/${save.frames[0].id}/image`} alt="" />
        ) : (
          <div className="no-thumbnail">
            <TextT size={32} />
          </div>
        )}
        {save.frame_count > 1 && (
          <span className="frame-count">+{save.frame_count - 1}</span>
        )}
      </div>

      <div className="save-card-content">
        <h4>{save.title || save.auto_title}</h4>
        <p className="video-title">{save.video_title}</p>
        <span className="date">{formatDate(save.created_at)}</span>
      </div>
    </div>
  );
}
```

### 3. Create SaveList Component
```jsx
function SaveList({ saves }) {
  const navigate = useNavigate();

  return (
    <div className="save-list">
      {saves.map(save => (
        <div
          key={save.id}
          className="save-list-item"
          onClick={() => navigate(`/app/collection/save/${save.id}`)}
        >
          <div className="list-thumbnail">
            {save.frames?.[0] && (
              <img src={`/api/frames/${save.frames[0].id}/image`} alt="" />
            )}
          </div>
          <div className="list-content">
            <h4>{save.title || save.auto_title}</h4>
            <p className="video-title">{save.video_title}</p>
          </div>
          <div className="list-meta">
            <span>{save.frame_count} frames</span>
            <span>{save.transcript_count} selections</span>
          </div>
          <div className="list-date">
            {formatDate(save.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 4. Style Collection Page
```css
.collection-layout {
  display: flex;
  height: calc(100vh - var(--header-height));
}

.collection-sidebar {
  width: 250px;
  border-right: 1px solid var(--border-color);
  padding: var(--space-4);
}

.collection-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.collection-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.save-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-4);
}

.save-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.save-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.save-card-thumbnail {
  aspect-ratio: 16/9;
  background: var(--bg-tertiary);
  position: relative;
}

.save-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.save-list-item:hover {
  background: var(--bg-tertiary);
}

.list-thumbnail {
  width: 120px;
  flex-shrink: 0;
}
```

## Verification
1. View saves in grid mode
2. Switch to list mode
3. Filter by folder
4. Search saves
5. Sort by different criteria

## Next Steps
Task 6 Complete! Proceed to Task 7 - Subtask 1 (Folder CRUD Operations)

## Estimated Time
3-4 hours
