# Gemini Vision API Routes - Quick Reference

## Available Endpoints

### 1. Analyze Video Frames
**POST** `/api/videos/:id/frames/analyze-vision`

Triggers Gemini Vision analysis for video frames using intelligent sampling.

**Request Body:**
```json
{
  "samplingRate": 3,     // Analyze every Nth frame (default: 3)
  "maxFrames": 40        // Maximum frames to analyze (default: 40)
}
```

**Response:**
```json
{
  "message": "Vision analysis started",
  "videoId": "uuid",
  "estimatedFrames": 40
}
```

**Notes:**
- Requires authentication
- Frames must be extracted first
- Processes in background
- Respects daily quota (1500 calls/day)

---

### 2. Get Frames with Analysis
**GET** `/api/videos/:id/frames/analysis`

Retrieves frames with vision analysis data.

**Query Parameters:**
- `limit` - Number of frames to return (default: 50)
- `offset` - Pagination offset (default: 0)
- `onlyWithAnalysis` - Only return analyzed frames (default: false)

**Response:**
```json
{
  "frames": [
    {
      "id": "uuid",
      "video_id": "uuid",
      "timestamp_seconds": 5.5,
      "frame_path": "/path/to/frame.jpg",
      "scene_description": "A person presenting a tutorial...",
      "visual_elements": {
        "objects": ["laptop", "desk"],
        "people": ["presenter in casual attire"],
        "text_elements": ["title overlay"],
        "colors": ["blue", "white"],
        "composition": "centered subject"
      },
      "on_screen_text": "Tutorial Title",
      "content_type": "tutorial",
      "raw_analysis": {...}
    }
  ],
  "pagination": {
    "total": 120,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "summary": {
    "videoId": "uuid",
    "totalFrames": 120,
    "analyzedFrames": 40,
    "categorizedFrames": 40,
    "contentTypes": ["tutorial"],
    "analysisComplete": false,
    "percentageAnalyzed": 33
  }
}
```

---

### 3. Get Analysis Summary
**GET** `/api/videos/:id/frames/analysis-summary`

Returns a summary of vision analysis for a video.

**Response:**
```json
{
  "videoId": "uuid",
  "totalFrames": 120,
  "analyzedFrames": 40,
  "categorizedFrames": 40,
  "contentTypes": ["tutorial", "presentation"],
  "analysisComplete": false,
  "percentageAnalyzed": 33
}
```

---

### 4. Get API Usage Stats
**GET** `/api/usage`

Returns current Gemini API usage statistics and quota information.

**Response:**
```json
{
  "usage": {
    "date": "2025-11-28",
    "callsToday": 45,
    "remainingToday": 1455,
    "dailyLimit": 1500,
    "percentUsed": 3
  },
  "quota": {
    "service": "Gemini 1.5 Flash",
    "tier": "Free",
    "limits": {
      "rpm": 15,
      "rpd": 1500,
      "rateLimit": "15 RPM",
      "dailyLimit": "1500 RPD"
    },
    "rateLimitDelay": "4 seconds",
    "configured": true,
    "initialized": true
  },
  "timestamp": "2025-11-28T12:00:00.000Z"
}
```

---

## Content Types

The Gemini API categorizes frames into these content types:
- `tutorial` - Educational/how-to content
- `presentation` - Slides or formal presentations
- `gaming` - Video game footage
- `vlog` - Video blog/personal content
- `documentary` - Documentary footage
- `entertainment` - Entertainment content
- `educational` - Educational content
- `commercial` - Advertisements
- `news` - News footage
- `other` - Uncategorized content

---

## Rate Limits & Quotas

**Free Tier Limits:**
- 15 requests per minute (RPM)
- 1500 requests per day (RPD)
- 4 second delay enforced between calls

**Usage Tracking:**
- Automatic tracking via `/api/usage`
- In-memory + database persistence
- Daily reset at midnight UTC

---

## Example Workflow

```bash
# 1. Upload a video
curl -X POST http://localhost:4051/api/videos/upload \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -F "video=@video.mp4"

# 2. Extract frames
curl -X POST http://localhost:4051/api/videos/{videoId}/frames/extract \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"interval": 5, "maxFrames": 120}'

# 3. Run vision analysis
curl -X POST http://localhost:4051/api/videos/{videoId}/frames/analyze-vision \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"samplingRate": 3, "maxFrames": 40}'

# 4. Get analyzed frames
curl http://localhost:4051/api/videos/{videoId}/frames/analysis?onlyWithAnalysis=true \
  -H "Cookie: connect.sid=YOUR_SESSION"

# 5. Check usage
curl http://localhost:4051/api/usage \
  -H "Cookie: connect.sid=YOUR_SESSION"
```

---

## Error Responses

### API Key Not Configured
```json
{
  "error": "GEMINI_API_KEY not configured in environment variables"
}
```

### Daily Limit Exceeded
```json
{
  "error": "Daily Gemini API limit reached (1500 calls per day)"
}
```

### No Frames Found
```json
{
  "error": "No frames found for this video. Extract frames first."
}
```

### Video Not Found
```json
{
  "error": "Video not found"
}
```

### Access Denied
```json
{
  "error": "Access denied"
}
```

---

## Configuration

Set the API key in `/home/pgc/vidlyx/server/.env`:

```env
GEMINI_API_KEY=your-actual-api-key-here
```

Get an API key from: https://makersuite.google.com/app/apikey

---

## Testing

Test the integration:
```bash
cd /home/pgc/vidlyx/server
node test-gemini-integration.js
```

---

## Performance Tips

1. **Sampling Rate**: Increase to analyze fewer frames (e.g., `samplingRate: 5`)
2. **Max Frames**: Reduce for faster analysis (e.g., `maxFrames: 20`)
3. **Monitor Usage**: Check `/api/usage` before bulk operations
4. **Background Processing**: All analysis runs asynchronously
5. **Batch Wisely**: Respect the 1500/day limit for multiple videos

---

## Support

- Check server logs for detailed error messages
- Verify API key configuration
- Monitor usage with `/api/usage`
- Review `/home/pgc/vidlyx/GEMINI_VISION_API_INTEGRATION.md` for full documentation
