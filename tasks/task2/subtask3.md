# Task 2 - Subtask 3: Video Metadata Storage and Display

## Objective
Store video metadata in the database and display it in the frontend.

## Prerequisites
- Task 2 - Subtask 2 completed (Python integration working)
- Video metadata being fetched successfully

## Instructions

### 1. Update Video Table (if needed)
Ensure the videos table has all metadata columns:
- title (VARCHAR)
- channel_name (VARCHAR)
- duration (INTEGER) - in seconds
- thumbnail_url (TEXT)
- description (TEXT)
- upload_date (DATE)
- view_count (BIGINT)

### 2. Update Video Service
Update `/home/pgc/vidlyx/server/src/services/videoService.js`:

Add `updateVideoMetadata(videoId, metadata)`:
```javascript
async function updateVideoMetadata(videoId, metadata) {
  const query = `
    UPDATE videos SET
      title = $1,
      channel_name = $2,
      duration = $3,
      thumbnail_url = $4,
      description = $5,
      analysis_status = 'metadata_complete',
      updated_at = NOW()
    WHERE id = $6
    RETURNING *
  `;
  const values = [
    metadata.title,
    metadata.channel,
    metadata.duration,
    metadata.thumbnail,
    metadata.description,
    videoId
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}
```

### 3. Create Video Analysis Page Shell
Create `/home/pgc/vidlyx/dashboard/src/pages/app/VideoAnalysis.js`:

**Layout (Three-Panel):**
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard    Video Title                          │
├──────────────────────────────────────────────────────────────┤
│                    │                    │                    │
│   VIDEO PLAYER     │   TRANSCRIPT       │   ANALYSIS         │
│   & CONTROLS       │   PANEL            │   PANEL            │
│                    │                    │                    │
│   [Video Here]     │   [Segments...]    │   [Frames/Summary] │
│                    │                    │                    │
│   Channel Name     │                    │                    │
│   Duration: 10:30  │                    │                    │
│                    │                    │                    │
└──────────────────────────────────────────────────────────────┘
```

### 4. Create Video Header Component
Create `/home/pgc/vidlyx/dashboard/src/components/Video/VideoHeader.js`:

**Elements:**
- Back button (← arrow)
- Video title (large)
- Channel name
- Duration (formatted as MM:SS or HH:MM:SS)
- Analysis status badge
- Save button (for later)

### 5. Create Video Info Card Component
Create `/home/pgc/vidlyx/dashboard/src/components/Video/VideoInfo.js`:

**Display:**
- Thumbnail image
- Title
- Channel name with link
- Duration (formatted)
- View count (formatted with commas/K/M)
- Upload date
- Description (expandable/collapsible)

### 6. Create Duration Formatter Utility
Create `/home/pgc/vidlyx/dashboard/src/utils/formatters.js`:

```javascript
export function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatViewCount(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toLocaleString();
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
```

### 7. Create Analysis Status Component
Create `/home/pgc/vidlyx/dashboard/src/components/Video/AnalysisStatus.js`:

**For pending/processing status:**
- Progress bar
- Current step indicator
- Step checklist:
  - ✓ Metadata loaded
  - ⟳ Extracting transcript...
  - ○ Frame extraction
  - ○ Vision analysis
  - ○ Generating summary

**Status badges:**
- pending: gray
- processing: blue with animation
- completed: green
- failed: red

### 8. Fetch Video Data on Page Load
In `VideoAnalysis.js`:

```javascript
useEffect(() => {
  const fetchVideo = async () => {
    setLoading(true);
    try {
      const response = await videoService.getById(videoId);
      setVideo(response.data);
    } catch (error) {
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  fetchVideo();
}, [videoId]);
```

### 9. Create Loading State
While video is loading:
- Show skeleton for video info
- Show skeleton for panels
- Show progress indicator

### 10. Handle Different Analysis States
Conditional rendering based on `video.analysis_status`:
- `pending`: Show "Starting analysis..." message
- `processing`: Show progress component
- `completed`: Show full analysis panels
- `failed`: Show error message with retry button

## Verification

### Database Check:
```sql
SELECT title, channel_name, duration, analysis_status
FROM videos WHERE id = 'your-video-id';
```

### API Check:
```bash
curl http://localhost:4051/api/videos/VIDEO_ID -b cookies.txt
```

Should return video with metadata populated.

### Frontend Check:
1. Create a new video analysis
2. Navigate to `/app/video/:id`
3. Should see video title, channel, duration
4. Analysis status should update

## Next Steps
Proceed to Task 2 - Subtask 4 (YouTube IFrame Player Integration)

## Estimated Time
1-2 hours

## Notes
- Use skeleton loaders for better UX
- Format large numbers (views) for readability
- Handle missing metadata gracefully
- Consider polling for status updates during processing
