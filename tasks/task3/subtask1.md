# Task 3 - Subtask 1: FFmpeg Integration for Frame Extraction

## Objective
Set up FFmpeg to extract frames from YouTube videos at specified intervals.

## Prerequisites
- Task 2 completed (Video playback and transcription working)
- FFmpeg installed on system
- Node.js fluent-ffmpeg package installed

## Instructions

### 1. Verify FFmpeg Installation
```bash
ffmpeg -version
```

If not installed:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### 2. Create Frames Directory
Ensure the frames directory exists:
```bash
mkdir -p /home/pgc/vidlyx/server/frames
```

Add to `.gitignore`:
```
server/frames/
```

### 3. Create FFmpeg Utility
Create `/home/pgc/vidlyx/server/src/utils/ffmpeg.js`:

```javascript
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

const FRAMES_DIR = process.env.FRAMES_DIR || './frames';

/**
 * Get video stream URL from YouTube
 * Uses yt-dlp to get direct video URL
 */
async function getVideoStreamUrl(youtubeId) {
  // Call Python script to get stream URL
  const pythonService = require('../services/pythonService');
  return pythonService.getStreamUrl(youtubeId);
}

/**
 * Extract frames from video at specified interval
 */
async function extractFrames(videoPath, outputDir, options = {}) {
  const {
    interval = 5,        // seconds between frames
    quality = 2,         // 1-31, lower is better
    width = 1280,        // output width
    format = 'jpg'
  } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=1/${interval},scale=${width}:-1`,
        `-q:v ${quality}`
      ])
      .output(path.join(outputDir, `frame_%04d.${format}`))
      .on('progress', (progress) => {
        console.log(`Extracting: ${progress.percent?.toFixed(1)}%`);
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Extract single frame at specific timestamp
 */
async function extractFrameAt(videoPath, outputPath, timestamp) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .outputOptions(['-q:v 2'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Get video duration
 */
async function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
}

module.exports = {
  extractFrames,
  extractFrameAt,
  getVideoDuration,
  getVideoStreamUrl
};
```

### 4. Update Python Script for Stream URL
Add to `youtube_analyzer.py`:

```python
def get_stream_url(video_id):
    """Get direct video stream URL for frame extraction"""
    ydl_opts = {
        'format': 'best[height<=720]',  # Limit to 720p for faster processing
        'quiet': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        url = f"https://www.youtube.com/watch?v={video_id}"
        info = ydl.extract_info(url, download=False)
        return {
            "success": True,
            "url": info['url'],
            "duration": info['duration']
        }
```

CLI usage:
```bash
python youtube_analyzer.py stream dQw4w9WgXcQ
```

### 5. Create Frame Extraction Service
Create `/home/pgc/vidlyx/server/src/services/frameExtractionService.js`:

```javascript
const { extractFrames, getVideoStreamUrl } = require('../utils/ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const db = require('./db');

const FRAMES_DIR = process.env.FRAMES_DIR || './frames';

async function extractVideoFrames(video, options = {}) {
  const {
    interval = 5,  // Extract frame every 5 seconds
    maxFrames = 200 // Limit total frames
  } = options;

  // Create video-specific directory
  const videoFramesDir = path.join(FRAMES_DIR, video.id);
  await fs.mkdir(videoFramesDir, { recursive: true });

  // Get video stream URL
  const streamInfo = await getVideoStreamUrl(video.youtube_id);

  // Calculate how many frames we'll extract
  const frameCount = Math.min(
    Math.floor(video.duration / interval),
    maxFrames
  );

  // Extract frames
  await extractFrames(streamInfo.url, videoFramesDir, {
    interval,
    quality: 2,
    width: 1280
  });

  // Get list of extracted frames
  const files = await fs.readdir(videoFramesDir);
  const frameFiles = files.filter(f => f.endsWith('.jpg')).sort();

  // Create frame records in database
  const frames = [];
  for (let i = 0; i < frameFiles.length; i++) {
    const timestamp = i * interval;
    const frame = await insertFrame(video.id, {
      timestamp_seconds: timestamp,
      frame_path: path.join(videoFramesDir, frameFiles[i]),
      is_keyframe: false
    });
    frames.push(frame);
  }

  return frames;
}

async function insertFrame(videoId, data) {
  const query = `
    INSERT INTO frames (video_id, timestamp_seconds, frame_path, is_keyframe)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query(query, [
    videoId,
    data.timestamp_seconds,
    data.frame_path,
    data.is_keyframe
  ]);
  return result.rows[0];
}

async function getFramesByVideoId(videoId) {
  const query = `
    SELECT * FROM frames
    WHERE video_id = $1
    ORDER BY timestamp_seconds ASC
  `;
  const result = await db.query(query, [videoId]);
  return result.rows;
}

module.exports = {
  extractVideoFrames,
  getFramesByVideoId,
  insertFrame
};
```

### 6. Create Frame Routes
Create `/home/pgc/vidlyx/server/src/routes/frameRoutes.js`:

**Endpoints:**
- `GET /api/videos/:id/frames` - List frames for a video
- `GET /api/frames/:frameId` - Get single frame details
- `GET /api/frames/:frameId/image` - Serve frame image file

### 7. Serve Static Frames
In `app.js`, add static file serving:

```javascript
const express = require('express');
const path = require('path');

// Serve frame images
app.use('/frames', express.static(path.join(__dirname, '../frames')));
```

Or create a route to serve frames with authentication:
```javascript
app.get('/api/frames/:frameId/image', requireAuth, async (req, res) => {
  const frame = await frameService.getFrameById(req.params.frameId);
  if (!frame) return res.status(404).json({ error: 'Frame not found' });

  res.sendFile(path.resolve(frame.frame_path));
});
```

### 8. Test Frame Extraction
Create a test script:

```javascript
// test-frames.js
const frameService = require('./src/services/frameExtractionService');

const testVideo = {
  id: 'test-video-id',
  youtube_id: 'dQw4w9WgXcQ',
  duration: 212 // 3:32
};

frameService.extractVideoFrames(testVideo, { interval: 10 })
  .then(frames => console.log(`Extracted ${frames.length} frames`))
  .catch(console.error);
```

Run:
```bash
node test-frames.js
```

## Verification

### FFmpeg Test:
```bash
# Test FFmpeg can extract from a local video
ffmpeg -i test.mp4 -vf "fps=1/5" -q:v 2 frame_%04d.jpg
```

### Stream URL Test:
```bash
python youtube_analyzer.py stream dQw4w9WgXcQ
```

Should return JSON with video URL.

### Full Integration Test:
1. Create a new video analysis
2. Trigger frame extraction
3. Check frames directory for extracted images
4. Query `/api/videos/:id/frames` for frame list

### Database Check:
```sql
SELECT COUNT(*) FROM frames WHERE video_id = 'your-video-id';
```

## Next Steps
Proceed to Task 3 - Subtask 2 (Frame Extraction Worker)

## Estimated Time
2-3 hours

## Notes
- YouTube stream URLs expire after ~6 hours
- 720p is a good balance of quality and speed
- 5-second intervals = ~120 frames for 10-minute video
- Consider extracting keyframes for scene changes
- Store frame paths, not the images themselves in DB
