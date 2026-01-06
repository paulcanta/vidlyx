# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vidlyx is a SaaS platform for multimodal video analysis. Users input YouTube URLs and the platform analyzes both visual frames AND audio content using AI, providing synchronized transcription, frame-by-frame visual analysis, and AI-generated summaries.

## Development Commands

### Backend (Express Server)
```bash
cd server
npm install          # Install dependencies
npm run dev          # Start with nodemon (development)
npm start            # Start without hot reload
```

### Frontend (React Dashboard)
```bash
cd dashboard
npm install          # Install dependencies
npm start            # Start dev server (port 4050)
npm run build        # Production build
npm test             # Run tests
```

### Python Services
```bash
cd python
source venv/bin/activate
pip install -r requirements.txt

# CLI commands for youtube_analyzer.py:
python scripts/youtube_analyzer.py metadata <video_id>    # Get video metadata
python scripts/youtube_analyzer.py transcript <video_id>  # Get transcript
python scripts/youtube_analyzer.py stream <video_id>      # Get stream URL for FFmpeg
```

### Frontend Testing
```bash
cd dashboard
npm test                           # Run all tests in watch mode
npm test -- --watchAll=false       # Run all tests once (CI mode)
npm test -- MyComponent            # Run tests matching pattern
npm test -- --coverage             # Run with coverage report
```

### Database
```bash
# Verify schema
./database/verify-schema.sh

# Connect to database (uses Docker container)
docker exec -it -e PGPASSWORD=$DB_PASSWORD \
  timecloq-postgres-core \
  psql -U timecloq_admin -d vidlyx_dev

# Apply schema
docker exec -i -e PGPASSWORD=$DB_PASSWORD \
  timecloq-postgres-core \
  psql -U timecloq_admin -d vidlyx_dev < database/schema.sql
```

Note: `DB_PASSWORD` is set in `server/.env`. The verify-schema.sh script has the password hardcoded for convenience.

## Ports

| Service | Port |
|---------|------|
| Frontend (React) | 4050 |
| Backend (Express) | 4051 |
| PostgreSQL | 5432 |

## Architecture

### Video Analysis Pipeline
The core data flow is: YouTube URL → Python metadata/transcript extraction → Frame extraction (FFmpeg) → OCR (Tesseract.js) → Vision analysis (Gemini) → Section detection → Summary generation

The pipeline is orchestrated by `frameAnalysisPipeline.js` which runs these steps:
1. **EXTRACT (0-30%):** Frame extraction via FFmpeg from YouTube stream
2. **OCR (30-60%):** On-screen text extraction with Tesseract.js
3. **VISION (60-90%):** AI scene analysis via Gemini API
4. **POST_PROCESS (90-100%):** Correlation linking and keyframe identification

### Backend (`server/`)
- **Entry:** `src/app.js` - Express server with session middleware, CORS, helmet security
- **Routes:** `src/routes/` - API endpoints (auth, videos, frames, sections, folders, tags, saves, search, export)
- **Services:** `src/services/` - Business logic organized by domain:
  - **YouTube Integration:** `youtubeService.js`, `pythonService.js`
  - **Frame Processing:** `frameExtractionService.js`, `ocrService.js`, `visionAnalysisService.js`, `frameAnalysisPipeline.js`
  - **AI Services:** `geminiService.js` (vision), `summaryService.js`, `sectionDetectionService.js`
  - **Data Correlation:** `correlationService.js`, `linkageService.js`
  - **Organization:** `saveService.js`, `folderService.js`, `tagService.js`
  - **Search/Export:** `searchService.js`, `exportService.js`
- **Jobs:** `src/jobs/` - Bull queue workers for background frame extraction
- **Config:** `src/config/analysisConfig.js` - Pipeline configuration and rate limits

### Frontend (`dashboard/`)
- **Entry:** `src/App.js` - React Router with lazy-loaded routes for code splitting
- **Pages:** `src/pages/`
  - `Dashboard` - Overview and recent videos
  - `NewVideo` - YouTube URL input and analysis trigger
  - `VideoAnalysis` - Main analysis view with player, transcript, frames, timeline, summary
  - `Collection` - Saved content with folder/tag organization
  - `SaveView` - Individual save detail view
- **Contexts:** `src/contexts/`
  - `AuthContext` - Authentication state
  - `ShortcutsContext` - Keyboard shortcuts (global)
  - `DragDropContext`, `SelectionContext` - UI interactions
  - `ToastContext` - Notifications
- **Services:** `src/services/` - API client functions mirroring backend routes

### Python (`python/`)
- `scripts/youtube_analyzer.py` - CLI tool for YouTube data extraction
  - Uses yt-dlp for metadata and stream URLs
  - Uses youtube-transcript-api for transcripts (manual preferred over auto-generated)
  - Called from backend via `pythonService.js` using `python-shell`

### Real-time Updates
- Socket.io provides real-time progress updates during video analysis
- The frontend subscribes to analysis progress events in the VideoAnalysis page
- Progress flows: `frameAnalysisPipeline.js` → Socket.io → React state

### Database (`database/`)
- PostgreSQL with uuid-ossp and pg_trgm extensions
- **Core tables:** users, sessions, videos, transcriptions, frames, sections, video_summaries
- **Organization:** saves, folders, tags with junction tables (save_frames, save_folders, save_tags, save_transcripts, save_summaries)
- **Background jobs:** analysis_jobs table tracks pipeline progress
- Full-text search via pg_trgm trigram indexes on transcription text and frame OCR

## Key Technologies

- **AI:** Google Gemini (gemini-1.5-flash) for vision analysis - 1500 req/day free tier limit; Anthropic Claude SDK available
- **OCR:** Tesseract.js for on-screen text extraction (2 workers, 60% min confidence)
- **Video:** fluent-ffmpeg for frame extraction, YouTube IFrame API for playback
- **Queue:** Bull with Redis for background jobs
- **Session:** express-session with connect-pg-simple
- **Frontend:** React 19 with React Router v7, @dnd-kit for drag-and-drop, Phosphor icons, Socket.io-client for real-time updates

## API Routes Reference

| Endpoint | Description |
|----------|-------------|
| `/api/auth/*` | Authentication (login, register, logout, session) |
| `/api/videos/*` | Video CRUD, analysis trigger, metadata |
| `/api/videos/:id/frames/*` | Frame extraction, retrieval, analysis |
| `/api/sections/*` | Video sections with summaries |
| `/api/folders/*` | Folder CRUD and organization |
| `/api/tags/*` | Tag CRUD |
| `/api/saves/*` | Save creation and management |
| `/api/search/*` | Full-text search across transcripts and frames |
| `/api/export/*` | Export to MD, PDF, JSON, TXT |
| `/api/home/*` | Dashboard data |
| `/api/regenerate/*` | Regenerate AI summaries |

## Frontend Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public landing page |
| `/login`, `/register` | Auth | Authentication pages |
| `/app` | Home | Dashboard with recent videos |
| `/app/videos` | Videos | All user videos |
| `/app/new` | NewVideo | YouTube URL input |
| `/app/video/:id` | VideoAnalysis | Main analysis view |
| `/app/collection` | Collection | Saved content |
| `/app/collection/save/:saveId` | SaveView | Individual save detail |
| `/app/settings` | Settings | User settings |

## Pipeline Configuration Defaults

Key defaults in `server/src/config/analysisConfig.js`:
- Frame extraction: 5-second intervals, max 200 frames, 1280px width
- Vision analysis: every 3rd frame analyzed, max 40 frames/video
- OCR: 60% minimum confidence threshold, English language

## Environment Variables

Required in `server/.env`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption key
- `GEMINI_API_KEY` - Google Gemini API key
- `REDIS_HOST`, `REDIS_PORT` - Redis for Bull queues
- `FRAMES_DIR`, `UPLOADS_DIR` - File storage paths

Required in `dashboard/.env`:
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:4051)

## QA Logging (IMPORTANT - All Agents Must Follow)

**All agents (main and subagents) MUST update `/home/pgc/vidlyx/qa.md` when:**
- Finding a bug or error
- Fixing an issue
- Making UI/UX improvements
- Encountering and resolving any problem

**Format:** Latest entries first. **Include current timestamp (YYYY-MM-DD HH:MM)** with each entry.

**Getting accurate timestamp:** Always run `date '+%Y-%m-%d %H:%M'` to get the current time. Do NOT estimate.

**Why:** Multiple Claude Code windows are used simultaneously. This log keeps everyone aligned on what bugs were found and what fixes were applied.

```markdown
### [YYYY-MM-DD HH:MM] [Fix/Bug/Issue]: Brief description
**Status:** [Fixed/In Progress/Investigating]
**File(s):** `path/to/file.js`
**Issue:** Describe what was wrong
**Root Cause:** (if known) Why it happened
**Fix:** What was done to resolve it
```

## Task Documentation

Development tasks are documented in `tasks/` directory, organized as task1-8 with subtasks. See `tasks/README.md` for the complete task breakdown and dependencies.
