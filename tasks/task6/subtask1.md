# Task 6 - Subtask 1: Save Creation API

## Objective
Create API endpoints for saving video content (frames, transcript selections, summaries) to the user's collection.

## Prerequisites
- Task 5 completed (Summaries working)
- Database schema for saves and related tables

## Instructions

### 1. Create Save Routes
Create `/home/pgc/vidlyx/server/src/routes/saveRoutes.js`:

```javascript
const router = require('express').Router();
const saveService = require('../services/saveService');
const { requireAuth } = require('../middleware/auth');

// Create a new save
router.post('/', requireAuth, async (req, res) => {
  try {
    const save = await saveService.createSave(req.user.id, req.body);
    res.status(201).json(save);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all saves for user
router.get('/', requireAuth, async (req, res) => {
  const { folder, video, tags, type, sort, limit, offset } = req.query;
  const saves = await saveService.getSaves(req.user.id, {
    folderId: folder,
    videoId: video,
    tags: tags?.split(','),
    contentType: type,
    sortBy: sort,
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0
  });
  res.json(saves);
});

// Get single save
router.get('/:id', requireAuth, async (req, res) => {
  const save = await saveService.getSaveById(req.params.id, req.user.id);
  if (!save) return res.status(404).json({ error: 'Save not found' });
  res.json(save);
});

// Update save
router.put('/:id', requireAuth, async (req, res) => {
  const save = await saveService.updateSave(req.params.id, req.user.id, req.body);
  res.json(save);
});

// Delete save
router.delete('/:id', requireAuth, async (req, res) => {
  await saveService.deleteSave(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
```

### 2. Create Save Service
Create `/home/pgc/vidlyx/server/src/services/saveService.js`:

```javascript
const db = require('./db');
const { v4: uuid } = require('uuid');

async function createSave(userId, data) {
  const {
    videoId,
    title,
    notes,
    frames = [],
    transcriptSelections = [],
    summaryExcerpts = [],
    folders = [],
    tags = []
  } = data;

  // Create save record
  const saveId = uuid();
  const autoTitle = await generateAutoTitle(data);

  const saveQuery = `
    INSERT INTO saves (id, user_id, video_id, title, auto_title, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const saveResult = await db.query(saveQuery, [
    saveId, userId, videoId, title || autoTitle, autoTitle, notes
  ]);

  // Add frames to save
  for (const frameId of frames) {
    await db.query(
      'INSERT INTO save_frames (save_id, frame_id) VALUES ($1, $2)',
      [saveId, frameId]
    );
  }

  // Add transcript selections
  for (const selection of transcriptSelections) {
    await db.query(
      `INSERT INTO save_transcripts (save_id, start_time, end_time, text)
       VALUES ($1, $2, $3, $4)`,
      [saveId, selection.start, selection.end, selection.text]
    );
  }

  // Add summary excerpts
  for (const excerpt of summaryExcerpts) {
    await db.query(
      `INSERT INTO save_summaries (save_id, section_id, excerpt)
       VALUES ($1, $2, $3)`,
      [saveId, excerpt.sectionId, excerpt.text]
    );
  }

  // Add to folders
  for (const folderId of folders) {
    await db.query(
      'INSERT INTO save_folders (save_id, folder_id) VALUES ($1, $2)',
      [saveId, folderId]
    );
  }

  // Add tags
  for (const tagId of tags) {
    await db.query(
      'INSERT INTO save_tags (save_id, tag_id) VALUES ($1, $2)',
      [saveId, tagId]
    );
  }

  return getSaveById(saveId, userId);
}

async function getSaveById(saveId, userId) {
  const query = `
    SELECT
      s.*,
      v.title as video_title,
      v.youtube_id,
      v.thumbnail_url,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', f.id, 'path', f.frame_path, 'timestamp', f.timestamp_seconds))
        FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as frames,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('start', st.start_time, 'end', st.end_time, 'text', st.text))
        FILTER (WHERE st.id IS NOT NULL),
        '[]'
      ) as transcript_selections,
      COALESCE(
        json_agg(DISTINCT fo.id) FILTER (WHERE fo.id IS NOT NULL),
        '[]'
      ) as folder_ids
    FROM saves s
    LEFT JOIN videos v ON s.video_id = v.id
    LEFT JOIN save_frames sf ON s.id = sf.save_id
    LEFT JOIN frames f ON sf.frame_id = f.id
    LEFT JOIN save_transcripts st ON s.id = st.save_id
    LEFT JOIN save_folders sfo ON s.id = sfo.save_id
    LEFT JOIN folders fo ON sfo.folder_id = fo.id
    WHERE s.id = $1 AND s.user_id = $2
    GROUP BY s.id, v.id
  `;
  const result = await db.query(query, [saveId, userId]);
  return result.rows[0];
}

async function generateAutoTitle(data) {
  // Generate title based on content
  if (data.transcriptSelections?.length > 0) {
    const firstText = data.transcriptSelections[0].text;
    return firstText.substring(0, 50) + (firstText.length > 50 ? '...' : '');
  }
  return 'Untitled Save';
}

module.exports = { createSave, getSaveById, getSaves, updateSave, deleteSave };
```

### 3. Request Body Schema
```javascript
// POST /api/saves
{
  "videoId": "uuid",
  "title": "Optional title",
  "notes": "User notes",
  "frames": ["frame-id-1", "frame-id-2"],
  "transcriptSelections": [
    { "start": 10.5, "end": 25.3, "text": "Selected transcript text..." }
  ],
  "summaryExcerpts": [
    { "sectionId": "section-id", "text": "Excerpt from summary..." }
  ],
  "folders": ["folder-id-1"],
  "tags": ["tag-id-1", "tag-id-2"]
}
```

### 4. Add Routes to App
```javascript
const saveRoutes = require('./routes/saveRoutes');
app.use('/api/saves', saveRoutes);
```

## Verification
1. Create save with frames and transcript
2. Retrieve save with all content included
3. Update save title and notes
4. Delete save and verify cascade

## Next Steps
Proceed to Task 6 - Subtask 2 (Save Database Operations)

## Estimated Time
2-3 hours
