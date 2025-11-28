# Task 2 - Subtask 1: YouTube URL Input and Validation

## Objective
Create the video input interface where users can paste YouTube URLs and validate them.

## Prerequisites
- Task 1 completed (Project foundation)
- Frontend and backend running
- User authentication working

## Instructions

### 1. Create YouTube Utility Functions
Create `/home/pgc/vidlyx/server/src/utils/youtube.js`:

**Functions to implement:**

`extractVideoId(url)`:
- Accept various YouTube URL formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
  - `https://www.youtube.com/v/VIDEO_ID`
- Extract and return the 11-character video ID
- Return null if invalid

`isValidYouTubeUrl(url)`:
- Check if URL is a valid YouTube URL
- Return boolean

`buildYouTubeUrl(videoId)`:
- Build standard watch URL from video ID

### 2. Create Video Routes
Create `/home/pgc/vidlyx/server/src/routes/videoRoutes.js`:

**Endpoints:**
- `POST /api/videos` - Create/analyze new video
- `GET /api/videos` - List user's videos
- `GET /api/videos/:id` - Get single video details
- `DELETE /api/videos/:id` - Delete video and all associated data

### 3. Backend: Validate YouTube URL Endpoint
`POST /api/videos`:

Request body:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Validation steps:
1. Extract video ID from URL
2. Check if valid YouTube URL format
3. Check if video already exists for this user (by youtube_id)
4. If exists, return existing video
5. If new, create video record with status: 'pending'

Response:
```json
{
  "id": "uuid",
  "youtube_id": "dQw4w9WgXcQ",
  "status": "pending",
  "created_at": "..."
}
```

### 4. Create Video Service
Create `/home/pgc/vidlyx/server/src/services/videoService.js`:

**Functions:**
- `createVideo(userId, youtubeId)` - Insert new video record
- `findVideoByYoutubeId(userId, youtubeId)` - Find existing video
- `findVideoById(videoId)` - Get video by ID
- `findVideosByUser(userId, options)` - List user's videos with pagination
- `updateVideoStatus(videoId, status)` - Update analysis status
- `deleteVideo(videoId)` - Delete video and cascade to related data

### 5. Frontend: Create Video Input Component
Create `/home/pgc/vidlyx/dashboard/src/components/Video/VideoInput.js`:

**UI Elements:**
- Large input field for URL paste
- Placeholder text: "Paste a YouTube URL to analyze..."
- "Analyze" button
- Loading state while validating
- Error message display for invalid URLs
- Clear button (X icon)

**Behavior:**
- Auto-detect when valid URL is pasted
- Show video thumbnail preview after validation (optional)
- Submit on Enter key or button click
- Disable button while loading

### 6. Frontend: Create New Analysis Page
Create `/home/pgc/vidlyx/dashboard/src/pages/app/NewAnalysis.js`:

**Layout:**
```
┌─────────────────────────────────────────┐
│           Analyze a Video               │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🎬 Paste YouTube URL here...     │  │
│  └───────────────────────────────────┘  │
│                                         │
│            [Analyze Video]              │
│                                         │
│  Supported formats:                     │
│  • youtube.com/watch?v=...             │
│  • youtu.be/...                        │
│                                         │
└─────────────────────────────────────────┘
```

**After URL submission:**
- Redirect to `/app/video/:id` to show analysis progress

### 7. Frontend: Video Service
Create `/home/pgc/vidlyx/dashboard/src/services/videoService.js`:

```javascript
import api from './api';

export const videoService = {
  create: (url) => api.post('/videos', { url }),
  getAll: (params) => api.get('/videos', { params }),
  getById: (id) => api.get(`/videos/${id}`),
  delete: (id) => api.delete(`/videos/${id}`)
};
```

### 8. Add Route in App.js
Add the new analysis route:
```jsx
<Route path="new" element={<NewAnalysis />} />
```

### 9. Update Dashboard Quick Actions
Add "Analyze New Video" button that links to `/app/new`.

## Verification

### Backend Test:
```bash
# Test valid URL
curl -X POST http://localhost:4051/api/videos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Test invalid URL
curl -X POST http://localhost:4051/api/videos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"url":"https://example.com/not-youtube"}'
```

### Frontend Test:
1. Navigate to `/app/new`
2. Paste a valid YouTube URL
3. Click "Analyze"
4. Should redirect to video analysis page
5. Try invalid URL - should show error message

## Next Steps
Proceed to Task 2 - Subtask 2 (Integrate Python youtube_analyzer.py)

## Estimated Time
1-2 hours

## Notes
- Video ID is always 11 characters
- Handle URL with extra parameters (timestamp, playlist, etc.)
- Consider rate limiting video creation per user
- Store the original URL for reference
