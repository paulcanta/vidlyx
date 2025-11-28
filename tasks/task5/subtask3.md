# Task 5 - Subtask 3: Section Summaries Storage

## Objective
Store and retrieve section summaries with proper database structure.

## Prerequisites
- Task 5 - Subtask 2 completed (Summary generation)

## Instructions

### 1. Update Sections Table
Add summary columns:

```sql
ALTER TABLE sections
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS key_points JSONB,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;
```

### 2. Create Section Summary Functions
```javascript
async function updateSectionSummary(sectionId, summaryData) {
  const query = `
    UPDATE sections
    SET summary = $1,
        key_points = $2,
        generated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  const result = await db.query(query, [
    summaryData.summary,
    JSON.stringify(summaryData.key_points),
    sectionId
  ]);
  return result.rows[0];
}

async function getSectionsWithSummaries(videoId) {
  const query = `
    SELECT * FROM sections
    WHERE video_id = $1
    ORDER BY section_order
  `;
  const result = await db.query(query, [videoId]);
  return result.rows;
}
```

### 3. API for Section Summaries
```javascript
// GET /api/videos/:id/sections/:sectionId
router.get('/:id/sections/:sectionId', async (req, res) => {
  const query = 'SELECT * FROM sections WHERE id = $1 AND video_id = $2';
  const result = await db.query(query, [req.params.sectionId, req.params.id]);
  res.json(result.rows[0] || null);
});

// PUT /api/sections/:id - Update section (manual edit)
router.put('/:id', async (req, res) => {
  const { title, summary, key_points } = req.body;
  const query = `
    UPDATE sections
    SET title = COALESCE($1, title),
        summary = COALESCE($2, summary),
        key_points = COALESCE($3, key_points)
    WHERE id = $4
    RETURNING *
  `;
  const result = await db.query(query, [title, summary, key_points, req.params.id]);
  res.json(result.rows[0]);
});
```

### 4. Frontend Hook for Sections
```javascript
// useSections.js
export function useSections(videoId) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      const response = await api.get(`/videos/${videoId}/sections`);
      setSections(response.data);
      setLoading(false);
    };
    fetchSections();
  }, [videoId]);

  return { sections, loading };
}
```

## Verification
1. Summaries stored in database correctly
2. Key points stored as JSONB array
3. Manual edits persist

## Next Steps
Proceed to Task 5 - Subtask 4 (Full Video Summary)

## Estimated Time
1-2 hours
