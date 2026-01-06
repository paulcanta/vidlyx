# Frame Analysis Pipeline

Complete documentation for the Frame Analysis Pipeline implementation in Vidlyx.

## Overview

The Frame Analysis Pipeline is a comprehensive system for analyzing video frames through multiple stages:
1. **Frame Extraction** - Extract frames from videos at regular intervals
2. **OCR Processing** - Extract text from frames using Tesseract
3. **Vision Analysis** - Analyze frames using Gemini Vision API
4. **Post-Processing** - Identify keyframes and generate visual overview

## Architecture

### Files Created

#### Configuration
- `/server/src/config/analysisConfig.js` - Centralized configuration for all analysis parameters

#### Services
- `/server/src/services/frameAnalysisPipeline.js` - Main pipeline orchestration service

#### Workers
- `/server/src/jobs/frameAnalysisPipelineWorker.js` - Bull queue worker for background processing

#### Database Migrations
- `/database/migrations/add_analysis_columns_to_frames.sql` - Adds OCR and vision columns to frames table
- `/database/migrations/add_result_to_analysis_jobs.sql` - Adds result column to analysis_jobs table
- `/database/migrations/add_visual_overview_to_videos.sql` - Adds visual_overview column to videos table
- `/database/migrations/task3_subtask5_migrations.sql` - Consolidated migration script

#### Routes
- `POST /api/videos/:id/analyze-frames` - Start frame analysis pipeline
- `GET /api/videos/:id/analysis-status` - Get detailed pipeline status

## Pipeline Steps

### Step 1: Frame Extraction (0-30%)

Extracts frames from the video at specified intervals using FFmpeg.

**Options:**
- `frameInterval` - Seconds between frames (default: 5)
- `maxFrames` - Maximum frames to extract (default: 200)
- `quality` - JPEG quality 1-31 (default: 2)
- `width` - Output width in pixels (default: 1280)

**Database Updates:**
- Creates frame records in `frames` table
- Stores frame_path, timestamp_seconds

### Step 2: OCR Processing (30-60%)

Processes all extracted frames with Tesseract OCR to extract on-screen text.

**Options:**
- `ocrEnabled` - Enable/disable OCR (default: true)

**Database Updates:**
- `on_screen_text` - Extracted text content
- `ocr_confidence` - Confidence score (0-100)
- `ocr_words` - Detailed word-level data with bounding boxes

**Features:**
- Parallel processing with worker pool (2 workers default)
- Progress tracking per frame
- Error handling for individual frames

### Step 3: Vision Analysis (60-95%)

Analyzes frames using Gemini Vision API for content understanding.

**Options:**
- `visionEnabled` - Enable/disable vision analysis (default: true)
- `visionSampleRate` - Analyze every Nth frame (default: 3)

**Database Updates:**
- `scene_description` - AI-generated scene description
- `visual_elements` - Detected visual elements
- `content_type` - Content classification (code, presentation_slide, diagram, etc.)
- `raw_analysis` - Full API response

**Features:**
- Smart sampling to reduce API calls
- Daily rate limit enforcement (1500 calls/day)
- Usage tracking and statistics
- Retry logic for failed requests

### Step 4: Post-Processing (95-98%)

Identifies keyframes and generates visual overview summary.

**Features:**
- Keyframe detection based on:
  - Content type changes
  - Significant text changes
  - Important content types (code, diagrams, etc.)
- Visual overview generation:
  - Content type distribution
  - Keyframe statistics
  - Temporal analysis

**Database Updates:**
- `is_keyframe` - Boolean flag for keyframes
- `visual_overview` - Aggregated summary in videos table

### Step 5: Complete (98-100%)

Finalizes the pipeline and updates video status.

**Video Status Transitions:**
- Start: `analyzing_frames`
- Success: `frames_analyzed`
- Failure: `frame_analysis_failed`

## API Usage

### Start Frame Analysis Pipeline

```bash
POST /api/videos/:id/analyze-frames
```

**Request Body:**
```json
{
  "frameInterval": 5,
  "maxFrames": 200,
  "ocrEnabled": true,
  "visionEnabled": true,
  "visionSampleRate": 3
}
```

**Response:**
```json
{
  "message": "Frame analysis pipeline started",
  "job": {
    "id": "uuid",
    "video_id": "uuid",
    "job_type": "frame-analysis-pipeline",
    "status": "pending",
    "progress": 0,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

### Get Pipeline Status

```bash
GET /api/videos/:id/analysis-status
```

**Response:**
```json
{
  "videoId": "uuid",
  "status": "analyzing_frames",
  "frames": {
    "total": 120,
    "ocrProcessed": 120,
    "visionAnalyzed": 40,
    "keyframes": 15,
    "contentTyped": 100
  },
  "progress": {
    "extraction": 100,
    "ocr": 100,
    "vision": 33
  },
  "video": {
    "id": "uuid",
    "title": "Video Title",
    "status": "analyzing_frames",
    "visualOverview": {
      "totalFrames": 120,
      "totalKeyframes": 15,
      "dominantContentType": "presentation_slide",
      "contentTypes": [...]
    }
  }
}
```

## Configuration

Default configuration is located in `/server/src/config/analysisConfig.js`.

### Frame Extraction Config
```javascript
frameExtraction: {
  defaultInterval: 5,
  maxFrames: 200,
  quality: 2,
  width: 1280
}
```

### OCR Config
```javascript
ocr: {
  enabled: true,
  minConfidence: 60,
  language: 'eng',
  workerCount: 2
}
```

### Vision Analysis Config
```javascript
vision: {
  enabled: true,
  sampleRate: 3,
  maxFrames: 40,
  dailyLimit: 1500,
  model: 'gemini-1.5-flash'
}
```

### Keyframe Detection Config
```javascript
keyframe: {
  detectOnContentTypeChange: true,
  detectOnTextChange: true,
  textSimilarityThreshold: 0.7,
  importantContentTypes: [
    'code',
    'diagram',
    'chart',
    'presentation_slide',
    'title_screen'
  ]
}
```

## Database Schema

### Frames Table Columns

```sql
-- OCR Analysis
ocr_confidence DECIMAL(5, 2)      -- OCR confidence (0-100)
ocr_words JSONB                   -- Word-level OCR data
on_screen_text TEXT               -- Extracted text

-- Vision Analysis
content_type VARCHAR(100)         -- Content classification
scene_description TEXT            -- Scene description
visual_elements JSONB             -- Visual elements detected
raw_analysis JSONB                -- Full API response

-- Keyframe Detection
is_keyframe BOOLEAN               -- Keyframe flag
```

### Videos Table Columns

```sql
visual_overview JSONB             -- Aggregated analysis summary
analysis_status VARCHAR(50)       -- Pipeline status
```

### Analysis Jobs Table Columns

```sql
result JSONB                      -- Job result data
progress INTEGER                  -- Progress percentage (0-100)
status VARCHAR(50)                -- Job status
error_message TEXT                -- Error details
```

## Progress Tracking

The pipeline reports progress through callbacks:

```javascript
onProgress: (progress, step, message) => {
  console.log(`${step}: ${progress}% - ${message}`);
}
```

Progress ranges:
- EXTRACT: 0-30%
- OCR: 30-60%
- VISION: 60-95%
- POST_PROCESS: 95-98%
- COMPLETE: 98-100%

## Error Handling

### Retry Logic
- Frame extraction: 3 retries with exponential backoff
- Vision API: 3 retries per frame
- OCR: Continues on individual frame failures

### Status Updates
- Video status updated at each major step
- Job status updated continuously
- Error messages stored in database

### Graceful Degradation
- OCR can be disabled if failing
- Vision analysis can be disabled
- Pipeline continues with available data

## Performance Optimization

### Parallel Processing
- OCR uses worker pool (2 workers default)
- Frames processed in parallel batches

### Smart Sampling
- Vision analysis samples every Nth frame (default: 3)
- Reduces API calls by 66%
- Maintains coverage of video content

### Rate Limiting
- Daily API limit tracking
- In-memory usage cache
- Database-backed persistence

### Resource Management
- Cleanup of old jobs (24 hours for completed)
- Frame file management
- Worker lifecycle management

## Monitoring

### Queue Health
```javascript
const { getQueueHealth } = require('./jobs/queue');
const health = await getQueueHealth();
```

### Usage Statistics
```javascript
const stats = await visionAnalysisService.getUsageStats();
// Returns: callsToday, remainingToday, dailyLimit, percentUsed
```

### Pipeline Status
```javascript
const status = await frameAnalysisPipeline.getPipelineStatus(videoId);
// Returns: frame counts, progress percentages, status
```

## Testing

### Manual Testing

1. **Start Pipeline:**
   ```bash
   curl -X POST http://localhost:4051/api/videos/{videoId}/analyze-frames \
     -H "Content-Type: application/json" \
     -d '{"frameInterval": 5, "maxFrames": 50}'
   ```

2. **Check Status:**
   ```bash
   curl http://localhost:4051/api/videos/{videoId}/analysis-status
   ```

3. **Monitor Jobs:**
   ```bash
   curl http://localhost:4051/api/videos/{videoId}/jobs
   ```

### Integration Testing

The pipeline integrates with:
- Frame Extraction Service
- OCR Service
- Vision Analysis Service
- Video Service
- Bull Queue System

## Troubleshooting

### Common Issues

1. **OCR Workers Not Initializing:**
   - Check Tesseract installation
   - Verify worker count configuration

2. **Vision API Limit Reached:**
   - Check usage stats
   - Adjust visionSampleRate
   - Wait for daily reset

3. **Pipeline Stalled:**
   - Check Bull queue status
   - Verify Redis connection
   - Check worker logs

4. **Keyframes Not Detected:**
   - Verify vision analysis completed
   - Check content_type values
   - Adjust similarity threshold

### Debug Logging

Enable detailed logging:
```javascript
// In frameAnalysisPipeline.js
console.log('[Pipeline] ...');  // Main pipeline logs
console.log('[PostProcess] ...'); // Post-processing logs
console.log('[Keyframes] ...'); // Keyframe detection logs
console.log('[VisualOverview] ...'); // Overview generation logs
```

## Future Enhancements

- [ ] Thumbnail generation for keyframes
- [ ] Scene boundary detection
- [ ] Object tracking across frames
- [ ] Audio synchronization
- [ ] Custom content type training
- [ ] Multi-language OCR support
- [ ] Video segment analysis
- [ ] Real-time progress streaming via WebSocket

## Related Documentation

- [OCR Service Documentation](./OCR_SERVICE.md)
- [Vision Analysis Documentation](./GEMINI_API_ROUTES.md)
- [Queue System Documentation](./QUEUE_SYSTEM.md)
- [Database Schema](../database/schema.sql)
