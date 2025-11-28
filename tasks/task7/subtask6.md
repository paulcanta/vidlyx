# Task 7 - Subtask 6: Tag System Implementation

## Objective
Implement a flexible tagging system for saves with auto-suggestions and filtering.

## Prerequisites
- Task 7 - Subtask 5 completed (Drag-and-Drop)

## Instructions

### 1. Create Tags Database Schema
```sql
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#64748b',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS save_tags (
  save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (save_id, tag_id)
);

CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_save_tags_save ON save_tags(save_id);
CREATE INDEX idx_save_tags_tag ON save_tags(tag_id);
```

### 2. Create Tag Service
Create `/home/pgc/vidlyx/backend/services/tagService.js`:

```javascript
const db = require('../config/database');

class TagService {
  async create(userId, data) {
    const { name, color = '#64748b' } = data;

    if (!name || name.trim().length === 0) {
      throw new Error('Tag name is required');
    }

    if (name.length > 50) {
      throw new Error('Tag name must be 50 characters or less');
    }

    // Check for existing tag
    const existing = await db.query(
      'SELECT * FROM tags WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name.trim()]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0]; // Return existing tag
    }

    const result = await db.query(
      `INSERT INTO tags (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name.trim(), color]
    );

    return this.enrichTag(result.rows[0]);
  }

  async getAll(userId) {
    const result = await db.query(
      `SELECT t.*,
              (SELECT COUNT(*) FROM save_tags st WHERE st.tag_id = t.id) as save_count
       FROM tags t
       WHERE t.user_id = $1
       ORDER BY t.name ASC`,
      [userId]
    );

    return result.rows.map(t => this.enrichTag(t));
  }

  async search(userId, query) {
    const result = await db.query(
      `SELECT t.*,
              (SELECT COUNT(*) FROM save_tags st WHERE st.tag_id = t.id) as save_count
       FROM tags t
       WHERE t.user_id = $1 AND t.name ILIKE $2
       ORDER BY t.name ASC
       LIMIT 10`,
      [userId, `%${query}%`]
    );

    return result.rows.map(t => this.enrichTag(t));
  }

  async update(tagId, userId, data) {
    const { name, color } = data;

    const result = await db.query(
      `UPDATE tags
       SET name = COALESCE($1, name),
           color = COALESCE($2, color)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [name?.trim(), color, tagId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Tag not found');
    }

    return this.enrichTag(result.rows[0]);
  }

  async delete(tagId, userId) {
    const result = await db.query(
      'DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id',
      [tagId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Tag not found');
    }

    return { success: true };
  }

  async getOrCreate(userId, name, color) {
    const existing = await db.query(
      'SELECT * FROM tags WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name.trim()]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    return this.create(userId, { name, color });
  }

  enrichTag(tag) {
    return {
      ...tag,
      save_count: parseInt(tag.save_count || 0)
    };
  }
}

module.exports = new TagService();
```

### 3. Create Tag Routes
Create `/home/pgc/vidlyx/backend/routes/tags.js`:

```javascript
const express = require('express');
const router = express.Router();
const tagService = require('../services/tagService');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Get all tags
router.get('/', async (req, res, next) => {
  try {
    const tags = await tagService.getAll(req.user.id);
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

// Search tags
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const tags = await tagService.search(req.user.id, q || '');
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

// Create tag
router.post('/', async (req, res, next) => {
  try {
    const tag = await tagService.create(req.user.id, req.body);
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
});

// Update tag
router.put('/:id', async (req, res, next) => {
  try {
    const tag = await tagService.update(req.params.id, req.user.id, req.body);
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

// Delete tag
router.delete('/:id', async (req, res, next) => {
  try {
    await tagService.delete(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 4. Add Save-Tag Operations
Update `/home/pgc/vidlyx/backend/services/saveService.js`:

```javascript
async addTags(saveId, userId, tagIds) {
  // Verify save ownership
  const save = await this.getById(saveId, userId);
  if (!save) throw new Error('Save not found');

  for (const tagId of tagIds) {
    await db.query(
      `INSERT INTO save_tags (save_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [saveId, tagId]
    );
  }

  return this.getById(saveId, userId);
}

async removeTag(saveId, userId, tagId) {
  const save = await this.getById(saveId, userId);
  if (!save) throw new Error('Save not found');

  await db.query(
    'DELETE FROM save_tags WHERE save_id = $1 AND tag_id = $2',
    [saveId, tagId]
  );

  return this.getById(saveId, userId);
}

async setTags(saveId, userId, tagIds) {
  const save = await this.getById(saveId, userId);
  if (!save) throw new Error('Save not found');

  await db.query('DELETE FROM save_tags WHERE save_id = $1', [saveId]);

  if (tagIds && tagIds.length > 0) {
    await this.addTags(saveId, userId, tagIds);
  }

  return this.getById(saveId, userId);
}

// Update getById to include tags
async getById(saveId, userId) {
  // ... existing code ...

  // Get tags
  const tags = await db.query(
    `SELECT t.* FROM tags t
     JOIN save_tags st ON t.id = st.tag_id
     WHERE st.save_id = $1
     ORDER BY t.name ASC`,
    [saveId]
  );
  save.tags = tags.rows;
  save.tag_ids = tags.rows.map(t => t.id);

  return save;
}
```

### 5. Create TagPicker Component
Create `/home/pgc/vidlyx/dashboard/src/components/Tag/TagPicker.js`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from '@phosphor-icons/react';
import { useTags } from '../../hooks/useTags';
import './TagPicker.css';

function TagPicker({ selected = [], onChange, allowCreate = false }) {
  const { tags, search, createTag } = useTags();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputValue.trim()) {
      const results = search(inputValue);
      setSuggestions(results.filter(t => !selected.includes(t.id)));
    } else {
      setSuggestions(tags.filter(t => !selected.includes(t.id)).slice(0, 5));
    }
  }, [inputValue, tags, selected, search]);

  const handleSelect = (tag) => {
    onChange([...selected, tag.id]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemove = (tagId) => {
    onChange(selected.filter(id => id !== tagId));
  };

  const handleCreate = async () => {
    if (!inputValue.trim()) return;

    const tag = await createTag({ name: inputValue.trim() });
    onChange([...selected, tag.id]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (allowCreate) {
        handleCreate();
      }
    } else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      handleRemove(selected[selected.length - 1]);
    }
  };

  const selectedTags = selected.map(id => tags.find(t => t.id === id)).filter(Boolean);
  const showCreateOption = allowCreate && inputValue.trim() &&
    !tags.find(t => t.name.toLowerCase() === inputValue.toLowerCase());

  return (
    <div className="tag-picker" ref={wrapperRef}>
      <div className="tag-picker-input-wrapper">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="tag-chip"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            {tag.name}
            <button onClick={() => handleRemove(tag.id)}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Add tags...' : ''}
          className="tag-picker-input"
        />
      </div>

      {showSuggestions && (suggestions.length > 0 || showCreateOption) && (
        <div className="tag-suggestions">
          {suggestions.map(tag => (
            <button
              key={tag.id}
              className="tag-suggestion"
              onClick={() => handleSelect(tag)}
            >
              <span
                className="tag-color-dot"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <span className="tag-count">{tag.save_count}</span>
            </button>
          ))}
          {showCreateOption && (
            <button className="tag-suggestion create" onClick={handleCreate}>
              <Plus size={14} />
              Create "{inputValue}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TagPicker;
```

### 6. Style TagPicker
Create `/home/pgc/vidlyx/dashboard/src/components/Tag/TagPicker.css`:

```css
.tag-picker {
  position: relative;
}

.tag-picker-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-primary);
  min-height: 42px;
}

.tag-picker-input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.tag-picker-input {
  flex: 1;
  min-width: 100px;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--text-sm);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 8px;
  border-radius: var(--border-radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.tag-chip button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  padding: 0;
}

.tag-chip button:hover {
  opacity: 1;
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  margin-top: var(--space-1);
  max-height: 200px;
  overflow-y: auto;
}

.tag-suggestion {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.tag-suggestion:hover {
  background: var(--bg-tertiary);
}

.tag-suggestion.create {
  color: var(--color-primary);
  border-top: 1px solid var(--border-color);
}

.tag-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tag-count {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

### 7. Create useTags Hook
Create `/home/pgc/vidlyx/dashboard/src/hooks/useTags.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import tagService from '../services/tagService';

export function useTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tagService.getAll();
      setTags(response.data.tags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const search = useCallback((query) => {
    return tags.filter(t =>
      t.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [tags]);

  const createTag = async (data) => {
    const response = await tagService.create(data);
    setTags(prev => [...prev, response.data].sort((a, b) =>
      a.name.localeCompare(b.name)
    ));
    return response.data;
  };

  const deleteTag = async (id) => {
    await tagService.delete(id);
    setTags(prev => prev.filter(t => t.id !== id));
  };

  return {
    tags,
    loading,
    search,
    createTag,
    deleteTag,
    refetch: fetchTags
  };
}
```

## Verification
1. Create new tags inline
2. Search/autocomplete existing tags
3. Add tags to saves
4. Remove tags from saves
5. Filter saves by tags
6. Tag counts update correctly

## Next Steps
Task 7 Complete! Proceed to Task 8 - Subtask 1 (Full-Text Search Implementation)

## Estimated Time
3-4 hours
