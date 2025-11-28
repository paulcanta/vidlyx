# Task 8 - Subtask 1: Full-Text Search Implementation

## Objective
Implement comprehensive full-text search across videos, transcripts, saves, and notes.

## Prerequisites
- Task 7 Complete (Folders & Organization)

## Instructions

### 1. Enable PostgreSQL Full-Text Search
Run migration to add search vectors:

```sql
-- Add tsvector columns for full-text search
ALTER TABLE videos ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE saves ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_videos_search ON videos USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_transcripts_search ON transcripts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_saves_search ON saves USING GIN(search_vector);

-- Function to update video search vector
CREATE OR REPLACE FUNCTION update_video_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.channel_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for videos
DROP TRIGGER IF EXISTS video_search_vector_update ON videos;
CREATE TRIGGER video_search_vector_update
  BEFORE INSERT OR UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_video_search_vector();

-- Function to update save search vector
CREATE OR REPLACE FUNCTION update_save_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.notes, '') || ' ' ||
    COALESCE(NEW.auto_title, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for saves
DROP TRIGGER IF EXISTS save_search_vector_update ON saves;
CREATE TRIGGER save_search_vector_update
  BEFORE INSERT OR UPDATE ON saves
  FOR EACH ROW EXECUTE FUNCTION update_save_search_vector();

-- Update existing records
UPDATE videos SET search_vector = to_tsvector('english',
  COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(channel_name, '')
);

UPDATE saves SET search_vector = to_tsvector('english',
  COALESCE(title, '') || ' ' || COALESCE(notes, '') || ' ' || COALESCE(auto_title, '')
);
```

### 2. Create Search Service
Create `/home/pgc/vidlyx/backend/services/searchService.js`:

```javascript
const db = require('../config/database');

class SearchService {
  async search(userId, query, options = {}) {
    const {
      types = ['videos', 'saves', 'transcripts'],
      limit = 20,
      offset = 0
    } = options;

    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    // Prepare search query for PostgreSQL
    const searchQuery = query
      .trim()
      .split(/\s+/)
      .map(word => word + ':*')
      .join(' & ');

    const results = [];
    let total = 0;

    // Search videos
    if (types.includes('videos')) {
      const videos = await this.searchVideos(userId, searchQuery, limit);
      results.push(...videos.map(v => ({ ...v, type: 'video' })));
      total += videos.length;
    }

    // Search saves
    if (types.includes('saves')) {
      const saves = await this.searchSaves(userId, searchQuery, limit);
      results.push(...saves.map(s => ({ ...s, type: 'save' })));
      total += saves.length;
    }

    // Search transcripts
    if (types.includes('transcripts')) {
      const transcripts = await this.searchTranscripts(userId, searchQuery, limit);
      results.push(...transcripts.map(t => ({ ...t, type: 'transcript' })));
      total += transcripts.length;
    }

    // Sort by relevance (rank)
    results.sort((a, b) => b.rank - a.rank);

    return {
      results: results.slice(offset, offset + limit),
      total,
      query: query.trim()
    };
  }

  async searchVideos(userId, searchQuery, limit) {
    const result = await db.query(
      `SELECT
        v.id,
        v.title,
        v.thumbnail_url,
        v.youtube_id,
        v.channel_name,
        v.duration,
        ts_rank(v.search_vector, to_tsquery('english', $2)) as rank,
        ts_headline('english', v.title || ' ' || COALESCE(v.description, ''),
          to_tsquery('english', $2),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as highlight
       FROM videos v
       WHERE v.user_id = $1
         AND v.search_vector @@ to_tsquery('english', $2)
       ORDER BY rank DESC
       LIMIT $3`,
      [userId, searchQuery, limit]
    );

    return result.rows;
  }

  async searchSaves(userId, searchQuery, limit) {
    const result = await db.query(
      `SELECT
        s.id,
        s.title,
        s.notes,
        s.auto_title,
        s.video_id,
        v.title as video_title,
        v.thumbnail_url,
        ts_rank(s.search_vector, to_tsquery('english', $2)) as rank,
        ts_headline('english', COALESCE(s.title, '') || ' ' || COALESCE(s.notes, ''),
          to_tsquery('english', $2),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as highlight
       FROM saves s
       LEFT JOIN videos v ON s.video_id = v.id
       WHERE s.user_id = $1
         AND s.search_vector @@ to_tsquery('english', $2)
       ORDER BY rank DESC
       LIMIT $3`,
      [userId, searchQuery, limit]
    );

    return result.rows;
  }

  async searchTranscripts(userId, searchQuery, limit) {
    const result = await db.query(
      `SELECT
        t.id,
        t.text,
        t.start_time,
        t.end_time,
        t.video_id,
        v.title as video_title,
        v.thumbnail_url,
        ts_rank(to_tsvector('english', t.text), to_tsquery('english', $2)) as rank,
        ts_headline('english', t.text,
          to_tsquery('english', $2),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as highlight
       FROM transcripts t
       JOIN videos v ON t.video_id = v.id
       WHERE v.user_id = $1
         AND to_tsvector('english', t.text) @@ to_tsquery('english', $2)
       ORDER BY rank DESC
       LIMIT $3`,
      [userId, searchQuery, limit]
    );

    return result.rows;
  }

  async getSuggestions(userId, query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Get recent searches and matching titles
    const result = await db.query(
      `SELECT DISTINCT title as suggestion
       FROM (
         SELECT title FROM videos WHERE user_id = $1 AND title ILIKE $2
         UNION
         SELECT title FROM saves WHERE user_id = $1 AND title ILIKE $2
       ) suggestions
       LIMIT $3`,
      [userId, `%${query}%`, limit]
    );

    return result.rows.map(r => r.suggestion);
  }
}

module.exports = new SearchService();
```

### 3. Create Search Routes
Create `/home/pgc/vidlyx/backend/routes/search.js`:

```javascript
const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Global search
router.get('/', async (req, res, next) => {
  try {
    const { q, types, limit, offset } = req.query;

    const results = await searchService.search(req.user.id, q, {
      types: types ? types.split(',') : undefined,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Search suggestions/autocomplete
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await searchService.getSuggestions(
      req.user.id,
      q,
      5
    );
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 4. Register Search Route
Update `/home/pgc/vidlyx/backend/server.js`:

```javascript
const searchRoutes = require('./routes/search');

app.use('/api/search', searchRoutes);
```

### 5. Create Frontend Search Service
Create `/home/pgc/vidlyx/dashboard/src/services/searchService.js`:

```javascript
import api from './api';

const searchService = {
  search: (query, options = {}) =>
    api.get('/search', {
      params: { q: query, ...options }
    }),

  getSuggestions: (query) =>
    api.get('/search/suggestions', { params: { q: query } })
};

export default searchService;
```

### 6. Create useSearch Hook
Create `/home/pgc/vidlyx/dashboard/src/hooks/useSearch.js`:

```javascript
import { useState, useCallback, useRef } from 'react';
import searchService from '../services/searchService';
import debounce from '../utils/debounce';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearch = useRef(
    debounce(async (q, types) => {
      if (!q || q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await searchService.search(q, { types });
        setResults(response.data.results);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  const search = useCallback((q, types) => {
    setQuery(q);
    debouncedSearch(q, types);
  }, [debouncedSearch]);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await searchService.getSuggestions(q);
      setSuggestions(response.data.suggestions);
    } catch (error) {
      setSuggestions([]);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setHasSearched(false);
  }, []);

  return {
    query,
    results,
    suggestions,
    loading,
    hasSearched,
    search,
    fetchSuggestions,
    clearSearch
  };
}
```

## Verification
1. Search finds videos by title/description
2. Search finds saves by title/notes
3. Search finds transcript text
4. Results include highlighted matches
5. Suggestions work for autocomplete
6. Results ranked by relevance

## Next Steps
Proceed to Task 8 - Subtask 2 (Search Results UI with Highlighting)

## Estimated Time
3-4 hours
