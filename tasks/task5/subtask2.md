# Task 5 - Subtask 2: Gemini Summary Generation

## Objective
Generate AI-powered summaries for video sections and full videos using Google Gemini.

## Prerequisites
- Task 5 - Subtask 1 completed (Section detection)
- Gemini API integration working

## Instructions

### 1. Create Summary Service
Create `/home/pgc/vidlyx/server/src/services/summaryService.js`:

```javascript
const geminiService = require('./geminiService');
const db = require('./db');

/**
 * Generate summary for a single section
 */
async function generateSectionSummary(section, visualContext = []) {
  const prompt = `Summarize this video section titled "${section.title}":

Transcript:
${section.transcript_text}

${visualContext.length > 0 ? `Visual context: ${visualContext.map(v => v.scene_description).join('. ')}` : ''}

Provide:
1. A 2-3 sentence summary
2. 3-5 key points as bullet points

Format as JSON:
{
  "summary": "...",
  "key_points": ["point1", "point2", ...]
}`;

  const result = await geminiService.generateText(prompt);
  return JSON.parse(result);
}

/**
 * Generate full video summary
 */
async function generateFullVideoSummary(videoId) {
  // Get all sections with summaries
  const sections = await getSectionsWithSummaries(videoId);

  // Get video metadata
  const video = await getVideo(videoId);

  const prompt = `Create a comprehensive summary for this video titled "${video.title}":

Sections:
${sections.map(s => `- ${s.title}: ${s.summary}`).join('\n')}

Provide:
1. An executive summary (3-4 sentences)
2. Key takeaways (5-7 bullet points)
3. Main topics covered
4. Who would benefit from this video

Format as JSON:
{
  "full_summary": "...",
  "key_takeaways": ["..."],
  "main_topics": ["..."],
  "target_audience": "..."
}`;

  const result = await geminiService.generateText(prompt);
  const parsed = JSON.parse(result);

  // Store full summary
  await storeVideoSummary(videoId, parsed);

  return parsed;
}

/**
 * Generate summaries for all sections of a video
 */
async function generateAllSectionSummaries(videoId, onProgress) {
  const sections = await getSections(videoId);
  const results = [];

  for (let i = 0; i < sections.length; i++) {
    // Get visual context for this section
    const frames = await getFramesForSection(sections[i]);

    // Generate summary
    const summary = await generateSectionSummary(sections[i], frames);

    // Store summary
    await updateSectionSummary(sections[i].id, summary);
    results.push({ section_id: sections[i].id, ...summary });

    // Rate limiting
    await sleep(4000); // Gemini rate limit

    onProgress?.(Math.round(((i + 1) / sections.length) * 100));
  }

  return results;
}

async function storeVideoSummary(videoId, summary) {
  const query = `
    INSERT INTO video_summaries (video_id, full_summary, key_takeaways, topics)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (video_id)
    DO UPDATE SET full_summary = $2, key_takeaways = $3, topics = $4, updated_at = NOW()
  `;
  await db.query(query, [
    videoId,
    summary.full_summary,
    JSON.stringify(summary.key_takeaways),
    JSON.stringify(summary.main_topics)
  ]);
}

module.exports = {
  generateSectionSummary,
  generateFullVideoSummary,
  generateAllSectionSummaries
};
```

### 2. Add Gemini Text Generation
Update geminiService.js:

```javascript
async function generateText(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { analyzeFrame, generateText };
```

### 3. API Endpoints
```javascript
// POST /api/videos/:id/generate-summaries
router.post('/:id/generate-summaries', async (req, res) => {
  try {
    // Generate section summaries
    await summaryService.generateAllSectionSummaries(req.params.id);

    // Generate full video summary
    const fullSummary = await summaryService.generateFullVideoSummary(req.params.id);

    res.json(fullSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/videos/:id/summary
router.get('/:id/summary', async (req, res) => {
  const query = 'SELECT * FROM video_summaries WHERE video_id = $1';
  const result = await db.query(query, [req.params.id]);
  res.json(result.rows[0] || null);
});
```

## Verification
1. Generate summaries for a video
2. Check section summaries are coherent
3. Full video summary captures main content
4. Key points are actionable

## Next Steps
Proceed to Task 5 - Subtask 3 (Section Summaries Storage)

## Estimated Time
2-3 hours
