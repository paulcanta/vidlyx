# Task 5 - Subtask 4: Full Video Summary

## Objective
Create comprehensive video-level summaries that synthesize all sections.

## Prerequisites
- Task 5 - Subtask 3 completed (Section summaries stored)

## Instructions

### 1. Video Summary Table (if not exists)
```sql
CREATE TABLE IF NOT EXISTS video_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  full_summary TEXT,
  key_takeaways JSONB,
  topics JSONB,
  target_audience TEXT,
  difficulty_level VARCHAR(20),
  estimated_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Enhanced Summary Generation
Update summaryService.js:

```javascript
async function generateEnhancedVideoSummary(videoId) {
  const video = await getVideo(videoId);
  const sections = await getSectionsWithSummaries(videoId);
  const transcript = await getTranscript(videoId);

  const prompt = `Analyze this video "${video.title}" and provide a comprehensive summary:

Video Duration: ${formatDuration(video.duration)}
Channel: ${video.channel_name}

Sections:
${sections.map(s => `${s.title}: ${s.summary}`).join('\n')}

Full Transcript (first 2000 chars):
${transcript.full_text.substring(0, 2000)}

Provide detailed analysis in JSON:
{
  "executive_summary": "3-4 sentence overview",
  "key_takeaways": ["5-7 actionable points"],
  "main_topics": ["list of topics covered"],
  "target_audience": "who should watch this",
  "difficulty_level": "beginner|intermediate|advanced",
  "estimated_value": "what viewers will learn/gain",
  "recommended_for": ["use cases when to watch"],
  "prerequisites": ["what viewers should know first"]
}`;

  const result = await geminiService.generateText(prompt);
  const parsed = JSON.parse(result);

  await db.query(`
    INSERT INTO video_summaries
      (video_id, full_summary, key_takeaways, topics, target_audience, difficulty_level, estimated_value)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (video_id) DO UPDATE SET
      full_summary = $2, key_takeaways = $3, topics = $4,
      target_audience = $5, difficulty_level = $6, estimated_value = $7,
      updated_at = NOW()
  `, [
    videoId,
    parsed.executive_summary,
    JSON.stringify(parsed.key_takeaways),
    JSON.stringify(parsed.main_topics),
    parsed.target_audience,
    parsed.difficulty_level,
    parsed.estimated_value
  ]);

  return parsed;
}
```

### 3. API Endpoint
```javascript
// GET /api/videos/:id/full-summary
router.get('/:id/full-summary', async (req, res) => {
  const query = `
    SELECT vs.*, v.title as video_title, v.channel_name, v.duration
    FROM video_summaries vs
    JOIN videos v ON vs.video_id = v.id
    WHERE vs.video_id = $1
  `;
  const result = await db.query(query, [req.params.id]);
  res.json(result.rows[0] || null);
});
```

### 4. Frontend Summary Display
```jsx
function VideoSummary({ videoId }) {
  const { summary, loading } = useVideoSummary(videoId);

  if (loading) return <SummarySkeleton />;
  if (!summary) return <EmptyState message="No summary generated yet" />;

  return (
    <div className="video-summary">
      <section className="executive-summary">
        <h3>Summary</h3>
        <p>{summary.full_summary}</p>
      </section>

      <section className="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          {summary.key_takeaways?.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="metadata">
        <div className="meta-item">
          <label>Target Audience</label>
          <span>{summary.target_audience}</span>
        </div>
        <div className="meta-item">
          <label>Difficulty</label>
          <span className={`badge ${summary.difficulty_level}`}>
            {summary.difficulty_level}
          </span>
        </div>
      </section>
    </div>
  );
}
```

## Verification
1. Full summary includes all sections
2. Key takeaways are actionable
3. Metadata (difficulty, audience) is accurate
4. Summary is coherent and useful

## Next Steps
Proceed to Task 5 - Subtask 5 (Summary Panel UI with Tabs)

## Estimated Time
2-3 hours
