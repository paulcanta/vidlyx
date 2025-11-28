# Task 2 - Subtask 2: Integrate Python youtube_analyzer.py

## Objective
Set up Python scripts for video metadata and transcript extraction, and integrate them with Node.js backend.

## Prerequisites
- Task 2 - Subtask 1 completed (URL input working)
- Python 3.12+ installed
- pip available

## Instructions

### 1. Copy Python Scripts
Copy existing Python scripts from workspace:
```bash
cp -r /home/pgc/workspace/vidlyx/* /home/pgc/vidlyx/python/scripts/
```

Or if the scripts don't exist, create them fresh.

### 2. Create requirements.txt
Create `/home/pgc/vidlyx/python/requirements.txt`:
```
yt-dlp==2025.10.22
youtube-transcript-api==1.2.3
```

### 3. Install Python Dependencies
```bash
cd /home/pgc/vidlyx/python
pip install -r requirements.txt
```

### 4. Create/Update youtube_analyzer.py
Create `/home/pgc/vidlyx/python/scripts/youtube_analyzer.py`:

**Functions to implement:**

`get_video_metadata(video_id)`:
- Use yt-dlp to fetch video info
- Return:
  ```json
  {
    "title": "Video Title",
    "channel": "Channel Name",
    "duration": 3600,
    "description": "Video description...",
    "thumbnail": "https://i.ytimg.com/...",
    "upload_date": "20231215",
    "view_count": 1000000
  }
  ```

`get_transcript(video_id)`:
- Try yt-dlp first for subtitles
- Fallback to youtube-transcript-api
- Return:
  ```json
  {
    "full_text": "Complete transcript text...",
    "segments": [
      {
        "start": 0.0,
        "duration": 3.5,
        "text": "Hello and welcome..."
      }
    ],
    "type": "manual" | "auto",
    "language": "en"
  }
  ```

**CLI Interface:**
```bash
python youtube_analyzer.py metadata VIDEO_ID
python youtube_analyzer.py transcript VIDEO_ID
```

Output should be JSON to stdout, errors to stderr.

### 5. Create Node.js Python Shell Service
Create `/home/pgc/vidlyx/server/src/services/pythonService.js`:

```javascript
const { PythonShell } = require('python-shell');
const path = require('path');

const SCRIPTS_PATH = path.join(__dirname, '../../../python/scripts');

async function runPythonScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'json',
      pythonPath: 'python3',
      scriptPath: SCRIPTS_PATH,
      args: args
    };

    PythonShell.run(scriptName, options, (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
}

module.exports = {
  getVideoMetadata: (videoId) =>
    runPythonScript('youtube_analyzer.py', ['metadata', videoId]),

  getTranscript: (videoId) =>
    runPythonScript('youtube_analyzer.py', ['transcript', videoId])
};
```

### 6. Create YouTube Service
Create `/home/pgc/vidlyx/server/src/services/youtubeService.js`:

**Functions:**
- `fetchAndStoreMetadata(videoId, dbVideoId)`:
  1. Call pythonService.getVideoMetadata
  2. Update video record in database with metadata
  3. Return updated video

- `fetchAndStoreTranscript(videoId, dbVideoId)`:
  1. Call pythonService.getTranscript
  2. Insert into transcriptions table
  3. Return transcript

### 7. Update Video Creation Flow
Update `POST /api/videos` to trigger metadata fetch:

```javascript
// After creating video record
const video = await videoService.createVideo(userId, youtubeId);

// Fetch metadata (can be async/background)
youtubeService.fetchAndStoreMetadata(youtubeId, video.id)
  .then(() => videoService.updateVideoStatus(video.id, 'metadata_complete'))
  .catch((err) => {
    console.error('Metadata fetch failed:', err);
    videoService.updateVideoStatus(video.id, 'failed');
  });

// Return immediately with pending status
return res.json(video);
```

### 8. Create Analysis Status Endpoint
Add `GET /api/videos/:id/status`:
- Return current analysis status
- Include progress percentage
- Include which steps are complete

Response:
```json
{
  "status": "processing",
  "progress": 25,
  "steps": {
    "metadata": "completed",
    "transcript": "processing",
    "frames": "pending",
    "analysis": "pending"
  }
}
```

### 9. Test Python Scripts Directly
```bash
cd /home/pgc/vidlyx/python/scripts
python youtube_analyzer.py metadata dQw4w9WgXcQ
python youtube_analyzer.py transcript dQw4w9WgXcQ
```

Verify JSON output is correct.

## Verification

### Python Script Test:
```bash
python youtube_analyzer.py metadata dQw4w9WgXcQ
```
Should output valid JSON with video title, duration, etc.

### Node.js Integration Test:
```javascript
// In Node.js REPL or test file
const pythonService = require('./src/services/pythonService');
pythonService.getVideoMetadata('dQw4w9WgXcQ')
  .then(console.log)
  .catch(console.error);
```

### API Test:
```bash
curl -X POST http://localhost:4051/api/videos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Wait a moment, then check status
curl http://localhost:4051/api/videos/VIDEO_ID -b cookies.txt
```

Video should have title, channel, duration populated.

## Next Steps
Proceed to Task 2 - Subtask 3 (Video Metadata Storage and Display)

## Estimated Time
2-3 hours

## Notes
- yt-dlp is more reliable than youtube-dl
- Some videos may not have transcripts available
- Handle private/age-restricted videos gracefully
- Consider caching metadata to avoid re-fetching
- Python script errors should be caught and logged
