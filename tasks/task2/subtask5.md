# Task 2 - Subtask 5: Transcription Extraction and Storage

## Objective
Extract video transcripts using Python scripts and store them in the database.

## Prerequisites
- Task 2 - Subtask 4 completed (Video player working)
- Python youtube_analyzer.py script ready
- Database transcriptions table created

## Instructions

### 1. Update Python Transcript Script
Ensure `/home/pgc/vidlyx/python/scripts/youtube_analyzer.py` transcript function:

**Output format:**
```json
{
  "success": true,
  "data": {
    "full_text": "Complete concatenated transcript...",
    "segments": [
      {
        "start": 0.0,
        "end": 3.5,
        "duration": 3.5,
        "text": "Hello and welcome to this video"
      },
      {
        "start": 3.5,
        "end": 7.2,
        "duration": 3.7,
        "text": "Today we're going to learn about"
      }
    ],
    "type": "manual",
    "language": "en"
  }
}
```

**Error handling:**
```json
{
  "success": false,
  "error": "No transcript available for this video"
}
```

### 2. Create Transcription Service
Create `/home/pgc/vidlyx/server/src/services/transcriptionService.js`:

**Functions:**

`extractAndStoreTranscript(videoId, youtubeId)`:
1. Call Python script to get transcript
2. Parse response
3. Insert into transcriptions table
4. Return transcription record

`getTranscriptionByVideoId(videoId)`:
- Query transcription by video ID
- Return full transcript with segments

`searchTranscript(videoId, query)`:
- Full-text search within transcript
- Return matching segments with context

### 3. Create Transcription Routes
Create `/home/pgc/vidlyx/server/src/routes/transcriptionRoutes.js`:

**Endpoints:**
- `GET /api/videos/:id/transcript` - Get video transcript
- `GET /api/videos/:id/transcript/search?q=query` - Search within transcript

### 4. Insert Transcription into Database
```javascript
async function insertTranscription(videoId, data) {
  const query = `
    INSERT INTO transcriptions (
      video_id,
      full_text,
      segments,
      transcript_type,
      language
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    videoId,
    data.full_text,
    JSON.stringify(data.segments),
    data.type,
    data.language
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}
```

### 5. Trigger Transcript Extraction
Update video creation flow to trigger transcript extraction after metadata:

```javascript
// In youtubeService.js or as a job
async function processVideo(video) {
  // 1. Fetch metadata (already done)
  await videoService.updateVideoStatus(video.id, 'fetching_transcript');

  // 2. Fetch transcript
  try {
    await transcriptionService.extractAndStoreTranscript(
      video.id,
      video.youtube_id
    );
    await videoService.updateVideoStatus(video.id, 'transcript_complete');
  } catch (error) {
    // Transcript may not be available - continue anyway
    console.log('Transcript not available:', error.message);
    await videoService.updateVideoStatus(video.id, 'transcript_unavailable');
  }

  // Continue to next steps...
}
```

### 6. Handle Missing Transcripts
Some videos won't have transcripts. Handle gracefully:
- Set status to 'transcript_unavailable'
- Show message in UI: "No transcript available for this video"
- Still allow other analysis features

### 7. Frontend: Transcript Service
Create `/home/pgc/vidlyx/dashboard/src/services/transcriptService.js`:

```javascript
import api from './api';

export const transcriptService = {
  getByVideoId: (videoId) => api.get(`/videos/${videoId}/transcript`),
  search: (videoId, query) => api.get(`/videos/${videoId}/transcript/search`, {
    params: { q: query }
  })
};
```

### 8. Create Transcript Data Hook
Create `/home/pgc/vidlyx/dashboard/src/hooks/useTranscript.js`:

```javascript
export function useTranscript(videoId) {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const response = await transcriptService.getByVideoId(videoId);
        setTranscript(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchTranscript();
    }
  }, [videoId]);

  return { transcript, loading, error };
}
```

### 9. Format Segments for Display
Create utility to format segments:

```javascript
// Format timestamp for display
export function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Group segments by minute for easier navigation
export function groupSegmentsByMinute(segments) {
  const groups = {};
  segments.forEach(segment => {
    const minute = Math.floor(segment.start / 60);
    if (!groups[minute]) {
      groups[minute] = [];
    }
    groups[minute].push(segment);
  });
  return groups;
}
```

### 10. Export Transcript Formats
Add export functionality:
- TXT: Plain text with timestamps
- SRT: SubRip subtitle format
- JSON: Raw data format

Create `/home/pgc/vidlyx/server/src/utils/transcriptExport.js`:

```javascript
function toSRT(segments) {
  return segments.map((seg, i) => {
    const startTime = formatSRTTime(seg.start);
    const endTime = formatSRTTime(seg.end);
    return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
}

function formatSRTTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
}
```

## Verification

### Python Script Test:
```bash
cd /home/pgc/vidlyx/python/scripts
python youtube_analyzer.py transcript dQw4w9WgXcQ
```

Should output JSON with transcript segments.

### API Test:
```bash
# After video is processed
curl http://localhost:4051/api/videos/VIDEO_ID/transcript -b cookies.txt
```

Should return transcript with segments.

### Database Check:
```sql
SELECT video_id, transcript_type, language,
       jsonb_array_length(segments) as segment_count
FROM transcriptions
WHERE video_id = 'your-video-id';
```

### Frontend Check:
1. Create new video analysis
2. Wait for processing
3. Transcript data should be available via hook

## Next Steps
Proceed to Task 2 - Subtask 6 (Transcription UI Panel with Sync)

## Estimated Time
2-3 hours

## Notes
- yt-dlp can extract both manual and auto-generated captions
- Auto-generated captions may have timing issues
- Segments should be sorted by start time
- Consider caching transcripts to avoid re-extraction
- Full-text index enables fast search
