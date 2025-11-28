# Task 7 - Subtask 2: Many-to-Many Save-Folder Relationships

## Objective
Implement the junction table and API endpoints for managing save-folder relationships.

## Prerequisites
- Task 7 - Subtask 1 completed (Folder CRUD)

## Instructions

### 1. Verify Junction Table Schema
Ensure the save_folders table exists:

```sql
CREATE TABLE IF NOT EXISTS save_folders (
  save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (save_id, folder_id)
);

CREATE INDEX idx_save_folders_save ON save_folders(save_id);
CREATE INDEX idx_save_folders_folder ON save_folders(folder_id);
```

### 2. Add Folder Methods to Save Service
Update `/home/pgc/vidlyx/backend/services/saveService.js`:

```javascript
// Add to existing saveService

async addToFolders(saveId, userId, folderIds) {
  // Verify save ownership
  const save = await this.getById(saveId, userId);
  if (!save) {
    throw new Error('Save not found');
  }

  // Verify folder ownership
  for (const folderId of folderIds) {
    const folder = await db.query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folder.rows.length === 0) {
      throw new Error(`Folder ${folderId} not found`);
    }
  }

  // Add to folders (ignore duplicates)
  for (const folderId of folderIds) {
    await db.query(
      `INSERT INTO save_folders (save_id, folder_id)
       VALUES ($1, $2)
       ON CONFLICT (save_id, folder_id) DO NOTHING`,
      [saveId, folderId]
    );
  }

  return this.getById(saveId, userId);
}

async removeFromFolder(saveId, userId, folderId) {
  // Verify save ownership
  const save = await this.getById(saveId, userId);
  if (!save) {
    throw new Error('Save not found');
  }

  await db.query(
    'DELETE FROM save_folders WHERE save_id = $1 AND folder_id = $2',
    [saveId, folderId]
  );

  return this.getById(saveId, userId);
}

async setFolders(saveId, userId, folderIds) {
  // Verify save ownership
  const save = await this.getById(saveId, userId);
  if (!save) {
    throw new Error('Save not found');
  }

  // Remove all existing folder associations
  await db.query(
    'DELETE FROM save_folders WHERE save_id = $1',
    [saveId]
  );

  // Add new associations
  if (folderIds && folderIds.length > 0) {
    await this.addToFolders(saveId, userId, folderIds);
  }

  return this.getById(saveId, userId);
}

async getSaveFolders(saveId, userId) {
  // Verify save ownership
  const save = await this.getById(saveId, userId);
  if (!save) {
    throw new Error('Save not found');
  }

  const result = await db.query(
    `SELECT f.*
     FROM folders f
     JOIN save_folders sf ON f.id = sf.folder_id
     WHERE sf.save_id = $1
     ORDER BY f.name ASC`,
    [saveId]
  );

  return result.rows;
}

// Update getById to include folders
async getById(saveId, userId) {
  const result = await db.query(
    `SELECT s.*,
            v.title as video_title,
            v.thumbnail_url,
            v.youtube_id,
            v.duration
     FROM saves s
     LEFT JOIN videos v ON s.video_id = v.id
     WHERE s.id = $1 AND s.user_id = $2`,
    [saveId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const save = result.rows[0];

  // Get frames
  const frames = await db.query(
    `SELECT f.* FROM frames f
     JOIN save_frames sf ON f.id = sf.frame_id
     WHERE sf.save_id = $1
     ORDER BY f.timestamp_seconds ASC`,
    [saveId]
  );
  save.frames = frames.rows;

  // Get transcript selections
  const transcripts = await db.query(
    `SELECT * FROM save_transcripts
     WHERE save_id = $1
     ORDER BY start_time ASC`,
    [saveId]
  );
  save.transcript_selections = transcripts.rows;

  // Get folders
  const folders = await db.query(
    `SELECT f.* FROM folders f
     JOIN save_folders sf ON f.id = sf.folder_id
     WHERE sf.save_id = $1
     ORDER BY f.name ASC`,
    [saveId]
  );
  save.folders = folders.rows;
  save.folder_ids = folders.rows.map(f => f.id);

  return save;
}
```

### 3. Add Folder Routes to Saves
Update `/home/pgc/vidlyx/backend/routes/saves.js`:

```javascript
// Add save to folders
router.post('/:id/folders', async (req, res, next) => {
  try {
    const { folderIds } = req.body;
    const save = await saveService.addToFolders(
      req.params.id,
      req.user.id,
      folderIds
    );
    res.json(save);
  } catch (error) {
    next(error);
  }
});

// Remove save from folder
router.delete('/:id/folders/:folderId', async (req, res, next) => {
  try {
    const save = await saveService.removeFromFolder(
      req.params.id,
      req.user.id,
      req.params.folderId
    );
    res.json(save);
  } catch (error) {
    next(error);
  }
});

// Set all folders for a save (replace existing)
router.put('/:id/folders', async (req, res, next) => {
  try {
    const { folderIds } = req.body;
    const save = await saveService.setFolders(
      req.params.id,
      req.user.id,
      folderIds
    );
    res.json(save);
  } catch (error) {
    next(error);
  }
});

// Get folders for a save
router.get('/:id/folders', async (req, res, next) => {
  try {
    const folders = await saveService.getSaveFolders(
      req.params.id,
      req.user.id
    );
    res.json({ folders });
  } catch (error) {
    next(error);
  }
});
```

### 4. Add Folder-Saves Route
Update `/home/pgc/vidlyx/backend/routes/folders.js`:

```javascript
// Get saves in a folder
router.get('/:id/saves', async (req, res, next) => {
  try {
    const { sortBy, sortOrder, limit, offset } = req.query;

    // First verify folder ownership
    await folderService.getById(req.params.id, req.user.id);

    const saves = await saveService.getSaves(req.user.id, {
      folderId: req.params.id,
      sortBy,
      sortOrder,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json(saves);
  } catch (error) {
    next(error);
  }
});

// Get uncategorized saves (not in any folder)
router.get('/uncategorized/saves', async (req, res, next) => {
  try {
    const { sortBy, sortOrder, limit, offset } = req.query;

    const saves = await saveService.getSaves(req.user.id, {
      folderId: 'uncategorized',
      sortBy,
      sortOrder,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json(saves);
  } catch (error) {
    next(error);
  }
});
```

### 5. Update Frontend Save Service
Update `/home/pgc/vidlyx/dashboard/src/services/saveService.js`:

```javascript
const saveService = {
  // ... existing methods ...

  addToFolders: (saveId, folderIds) =>
    api.post(`/saves/${saveId}/folders`, { folderIds }),

  removeFromFolder: (saveId, folderId) =>
    api.delete(`/saves/${saveId}/folders/${folderId}`),

  setFolders: (saveId, folderIds) =>
    api.put(`/saves/${saveId}/folders`, { folderIds }),

  getFolders: (saveId) =>
    api.get(`/saves/${saveId}/folders`)
};

export default saveService;
```

### 6. Update Frontend Folder Service
Update `/home/pgc/vidlyx/dashboard/src/services/folderService.js`:

```javascript
const folderService = {
  // ... existing methods ...

  getSaves: (folderId, params = {}) =>
    api.get(`/folders/${folderId}/saves`, { params }),

  getUncategorizedSaves: (params = {}) =>
    api.get('/folders/uncategorized/saves', { params })
};

export default folderService;
```

## Verification
1. Add a save to multiple folders
2. Remove a save from a folder
3. Set folders for a save (replace all)
4. View saves filtered by folder
5. View uncategorized saves
6. Deleting a folder does not delete saves

## Next Steps
Proceed to Task 7 - Subtask 3 (FolderList Component)

## Estimated Time
2-3 hours
