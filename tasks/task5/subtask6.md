# Task 5 - Subtask 6: Key Points Extraction and Display

## Objective
Extract and display key points with timestamps for easy reference.

## Prerequisites
- Task 5 - Subtask 5 completed (Summary panel)

## Instructions

### 1. Enhance Key Point Extraction
Update summary generation to include timestamps:

```javascript
async function extractKeyPointsWithTimestamps(videoId) {
  const sections = await getSectionsWithSummaries(videoId);
  const transcript = await getTranscript(videoId);

  const prompt = `Extract key points from this video with their timestamps:

Sections:
${sections.map(s => `[${formatTimestamp(s.start_time)} - ${formatTimestamp(s.end_time)}] ${s.title}: ${s.summary}`).join('\n')}

For each key point, identify:
1. The key insight or action item
2. The approximate timestamp where it's discussed
3. A brief quote or context

Format as JSON array:
[
  {
    "point": "key insight text",
    "timestamp": 125.5,
    "context": "brief context or quote",
    "category": "insight|action|definition|example"
  }
]`;

  const result = await geminiService.generateText(prompt);
  return JSON.parse(result);
}
```

### 2. Store Key Points with Timestamps
```sql
CREATE TABLE IF NOT EXISTS key_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  point_text TEXT NOT NULL,
  timestamp_seconds DECIMAL(10, 2),
  context TEXT,
  category VARCHAR(50),
  importance INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_keypoints_video ON key_points(video_id);
CREATE INDEX idx_keypoints_section ON key_points(section_id);
```

### 3. Key Points Component
```jsx
function KeyPointsList({ videoId, onSeek }) {
  const [keyPoints, setKeyPoints] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchKeyPoints();
  }, [videoId]);

  const filteredPoints = filter === 'all'
    ? keyPoints
    : keyPoints.filter(p => p.category === filter);

  return (
    <div className="key-points-list">
      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Points</option>
          <option value="insight">Insights</option>
          <option value="action">Action Items</option>
          <option value="definition">Definitions</option>
          <option value="example">Examples</option>
        </select>
      </div>

      <ul>
        {filteredPoints.map(point => (
          <li key={point.id} className="key-point">
            <div className="point-header">
              <button
                className="timestamp-btn"
                onClick={() => onSeek(point.timestamp_seconds)}
              >
                {formatTimestamp(point.timestamp_seconds)}
              </button>
              <span className={`category-badge ${point.category}`}>
                {point.category}
              </span>
            </div>
            <p className="point-text">{point.point_text}</p>
            {point.context && (
              <p className="point-context">"{point.context}"</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. Export Key Points
```javascript
function exportKeyPoints(keyPoints, format = 'markdown') {
  if (format === 'markdown') {
    return keyPoints.map(p =>
      `- **[${formatTimestamp(p.timestamp_seconds)}]** ${p.point_text}`
    ).join('\n');
  }

  if (format === 'json') {
    return JSON.stringify(keyPoints, null, 2);
  }

  // Plain text
  return keyPoints.map(p =>
    `[${formatTimestamp(p.timestamp_seconds)}] ${p.point_text}`
  ).join('\n');
}
```

### 5. Copy Key Points Feature
```jsx
<button onClick={() => {
  const text = exportKeyPoints(keyPoints, 'markdown');
  navigator.clipboard.writeText(text);
  showToast('Key points copied!');
}}>
  <Copy /> Copy Key Points
</button>
```

## Verification
1. Key points have accurate timestamps
2. Clicking timestamp seeks video
3. Categories filter correctly
4. Export produces formatted output

## Next Steps
Task 5 Complete! Proceed to Task 6 - Subtask 1 (Save Creation API)

## Estimated Time
2-3 hours
