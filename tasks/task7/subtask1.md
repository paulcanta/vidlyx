# Task 7 - Subtask 1: Folder CRUD Operations

## Objective
Implement complete folder management API with create, read, update, and delete operations.

## Prerequisites
- Task 6 Complete (Save System & Collection)

## Instructions

### 1. Create Folder Database Schema
The schema was created in Task 1, but ensure it exists:

```sql
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'folder',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_folders_user ON folders(user_id);
```

### 2. Create Folder Service
Create `/home/pgc/vidlyx/backend/services/folderService.js`:

```javascript
const db = require('../config/database');

class FolderService {
  async create(userId, data) {
    const { name, color = '#6366f1', icon = 'folder' } = data;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('Folder name is required');
    }

    if (name.length > 100) {
      throw new Error('Folder name must be 100 characters or less');
    }

    // Check for duplicate names
    const existing = await db.query(
      'SELECT id FROM folders WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name.trim()]
    );

    if (existing.rows.length > 0) {
      throw new Error('A folder with this name already exists');
    }

    const result = await db.query(
      `INSERT INTO folders (user_id, name, color, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name.trim(), color, icon]
    );

    return this.enrichFolder(result.rows[0]);
  }

  async getAll(userId) {
    const result = await db.query(
      `SELECT f.*,
              (SELECT COUNT(*) FROM save_folders sf WHERE sf.folder_id = f.id) as save_count
       FROM folders f
       WHERE f.user_id = $1
       ORDER BY f.name ASC`,
      [userId]
    );

    return result.rows.map(f => this.enrichFolder(f));
  }

  async getById(folderId, userId) {
    const result = await db.query(
      `SELECT f.*,
              (SELECT COUNT(*) FROM save_folders sf WHERE sf.folder_id = f.id) as save_count
       FROM folders f
       WHERE f.id = $1 AND f.user_id = $2`,
      [folderId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Folder not found');
    }

    return this.enrichFolder(result.rows[0]);
  }

  async update(folderId, userId, data) {
    const { name, color, icon } = data;

    // Verify ownership
    await this.getById(folderId, userId);

    // Check for duplicate names if name is being changed
    if (name) {
      const existing = await db.query(
        `SELECT id FROM folders
         WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3`,
        [userId, name.trim(), folderId]
      );

      if (existing.rows.length > 0) {
        throw new Error('A folder with this name already exists');
      }
    }

    const result = await db.query(
      `UPDATE folders
       SET name = COALESCE($1, name),
           color = COALESCE($2, color),
           icon = COALESCE($3, icon),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name?.trim(), color, icon, folderId, userId]
    );

    return this.enrichFolder(result.rows[0]);
  }

  async delete(folderId, userId) {
    // Verify ownership
    await this.getById(folderId, userId);

    // Delete folder (save_folders associations cascade)
    await db.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );

    return { success: true };
  }

  enrichFolder(folder) {
    return {
      ...folder,
      save_count: parseInt(folder.save_count || 0)
    };
  }
}

module.exports = new FolderService();
```

### 3. Create Folder Routes
Create `/home/pgc/vidlyx/backend/routes/folders.js`:

```javascript
const express = require('express');
const router = express.Router();
const folderService = require('../services/folderService');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Get all folders
router.get('/', async (req, res, next) => {
  try {
    const folders = await folderService.getAll(req.user.id);
    res.json({ folders });
  } catch (error) {
    next(error);
  }
});

// Get folder by ID
router.get('/:id', async (req, res, next) => {
  try {
    const folder = await folderService.getById(req.params.id, req.user.id);
    res.json(folder);
  } catch (error) {
    next(error);
  }
});

// Create folder
router.post('/', async (req, res, next) => {
  try {
    const folder = await folderService.create(req.user.id, req.body);
    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
});

// Update folder
router.put('/:id', async (req, res, next) => {
  try {
    const folder = await folderService.update(req.params.id, req.user.id, req.body);
    res.json(folder);
  } catch (error) {
    next(error);
  }
});

// Delete folder
router.delete('/:id', async (req, res, next) => {
  try {
    await folderService.delete(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 4. Register Routes
Update `/home/pgc/vidlyx/backend/server.js`:

```javascript
const folderRoutes = require('./routes/folders');

// Add with other route registrations
app.use('/api/folders', folderRoutes);
```

### 5. Create Frontend Folder Service
Create `/home/pgc/vidlyx/dashboard/src/services/folderService.js`:

```javascript
import api from './api';

const folderService = {
  getAll: () => api.get('/folders'),

  getById: (id) => api.get(`/folders/${id}`),

  create: (data) => api.post('/folders', data),

  update: (id, data) => api.put(`/folders/${id}`, data),

  delete: (id) => api.delete(`/folders/${id}`)
};

export default folderService;
```

### 6. Create useFolders Hook
Create `/home/pgc/vidlyx/dashboard/src/hooks/useFolders.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import folderService from '../services/folderService';

export function useFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await folderService.getAll();
      setFolders(response.data.folders);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (data) => {
    const response = await folderService.create(data);
    setFolders(prev => [...prev, response.data].sort((a, b) =>
      a.name.localeCompare(b.name)
    ));
    return response.data;
  };

  const updateFolder = async (id, data) => {
    const response = await folderService.update(id, data);
    setFolders(prev => prev.map(f =>
      f.id === id ? response.data : f
    ).sort((a, b) => a.name.localeCompare(b.name)));
    return response.data;
  };

  const deleteFolder = async (id) => {
    await folderService.delete(id);
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  return {
    folders,
    loading,
    error,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder
  };
}
```

## Verification
1. Create a new folder via API
2. List all folders for user
3. Update folder name and color
4. Delete folder (saves should remain, just unlinked)
5. Duplicate name validation works

## Next Steps
Proceed to Task 7 - Subtask 2 (Many-to-Many Save-Folder Relationships)

## Estimated Time
2-3 hours
