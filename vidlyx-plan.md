# Vidlyx - Product Requirements Document (PRD)

## Executive Summary

**Vidlyx** is a SaaS platform for **multimodal video analysis and content dissection**. Users can input public video links (starting with YouTube for MVP), play videos directly in the browser, and leverage AI to analyze **both visual frames AND audio content** simultaneously. The platform synchronizes what is being shown on screen with what is being said, providing timestamped transcription, frame-by-frame visual analysis, AI-generated summaries per segment, and the ability to save and organize analyzed content.

**Key Differentiator:** Unlike simple transcription tools, Vidlyx understands the *complete* content by analyzing video frames to match visual context with spoken words—detecting on-screen text, diagrams, demonstrations, and correlating them with the transcript.

---

## Problem Statement

Content creators, researchers, educators, and analysts frequently need to:
- Extract specific moments from long-form video content
- **Understand what is being SHOWN, not just what is being SAID**
- Reference exact timestamps when discussing video content
- Capture and annotate visual frames for documentation
- **Get AI-powered summaries of video segments**
- **Correlate on-screen visuals (text, diagrams, demos) with audio narration**
- Organize extracted content in a meaningful structure

Currently, this requires multiple disconnected tools (screenshot software, transcription services, note-taking apps, manual correlation), leading to a fragmented and time-consuming workflow. **No existing tool provides unified visual + audio analysis.**

---

## Solution

Vidlyx provides an all-in-one platform that consolidates **multimodal video analysis** into a single, intuitive interface:

1. **Play** - Embed and control video playback
2. **Transcribe** - Extract timestamped text from YouTube subtitles (FREE via yt-dlp)
3. **Analyze Visuals** - AI-powered frame-by-frame image analysis
4. **Synchronize** - Match visual content with audio/transcript
5. **Summarize** - Generate AI summaries per video segment/part
6. **Save** - Save any content (frames, transcript selections, summary excerpts) to your Collection
7. **Organize** - Group Saves into folders within your Collection

---

## Target Users (MVP)

- **Content Creators** - Analyzing competitor videos, planning reaction content, understanding tutorial structures
- **Researchers** - Documenting video evidence, extracting quotes with visual context
- **Students/Educators** - Creating comprehensive study notes from lectures with slide content
- **Social Media Managers** - Extracting highlights with full context for repurposing
- **Marketers** - Analyzing competitor ads/videos for visual + messaging strategies

---

## Tech Stack

### Backend (Node.js - Matching mailwatch)
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | v22.17.1 | Runtime |
| Express.js | ^4.19.2 | HTTP Framework |
| PostgreSQL | 14+ | Database |
| pg | ^8.16.3 | PostgreSQL client |
| bcrypt | ^6.0.0 | Password hashing |
| express-session | latest | Session management |
| connect-pg-simple | ^10.0.0 | Session store |
| helmet | ^8.1.0 | Security headers |
| cors | ^2.8.5 | CORS handling |
| express-rate-limit | ^8.2.1 | Rate limiting |
| socket.io | ^4.7.5 | Real-time updates |
| sharp | ^0.33.5 | Image processing |
| dotenv | ^17.2.2 | Environment variables |
| uuid | ^13.0.0 | ID generation |

### Python Services (Existing Implementation)
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12.3 | Runtime |
| yt-dlp | 2025.10.22 | Video metadata + subtitle extraction |
| youtube-transcript-api | 1.2.3 | Fallback transcript extraction |

### Frontend (React - Matching mailwatch)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^18.2.0 | UI Framework |
| React DOM | ^18.2.0 | DOM rendering |
| react-scripts | 5.0.1 | Build tooling (CRA) |
| React Router | ^7.9.3 | Routing |
| Axios | ^1.12.2 | HTTP client |
| @phosphor-icons/react | ^2.x | Premium icon library |
| recharts | ^2.x | Charts for admin dashboard |
| Custom CSS | - | Styling (no framework) |

### AI Services (FREE Options for Vidlyx)

#### Option A: Google Gemini (RECOMMENDED - FREE Tier)
| Technology | Purpose | Cost | Limits |
|------------|---------|------|--------|
| Gemini 1.5 Flash | Vision + Text analysis | **FREE** | 15 RPM, 1M tokens/day, 1500 req/day |
| Gemini 1.5 Pro | Complex analysis (fallback) | **FREE** | 2 RPM, 50 req/day |

#### Option B: Local Models (100% FREE - No Limits)
| Technology | Purpose | Requirements |
|------------|---------|--------------|
| Ollama + LLaVA | Vision analysis | 8GB+ VRAM GPU |
| Ollama + Llama 3.1 | Summaries, correlation | 8GB+ RAM |
| Ollama + Moondream | Lightweight vision | 4GB RAM (CPU ok) |

#### Option C: Hybrid (FREE)
| Component | Service | Cost |
|-----------|---------|------|
| OCR (on-screen text) | Tesseract/EasyOCR (local) | FREE |
| Scene detection | Local CV (OpenCV) | FREE |
| Vision analysis | Gemini Flash | FREE |
| Summaries | Gemini Flash or local Llama | FREE |

### Additional Node.js Dependencies
| Technology | Version | Purpose |
|------------|---------|---------|
| fluent-ffmpeg | ^2.1.2 | Video frame extraction |
| @google/generative-ai | ^0.x | Gemini API client (FREE) |
| bull | ^4.x | Background job queue |
| python-shell | ^5.x | Execute Python scripts from Node |
| tesseract.js | ^5.x | Browser/Node OCR (FREE) |

### Additional Python Dependencies (FREE)
| Technology | Purpose |
|------------|---------|
| easyocr | OCR for on-screen text extraction |
| opencv-python | Scene detection, frame differencing |
| ollama | Local LLM client (optional) |

---

## Core Features (MVP)

### 1. Video Input & Playback

**User Story:** As a user, I want to paste a YouTube URL and watch the video directly in Vidlyx so I can analyze it without leaving the platform.

**Requirements:**
- URL input field with validation (YouTube URL format)
- YouTube iframe Player API integration for embedded playback
- Custom player controls overlay:
  - Play/Pause
  - Seek bar with timestamp display
  - Volume control
  - Playback speed (0.5x, 1x, 1.25x, 1.5x, 2x)
  - Fullscreen toggle
- Video metadata display (title, duration, channel name)
- Recent videos history (last 10 videos)

**Technical Notes:**
- Use YouTube IFrame Player API for legal compliance
- Extract video metadata using existing `youtube_analyzer.py`
- Store video metadata in database for quick re-access

---

### 2. Audio-to-Text Transcription (FREE - Using Existing Implementation)

**User Story:** As a user, I want to see the video's audio converted to text with timestamps so I can search and reference specific spoken content.

**Requirements:**
- Automatic transcription extraction on video load
- Transcription display panel:
  - Scrollable text with timestamps
  - Click timestamp to seek video to that moment
  - Highlight current segment during playback (sync)
  - Search within transcription
  - Copy transcription (full or selected)
- Segment structure with timestamps:
  ```
  [00:00:15] "Welcome to today's video..."
  [00:00:23] "We're going to cover three main topics..."
  ```
- Export transcription as TXT, SRT, or JSON

**Technical Implementation (Existing from /home/pgc/workspace/vidlyx/):**
```python
# Uses yt-dlp to extract YouTube's native subtitles (FREE!)
# Primary: yt-dlp with JSON3 subtitle parsing
# Fallback: youtube-transcript-api

# Output format:
{
  "transcript": {
    "full_text": "concatenated transcript text",
    "timestamped": [
      {
        "time": "MM:SS",
        "timestamp": 15.0,  # seconds
        "text": "segment text",
        "duration": 3.5    # seconds
      }
    ]
  },
  "transcript_type": "manual|auto"
}
```

**Advantages of Existing Approach:**
- **FREE** - No API costs (uses YouTube's existing subtitles)
- **Fast** - No audio processing, direct subtitle download
- **Accurate** - Uses manual subtitles when available
- **Proven** - Already tested and working

---

### 3. Frame-by-Frame Visual Analysis (NEW - Core Feature)

**User Story:** As a user, I want AI to analyze what is being SHOWN in the video (not just what's being said) so I can understand visual content like slides, demos, diagrams, and on-screen text.

**Requirements:**
- **Automatic Frame Extraction:** Extract key frames at configurable intervals (e.g., every 5 seconds, or at scene changes)
- **AI Vision Analysis:** For each extracted frame, use GPT-4 Vision to analyze:
  - On-screen text (OCR)
  - Visual elements (diagrams, charts, UI screenshots)
  - Scene description (what's happening visually)
  - People/objects detection
  - Slide/presentation content
- **Frame Analysis Output:**
  ```json
  {
    "timestamp": 45.0,
    "frame_url": "/frames/video_id/frame_45.jpg",
    "analysis": {
      "on_screen_text": ["Title: Introduction to APIs", "Bullet: REST vs GraphQL"],
      "scene_type": "presentation_slide",
      "description": "A presentation slide showing comparison between REST and GraphQL APIs with a two-column layout",
      "visual_elements": ["comparison_table", "code_snippet", "diagram"],
      "detected_objects": ["laptop", "presenter_hand"],
      "confidence": 0.94
    }
  }
  ```
- **Frame Gallery:** Visual timeline of extracted frames with analysis summaries
- **Searchable:** Search across frame analyses ("find slides about authentication")

**Technical Implementation (FREE using Gemini + Tesseract):**
```javascript
// Frame extraction using ffmpeg
// 1. Download video segment or use YouTube storyboard
// 2. Extract frames at intervals using ffmpeg
// 3. Run local OCR with Tesseract (FREE)
// 4. Send to Gemini Flash for vision analysis (FREE)
// 5. Store analysis in database

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Tesseract = require('tesseract.js');

// Step 1: Local OCR (completely FREE, no API)
const extractText = async (frameBuffer) => {
  const { data: { text } } = await Tesseract.recognize(frameBuffer, 'eng');
  return text.split('\n').filter(line => line.trim());
};

// Step 2: Gemini Vision Analysis (FREE tier)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeFrame = async (frameBuffer, timestamp, ocrText) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Analyze this video frame:
    OCR detected text: ${ocrText.join(', ')}

    Provide:
    1. Scene type (presentation, demo, talking_head, screencast, outdoors, etc)
    2. Visual elements present (diagrams, code, UI, people, etc)
    3. Brief description of what's shown (1-2 sentences)

    Return as JSON: { "scene_type": "", "visual_elements": [], "description": "" }`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType: "image/jpeg", data: frameBuffer.toString('base64') }}
  ]);

  return {
    on_screen_text: ocrText,
    ...JSON.parse(result.response.text())
  };
};
```

**Frame Extraction Strategy:**
1. **Keyframe Detection:** Extract frames at scene changes (using ffmpeg scene detection)
2. **Fixed Interval:** Extract every N seconds (configurable: 3s, 5s, 10s)
3. **Transcript-Aligned:** Extract frame at start of each transcript segment
4. **Manual Capture:** User-triggered frame capture at current timestamp

---

### 4. Audio-Visual Synchronization & Correlation (NEW - Core Feature)

**User Story:** As a user, I want to see how the visual content relates to what is being said, so I can understand the complete context of the video.

**Requirements:**
- **Synchronized Timeline View:**
  - Dual-track timeline showing both transcript segments AND frame analyses
  - Visual indicators connecting related content
  - Click to jump to any point in either track

- **Correlation Analysis:**
  ```json
  {
    "segment_id": "seg_123",
    "timestamp_range": [45.0, 52.0],
    "transcript_text": "As you can see in this diagram, REST uses resource-based URLs...",
    "visual_context": {
      "frames": ["frame_45", "frame_48", "frame_51"],
      "on_screen_text": ["REST API", "/users/{id}", "GET, POST, PUT, DELETE"],
      "visual_summary": "Presenter showing REST API diagram with HTTP methods"
    },
    "correlation": {
      "match_score": 0.89,
      "correlation_type": "direct_reference", // or "supporting_visual", "unrelated"
      "explanation": "Speaker is directly explaining the diagram shown on screen"
    }
  }
  ```

- **Visual Context Panel:**
  - When reading transcript, show relevant frame(s) for that segment
  - Highlight on-screen text that matches spoken words
  - Show "What's on screen" summary alongside transcript

**Technical Implementation (FREE using Gemini):**
```javascript
// Correlation algorithm using Gemini Flash (FREE)
const correlateSegment = async (transcriptSegment, nearbyFrames) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze the relationship between spoken content and visual content:

    SPOKEN TEXT (${transcriptSegment.start_time}s - ${transcriptSegment.end_time}s):
    "${transcriptSegment.text}"

    VISUAL CONTEXT (from nearby frames):
    ${nearbyFrames.map(f => `[${f.timestamp}s] Scene: ${f.scene_type}, Text on screen: ${f.on_screen_text?.join(', ') || 'none'}, Description: ${f.description}`).join('\n')}

    Return JSON:
    {
      "match_score": 0.0-1.0,
      "correlation_type": "direct_reference|supporting_visual|unrelated",
      "explanation": "brief explanation"
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
```

---

### 5. AI-Powered Summaries Per Part/Segment (NEW - Core Feature)

**User Story:** As a user, I want AI-generated summaries for different parts of the video so I can quickly understand the content without watching the entire video.

**Requirements:**
- **Automatic Section Detection:**
  - Detect natural breaks/sections in the video
  - Use transcript + visual changes to identify topic shifts
  - Allow manual section creation

- **Summary Types:**
  1. **Segment Summary:** Brief summary of each detected section (2-3 sentences)
  2. **Part Summary:** Detailed summary with key points for user-selected clips
  3. **Full Video Summary:** Executive summary + key takeaways
  4. **Visual Summary:** Summary of what was SHOWN (slides, demos, diagrams)

- **Summary Output Format:**
  ```json
  {
    "video_id": "abc123",
    "full_summary": {
      "executive_summary": "This 15-minute video covers...",
      "key_takeaways": ["Point 1", "Point 2", "Point 3"],
      "topics_covered": ["REST APIs", "Authentication", "Best Practices"]
    },
    "sections": [
      {
        "section_id": "sec_1",
        "title": "Introduction",
        "timestamp_range": [0, 120],
        "summary": "The presenter introduces the topic of API design...",
        "visual_summary": "Title slide followed by agenda overview",
        "key_points": ["APIs are essential for modern apps", "REST vs GraphQL comparison coming"],
        "on_screen_content": ["Title: API Design 101", "Agenda: 1. Intro, 2. REST, 3. GraphQL"]
      },
      {
        "section_id": "sec_2",
        "title": "REST API Fundamentals",
        "timestamp_range": [120, 420],
        "summary": "Detailed explanation of REST principles including...",
        "visual_summary": "Code examples and architecture diagrams",
        "key_points": ["Resource-based URLs", "HTTP methods", "Stateless design"],
        "on_screen_content": ["GET /users", "POST /users", "REST diagram"]
      }
    ]
  }
  ```

- **Summary Panel UI:**
  - Collapsible sections in sidebar
  - Click section to jump to that timestamp
  - Show visual + audio summary side by side
  - Export summaries as markdown/PDF

**Technical Implementation (FREE using Gemini):**
```javascript
// Section detection using transcript + frame changes
const detectSections = async (transcript, frameAnalyses) => {
  // 1. Use OpenCV for scene change detection (FREE, local)
  // 2. Find topic shifts in transcript using Gemini (FREE)
  // 3. Merge overlapping boundaries
  // 4. Generate section titles with Gemini (FREE)
};

// Summary generation using Gemini Flash (FREE)
const generateSectionSummary = async (section) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this video section and generate a summary:

    SPOKEN CONTENT (${section.start_time}s - ${section.end_time}s):
    ${section.transcript_text}

    VISUAL CONTENT:
    ${section.frames.map(f => `[${f.timestamp}s] ${f.description}`).join('\n')}

    ON-SCREEN TEXT DETECTED:
    ${[...new Set(section.frames.flatMap(f => f.on_screen_text || []))].join(', ')}

    Return JSON:
    {
      "title": "suggested section title",
      "summary": "2-3 sentence summary combining audio and visual",
      "visual_summary": "brief description of what was shown",
      "key_points": ["point 1", "point 2", "point 3"],
      "topics": ["topic1", "topic2"]
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};

// Full video summary (FREE)
const generateVideoSummary = async (sections, metadata) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Generate an executive summary for this video:

    TITLE: ${metadata.title}
    CHANNEL: ${metadata.channel}
    DURATION: ${metadata.duration_seconds}s

    SECTIONS:
    ${sections.map(s => `- ${s.title}: ${s.summary}`).join('\n')}

    Return JSON:
    {
      "executive_summary": "2-3 sentence overview",
      "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
      "topics_covered": ["topic1", "topic2"],
      "visual_overview": "summary of visual content shown"
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
```

---

### 6. Save System & Collection

**User Story:** As a user, I want to save any content from the video (frames, transcript text, summary excerpts) to my personal Collection, and organize them into folders so I can reference and reuse them later.

**Requirements:**

**What Can Be Saved:**
- **Frames:** Single or multiple frames from the video (with timestamps)
- **Transcript Selections:** Highlighted text from the transcription panel
- **Summary Excerpts:** Selected portions from AI-generated summaries
- **Combined Saves:** Mix of frames + text in a single Save

**Save Creation:**
- "Save" button accessible from any content panel
- Keyboard shortcut: `S` key to quick-save current selection
- Multi-select mode: Hold `Shift` to select multiple frames
- Text selection: Highlight text in transcript/summary panels → "Save Selection" appears
- Each Save includes:
  - Auto-generated title (editable)
  - Source video reference
  - Timestamps for all included content
  - User notes/annotations field
  - Tags

**Collection & Organization:**
- **Collection:** Central library where all Saves live
- **Folders:** User-created flat groupings (single level, no nesting)
- **Multi-folder placement:** Same Save can exist in multiple folders (linked, not duplicated)
- **Uncategorized:** Saves without folder assignment appear in root Collection

**Save Object Structure:**
```json
{
  "save_id": "save_abc123",
  "title": "REST API Explanation",
  "source_video": {
    "video_id": "vid_xyz",
    "title": "API Design 101"
  },
  "content": {
    "frames": [
      { "timestamp": 45.0, "image_path": "/frames/..." },
      { "timestamp": 48.0, "image_path": "/frames/..." }
    ],
    "transcript_selections": [
      { "start": 44.5, "end": 52.0, "text": "REST uses resource-based URLs..." }
    ],
    "summary_selections": [
      { "section_id": "sec_2", "text": "Key point about REST principles..." }
    ]
  },
  "folders": ["folder_id_1", "folder_id_2"],
  "tags": ["api", "rest", "tutorial"],
  "notes": "Good example for my blog post",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Technical Notes:**
- Many-to-many relationship between Saves and Folders
- Saves store references to content, not duplicates
- Deleting from one folder doesn't delete the Save (unless removed from all folders)

---

### 7. Video Segment Selection (Range Selection for Saves)

**User Story:** As a user, I want to select a time range from the video and save everything within that range (frames, transcript, summary) as a comprehensive Save.

**Requirements:**
- Range selection mode:
  - "Mark Start" button (or `I` key)
  - "Mark End" button (or `O` key)
  - Visual indicator on seek bar showing selected range
- **Auto-generated Save content** for selected range:
  - All key frames within the range
  - Complete transcript excerpt for the range
  - Relevant summary content
  - AI-generated title
  - Key points from the segment
- Save metadata form:
  - Title (auto-generated, editable)
  - Description/notes
  - Tags (free-form)
  - Folder selection (optional)
- Saved range displays:
  - Thumbnail (key frame)
  - Duration
  - Content preview (frames + text)
  - Visual + audio context summary

---

### 8. Collection & Folder Organization

**User Story:** As a user, I want to view all my Saves in my Collection and organize them into a flexible folder structure that matches how I think.

**Requirements:**

**Collection View (Main Library):**
- Grid/List view toggle
- Filter by:
  - Source video
  - Content type (frames only, text only, mixed)
  - Date range
  - Tags
  - Folder (or "Uncategorized")
- Sort by: date created, date modified, video, title
- **Full-text search** across all Save content (frames OCR, transcript text, summaries, notes)

**Folder System:**
- Create folder with name, optional color, and optional icon
- **Flat folder structure** (single level, no nesting)
- Folder list navigation in sidebar
- Drag-and-drop:
  - Saves into folders
  - Saves into multiple folders (creates link, not copy)
- Rename/delete folders (Saves inside move to Uncategorized)

**Multi-Folder Support:**
- Same Save can exist in multiple folders simultaneously
- "Add to Folder" action shows folder picker with checkboxes
- Save card shows folder badges/tags indicating all locations
- Removing from one folder doesn't delete the Save

**Bulk Operations:**
- Multi-select Saves (checkbox or Shift+click)
- Bulk actions:
  - Add to folder(s)
  - Remove from current folder
  - Add/remove tags
  - Delete permanently
  - Export selected

---

### 9. Video Analysis Dashboard

**User Story:** As a user, I want to see all my analyzed data for a single video in one comprehensive view.

**Requirements:**
- **Three-Panel Layout:**
  ```
  +------------------+------------------+------------------+
  |                  |                  |                  |
  |   VIDEO PLAYER   |   TRANSCRIPT     |   SUMMARIES      |
  |                  |   (synced)       |   (by section)   |
  |                  |                  |                  |
  +------------------+------------------+------------------+
  |                                                        |
  |              FRAME ANALYSIS TIMELINE                   |
  |   [frame1] [frame2] [frame3] [frame4] [frame5] ...    |
  |                                                        |
  +--------------------------------------------------------+
  ```
- **Synchronized Playback:**
  - Transcript auto-scrolls and highlights current segment
  - Frame timeline highlights current visual context
  - Section summary panel shows current section
- **Export Options:**
  - Full analysis report (PDF/Markdown)
  - All frames with analyses (ZIP)
  - Complete transcript (TXT/SRT)
  - Structured data (JSON)

---

## User Authentication & Accounts

### Authentication (Matching mailwatch pattern)
- Session-based authentication with PostgreSQL session store
- HTTP-only cookies
- bcrypt password hashing (10 salt rounds)
- 30-day session expiration
- **Users MUST register and login before accessing ANY features**
- No guest/anonymous access to the app

### User Features
- Registration with email/password
- Login/logout
- Password change
- Account deletion (with data cleanup)
- Theme preference (light/dark/system)

### Access Control

| Route | Access Level | Notes |
|-------|--------------|-------|
| `/` (Landing) | Public | Anyone can view |
| `/login`, `/register` | Public | Redirect to `/app` if logged in |
| `/app/*` | Authenticated | Redirect to `/login` if not logged in |
| `/admin/*` | Admin only | 403 if not admin |

---

## Admin Dashboard

The admin dashboard provides visibility into platform usage, user behavior, and system health. Only users with `is_admin: true` can access.

### Admin Access Requirements
- Separate admin role in database (`users.is_admin` boolean)
- Admin routes protected by middleware
- No public registration for admin accounts (created manually or via seed)

### Admin Dashboard Features

**1. Overview / Home**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD - Overview                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  KEY METRICS (Cards)                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ Total Users  │ │ Active Today │ │ Videos       │ │ Saves       ││
│  │     847      │ │     124      │ │ Analyzed     │ │ Created     ││
│  │  ↑ 12% week  │ │  ↑ 8% week   │ │    2,341     │ │   18,492    ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘│
│                                                                      │
│  CHARTS                                                             │
│  ┌─────────────────────────────────┐ ┌────────────────────────────┐│
│  │ User Registrations (30 days)    │ │ Videos Analyzed (30 days)  ││
│  │ [Line chart]                    │ │ [Bar chart]                ││
│  └─────────────────────────────────┘ └────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────┐ ┌────────────────────────────┐│
│  │ Active Users (DAU/WAU/MAU)      │ │ API Usage / Gemini Calls   ││
│  │ [Area chart]                    │ │ [Line chart with limit]    ││
│  └─────────────────────────────────┘ └────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**2. User Management**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN - Users                                    [Export CSV]       │
├─────────────────────────────────────────────────────────────────────┤
│  Search: [________________]  Filter: [All ▼] [Active ▼] [Date ▼]   │
├─────────────────────────────────────────────────────────────────────┤
│  Email              │ Registered  │ Last Active │ Videos │ Status  │
│  ────────────────────────────────────────────────────────────────── │
│  user@example.com   │ 2025-01-15  │ 2 hours ago │   12   │ Active  │
│  another@email.com  │ 2025-01-14  │ 3 days ago  │    5   │ Active  │
│  test@test.com      │ 2025-01-10  │ Never       │    0   │ Inactive│
│  ...                │             │             │        │         │
├─────────────────────────────────────────────────────────────────────┤
│  Showing 1-25 of 847                        [< Prev] [1] [2] [Next >]│
└─────────────────────────────────────────────────────────────────────┘
```

**User Detail View:**
- Account info (email, registration date, last login)
- Usage statistics (videos analyzed, saves created, storage used)
- Activity log (recent actions)
- Admin actions: Disable account, Delete account, Reset password link

**3. Analytics & Metrics**

| Metric | Description | Visualization |
|--------|-------------|---------------|
| **User Growth** | New registrations over time | Line chart |
| **Active Users** | DAU, WAU, MAU trends | Area chart |
| **Retention** | Users returning after 1/7/30 days | Cohort table |
| **Videos Analyzed** | Total and per-user average | Bar chart |
| **Saves Created** | Saves per day, popular content types | Stacked bar |
| **Feature Usage** | Which features are used most | Pie/bar chart |
| **API Usage** | Gemini API calls, tokens used | Line with threshold |
| **Error Rate** | Failed analyses, API errors | Line chart |

**4. Registration Attempts & Funnel**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN - Registration Funnel                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FUNNEL VISUALIZATION                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Landing Page Visits        ████████████████████████  10,234  │   │
│  │ Clicked "Sign Up"          ████████████████          3,847   │   │
│  │ Started Registration       ██████████████            2,156   │   │
│  │ Completed Registration     ████████████              1,247   │   │
│  │ First Video Analyzed       ████████                    892   │   │
│  │ Created First Save         ██████                      634   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  REGISTRATION ATTEMPTS LOG                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Time        │ Email            │ Status     │ Error         │   │
│  │ 10:45:23    │ new@user.com     │ Success    │ -             │   │
│  │ 10:42:11    │ spam@bot.com     │ Failed     │ Rate limited  │   │
│  │ 10:38:05    │ test@email.com   │ Failed     │ Email exists  │   │
│  │ 10:35:22    │ real@person.com  │ Success    │ -             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**5. System Health**

| Monitor | What it Shows |
|---------|---------------|
| **API Status** | Gemini API health, response times |
| **Job Queue** | Pending/processing/failed analysis jobs |
| **Storage** | Disk usage for frame storage |
| **Database** | Connection pool, query performance |
| **Error Logs** | Recent errors with stack traces |

**6. Content Moderation (Future)**
- Flag suspicious content
- Review reported items
- User ban capabilities

### Admin Database Schema Additions

```sql
-- Add admin flag to users
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,  -- 'page_view', 'registration', 'video_analyzed', 'save_created', etc.
    event_data JSONB,                  -- Additional event-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registration attempts (including failures)
CREATE TABLE registration_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    status VARCHAR(20) NOT NULL,      -- 'success', 'failed', 'pending'
    failure_reason VARCHAR(100),       -- 'email_exists', 'rate_limited', 'invalid_email', etc.
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily aggregated metrics (for fast dashboard loading)
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    videos_analyzed INTEGER DEFAULT 0,
    saves_created INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    api_tokens_used INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_registration_attempts_created ON registration_attempts(created_at);
CREATE INDEX idx_registration_attempts_status ON registration_attempts(status);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
```

### Admin API Routes

```
# Admin Authentication
GET    /api/admin/me                    - Get current admin user

# Dashboard Overview
GET    /api/admin/stats/overview        - Key metrics (users, videos, saves)
GET    /api/admin/stats/charts          - Chart data (registrations, activity)

# User Management
GET    /api/admin/users                 - List users (paginated, filterable)
GET    /api/admin/users/:id             - Get user details
PUT    /api/admin/users/:id/status      - Enable/disable user
DELETE /api/admin/users/:id             - Delete user and data
GET    /api/admin/users/:id/activity    - User activity log

# Analytics
GET    /api/admin/analytics/funnel      - Registration funnel data
GET    /api/admin/analytics/retention   - Retention cohorts
GET    /api/admin/analytics/features    - Feature usage breakdown
GET    /api/admin/analytics/events      - Raw events log (paginated)

# Registration Monitoring
GET    /api/admin/registrations         - Registration attempts log
GET    /api/admin/registrations/stats   - Success/failure rates

# System Health
GET    /api/admin/health                - System health status
GET    /api/admin/health/jobs           - Job queue status
GET    /api/admin/health/api            - External API status (Gemini)
GET    /api/admin/health/errors         - Recent errors log

# Export
GET    /api/admin/export/users          - Export users as CSV
GET    /api/admin/export/analytics      - Export analytics as CSV
```

### Admin Frontend Routes

```
/admin                      - Admin dashboard (overview)
/admin/users                - User management list
/admin/users/:id            - User detail view
/admin/analytics            - Analytics & charts
/admin/registrations        - Registration monitoring
/admin/health               - System health
/admin/settings             - Admin settings
```

### Admin UI Notes

- Admin dashboard uses the **same design system** as main app (not a separate theme)
- Dark mode support in admin as well
- Data tables should be sortable, filterable, exportable
- Charts use a lightweight library (e.g., Recharts or Chart.js)
- Real-time updates for key metrics (WebSocket or polling)
- Mobile-responsive but optimized for desktop use

---

## Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table (cached video metadata)
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    youtube_id VARCHAR(20) NOT NULL,
    title TEXT,
    channel_name VARCHAR(255),
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    description TEXT,
    tags TEXT[], -- PostgreSQL array
    analysis_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, youtube_id)
);

-- Transcriptions table (from YouTube subtitles)
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    full_text TEXT,
    transcript_type VARCHAR(20), -- 'manual' or 'auto'
    language VARCHAR(10) DEFAULT 'en',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Transcription segments (timestamped chunks)
CREATE TABLE transcription_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    start_time DECIMAL(10,3) NOT NULL,
    end_time DECIMAL(10,3) NOT NULL,
    text TEXT NOT NULL,
    duration DECIMAL(10,3),
    segment_index INTEGER NOT NULL
);

-- Extracted frames with AI analysis
CREATE TABLE frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp_seconds DECIMAL(10,3) NOT NULL,
    image_path TEXT, -- local path or S3 URL
    extraction_type VARCHAR(20), -- 'auto', 'manual', 'keyframe'
    -- AI Analysis fields
    analysis_status VARCHAR(20) DEFAULT 'pending',
    on_screen_text TEXT[], -- PostgreSQL array of detected text
    scene_type VARCHAR(50), -- 'presentation', 'demo', 'talking_head', etc
    scene_description TEXT,
    visual_elements TEXT[], -- detected elements
    detected_objects TEXT[],
    analysis_confidence DECIMAL(3,2),
    raw_analysis JSONB, -- full GPT-4V response
    -- Correlation
    related_segment_id UUID REFERENCES transcription_segments(id),
    correlation_score DECIMAL(3,2),
    correlation_type VARCHAR(30),
    -- Organization
    notes TEXT,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video sections (auto-detected or manual)
CREATE TABLE video_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    title VARCHAR(255),
    start_time DECIMAL(10,3) NOT NULL,
    end_time DECIMAL(10,3) NOT NULL,
    section_index INTEGER NOT NULL,
    detection_type VARCHAR(20), -- 'auto' or 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Section summaries (AI-generated)
CREATE TABLE section_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES video_sections(id) ON DELETE CASCADE,
    summary_text TEXT,
    visual_summary TEXT,
    key_points TEXT[], -- PostgreSQL array
    on_screen_content TEXT[],
    topics TEXT[],
    raw_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full video summary
CREATE TABLE video_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    executive_summary TEXT,
    key_takeaways TEXT[],
    topics_covered TEXT[],
    visual_overview TEXT,
    raw_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders for organization (flat structure, no nesting)
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saves (user's saved content from videos - the core of Collection)
CREATE TABLE saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    title VARCHAR(255),
    auto_title VARCHAR(255),
    -- Content type flags
    has_frames BOOLEAN DEFAULT FALSE,
    has_transcript BOOLEAN DEFAULT FALSE,
    has_summary BOOLEAN DEFAULT FALSE,
    -- Time range (if saved from range selection)
    start_time DECIMAL(10,3),
    end_time DECIMAL(10,3),
    -- AI-generated content
    ai_summary TEXT,
    key_points TEXT[],
    -- User content
    notes TEXT,
    thumbnail_path TEXT,
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Save content: frames
CREATE TABLE save_frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
    frame_id UUID REFERENCES frames(id) ON DELETE CASCADE,
    timestamp_seconds DECIMAL(10,3) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Save content: transcript selections
CREATE TABLE save_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES transcription_segments(id) ON DELETE SET NULL,
    start_time DECIMAL(10,3) NOT NULL,
    end_time DECIMAL(10,3) NOT NULL,
    selected_text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Save content: summary selections
CREATE TABLE save_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
    section_summary_id UUID REFERENCES section_summaries(id) ON DELETE SET NULL,
    video_summary_id UUID REFERENCES video_summaries(id) ON DELETE SET NULL,
    selected_text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Many-to-many: Saves can be in multiple folders
CREATE TABLE save_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(save_id, folder_id)
);

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    UNIQUE(user_id, name)
);

-- Save tags (direct relationship)
CREATE TABLE save_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    save_id UUID REFERENCES saves(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(save_id, tag_id)
);

-- Analysis job queue
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    job_type VARCHAR(30) NOT NULL, -- 'transcription', 'frame_extraction', 'frame_analysis', 'summary'
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    progress INTEGER DEFAULT 0, -- 0-100
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for express-session)
CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_videos_analysis_status ON videos(analysis_status);
CREATE INDEX idx_transcriptions_video_id ON transcriptions(video_id);
CREATE INDEX idx_transcription_segments_transcription_id ON transcription_segments(transcription_id);
CREATE INDEX idx_transcription_segments_time ON transcription_segments(start_time, end_time);
CREATE INDEX idx_frames_video_id ON frames(video_id);
CREATE INDEX idx_frames_user_id ON frames(user_id);
CREATE INDEX idx_frames_timestamp ON frames(timestamp_seconds);
CREATE INDEX idx_frames_folder_id ON frames(folder_id);
CREATE INDEX idx_frames_analysis_status ON frames(analysis_status);
CREATE INDEX idx_video_sections_video_id ON video_sections(video_id);
CREATE INDEX idx_section_summaries_section_id ON section_summaries(section_id);
CREATE INDEX idx_video_summaries_video_id ON video_summaries(video_id);
CREATE INDEX idx_saves_user_id ON saves(user_id);
CREATE INDEX idx_saves_video_id ON saves(video_id);
CREATE INDEX idx_save_frames_save_id ON save_frames(save_id);
CREATE INDEX idx_save_frames_frame_id ON save_frames(frame_id);
CREATE INDEX idx_save_transcripts_save_id ON save_transcripts(save_id);
CREATE INDEX idx_save_summaries_save_id ON save_summaries(save_id);
CREATE INDEX idx_save_folders_save_id ON save_folders(save_id);
CREATE INDEX idx_save_folders_folder_id ON save_folders(folder_id);
CREATE INDEX idx_save_tags_save_id ON save_tags(save_id);
CREATE INDEX idx_save_tags_tag_id ON save_tags(tag_id);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_analysis_jobs_video_id ON analysis_jobs(video_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- Full-text search indexes
CREATE INDEX idx_transcriptions_fulltext ON transcriptions USING gin(to_tsvector('english', full_text));
CREATE INDEX idx_frames_onscreen_text ON frames USING gin(on_screen_text);
CREATE INDEX idx_frames_description ON frames USING gin(to_tsvector('english', scene_description));
```

---

## API Routes

### Authentication
```
POST   /api/auth/register          - Create new account
POST   /api/auth/login             - Login
POST   /api/auth/logout            - Logout
GET    /api/auth/me                - Get current user
PUT    /api/auth/password          - Update password
DELETE /api/auth/account           - Delete account and data
```

### Videos
```
POST   /api/videos                 - Add video by YouTube URL (triggers analysis)
GET    /api/videos                 - List user's videos
GET    /api/videos/:id             - Get video with all analysis data
DELETE /api/videos/:id             - Remove video and associated data
POST   /api/videos/:id/reanalyze   - Re-run analysis on video
GET    /api/videos/:id/export      - Export all video data as ZIP
```

### Analysis & Processing
```
GET    /api/videos/:id/status      - Get analysis job status
POST   /api/videos/:id/analyze     - Trigger full analysis pipeline
GET    /api/jobs/:id               - Get specific job status
```

### Transcriptions
```
GET    /api/videos/:id/transcription - Get transcription with segments
GET    /api/videos/:id/transcription/search - Search within transcript
GET    /api/transcriptions/:id/export - Export as TXT/SRT/JSON
```

### Frames & Visual Analysis
```
GET    /api/videos/:id/frames      - Get all analyzed frames for video
POST   /api/videos/:id/frames      - Manual frame capture at timestamp
GET    /api/frames/:id             - Get frame with full analysis
PUT    /api/frames/:id             - Update frame notes/folder
DELETE /api/frames/:id             - Delete frame
GET    /api/frames/search          - Search across frame analyses
```

### Sections & Summaries
```
GET    /api/videos/:id/sections    - Get detected sections with summaries
POST   /api/videos/:id/sections    - Create manual section
PUT    /api/sections/:id           - Update section
DELETE /api/sections/:id           - Delete section
POST   /api/sections/:id/summarize - Re-generate summary for section
GET    /api/videos/:id/summary     - Get full video summary
POST   /api/videos/:id/summary     - Generate/regenerate video summary
```

### Saves (Collection)
```
POST   /api/saves                  - Create new Save (with frames/transcript/summary selections)
GET    /api/saves                  - List all Saves (with filters: folder, video, tags, type)
GET    /api/saves/:id              - Get Save with all content
PUT    /api/saves/:id              - Update Save metadata (title, notes)
DELETE /api/saves/:id              - Delete Save permanently
POST   /api/saves/:id/folders      - Add Save to folder(s)
DELETE /api/saves/:id/folders/:folderId - Remove Save from folder
POST   /api/saves/:id/tags         - Add tags to Save
DELETE /api/saves/:id/tags/:tagId  - Remove tag from Save
POST   /api/saves/bulk             - Bulk operations (add to folder, delete, tag)
```

### Folders
```
POST   /api/folders                - Create folder
GET    /api/folders                - List all folders (flat list)
GET    /api/folders/:id            - Get folder with its Saves
PUT    /api/folders/:id            - Update folder (name, color, icon)
DELETE /api/folders/:id            - Delete folder (Saves move to uncategorized)
```

### Tags
```
POST   /api/tags                   - Create tag
GET    /api/tags                   - List all tags (with usage counts)
PUT    /api/tags/:id               - Update tag (name, color)
DELETE /api/tags/:id               - Delete tag (removes from all Saves)
```

### Collection & Search
```
GET    /api/collection             - Get all Saves with filters/sorting/pagination
GET    /api/collection/search      - Full-text search across all content (Saves, transcripts, summaries, OCR)
GET    /api/collection/stats       - Get collection statistics (total Saves, by type, by folder)
```

---

## Frontend Routes

### Public Routes (No Auth)
```
/                           - Landing page (public)
/login                      - Login page (redirect to /app if logged in)
/register                   - Registration page (redirect to /app if logged in)
```

### Protected Routes (Auth Required)
```
/app                        - Main app dashboard
/app/video/:id              - Video analysis page (3-panel layout)
/app/collection             - Collection view (all Saves)
/app/collection/folder/:id  - Folder contents view
/app/collection/save/:id    - Individual Save detail view
/app/collection/search      - Search results view
/app/settings               - User settings (includes theme toggle)
```

### Admin Routes (Admin Only)
```
/admin                      - Admin dashboard overview
/admin/users                - User management
/admin/users/:id            - User detail view
/admin/analytics            - Analytics & metrics
/admin/registrations        - Registration attempts monitoring
/admin/health               - System health & logs
/admin/settings             - Admin settings
```

---

## Project Structure

```
/home/pgc/vidlyx/
├── server/                              # Backend (Node.js)
│   ├── src/
│   │   ├── app.js                      # Express app setup
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── videoRoutes.js
│   │   │   ├── transcriptionRoutes.js
│   │   │   ├── frameRoutes.js
│   │   │   ├── sectionRoutes.js
│   │   │   ├── summaryRoutes.js
│   │   │   ├── saveRoutes.js           # Save CRUD + folder assignment
│   │   │   ├── folderRoutes.js         # Folder management (flat)
│   │   │   ├── tagRoutes.js
│   │   │   ├── collectionRoutes.js     # Collection queries & search
│   │   │   └── adminRoutes.js          # Admin dashboard & management
│   │   ├── services/
│   │   │   ├── db.js                   # PostgreSQL pool
│   │   │   ├── authService.js
│   │   │   ├── youtubeService.js       # Calls Python scripts
│   │   │   ├── transcriptionService.js # Uses yt-dlp via Python
│   │   │   ├── frameExtractionService.js # ffmpeg frame extraction
│   │   │   ├── visionAnalysisService.js  # Gemini Vision analysis
│   │   │   ├── correlationService.js   # Audio-visual correlation
│   │   │   ├── sectionDetectionService.js # Auto section detection
│   │   │   ├── summaryService.js       # Gemini summary generation
│   │   │   ├── saveService.js          # Save CRUD + content management
│   │   │   ├── folderService.js        # Folder management
│   │   │   ├── collectionService.js    # Collection queries
│   │   │   ├── searchService.js        # Full-text search across all content
│   │   │   ├── storageService.js       # Frame image storage
│   │   │   ├── analyticsService.js     # Event tracking & metrics
│   │   │   └── adminService.js         # Admin dashboard data
│   │   ├── middleware/
│   │   │   ├── auth.js                 # Authentication middleware
│   │   │   ├── adminAuth.js            # Admin-only access middleware
│   │   │   ├── analytics.js            # Track user events
│   │   │   └── validation.js
│   │   ├── utils/
│   │   │   ├── youtube.js              # URL parsing
│   │   │   ├── time.js                 # Timestamp formatting
│   │   │   └── ffmpeg.js               # ffmpeg wrapper
│   │   └── jobs/
│   │       ├── analysisQueue.js        # Bull queue setup
│   │       ├── transcriptionWorker.js
│   │       ├── frameExtractionWorker.js
│   │       ├── visionAnalysisWorker.js
│   │       └── summaryWorker.js
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── python/                              # Python services (existing)
│   ├── youtube_analyzer.py             # From /home/pgc/workspace/vidlyx/
│   ├── get_transcript.py               # From /home/pgc/workspace/vidlyx/
│   ├── requirements.txt
│   └── venv/
│
├── dashboard/                           # Frontend (React)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.js              # Public landing page
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── VideoAnalysis.js        # Main 3-panel analysis view
│   │   │   ├── Collection.js           # Collection main view
│   │   │   ├── FolderView.js           # Folder contents view
│   │   │   ├── SaveView.js             # Individual Save detail page
│   │   │   ├── SearchResults.js        # Search results page
│   │   │   ├── Settings.js             # User settings (theme, account)
│   │   │   ├── NotFound.js
│   │   │   └── admin/                  # Admin pages
│   │   │       ├── AdminDashboard.js   # Admin overview
│   │   │       ├── AdminUsers.js       # User management list
│   │   │       ├── AdminUserDetail.js  # User detail view
│   │   │       ├── AdminAnalytics.js   # Analytics & charts
│   │   │       ├── AdminRegistrations.js # Registration monitoring
│   │   │       ├── AdminHealth.js      # System health
│   │   │       └── AdminSettings.js    # Admin settings
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Sidebar.js
│   │   │   │   ├── MainLayout.js
│   │   │   │   └── Layout.css
│   │   │   ├── Video/
│   │   │   │   ├── VideoInput.js
│   │   │   │   ├── VideoPlayer.js
│   │   │   │   ├── PlayerControls.js
│   │   │   │   └── Video.css
│   │   │   ├── Transcription/
│   │   │   │   ├── TranscriptionPanel.js
│   │   │   │   ├── TranscriptionSegment.js
│   │   │   │   ├── TranscriptionSearch.js
│   │   │   │   ├── SyncHighlight.js    # Highlights current segment
│   │   │   │   └── Transcription.css
│   │   │   ├── VisualAnalysis/         # NEW
│   │   │   │   ├── FrameTimeline.js    # Visual frame timeline
│   │   │   │   ├── FrameCard.js        # Single frame with analysis
│   │   │   │   ├── FrameAnalysisPanel.js
│   │   │   │   ├── OnScreenText.js     # OCR results display
│   │   │   │   ├── CorrelationView.js  # Audio-visual correlation
│   │   │   │   └── VisualAnalysis.css
│   │   │   ├── Summaries/              # NEW
│   │   │   │   ├── SummaryPanel.js
│   │   │   │   ├── SectionSummary.js
│   │   │   │   ├── VideoSummary.js
│   │   │   │   ├── KeyPointsList.js
│   │   │   │   └── Summaries.css
│   │   │   ├── Frames/
│   │   │   │   ├── FrameCapture.js
│   │   │   │   ├── FramePreview.js
│   │   │   │   ├── FrameGallery.js
│   │   │   │   └── Frames.css
│   │   │   ├── Save/
│   │   │   │   ├── SaveCreator.js       # Create new Save dialog
│   │   │   │   ├── SaveCard.js          # Save preview card
│   │   │   │   ├── SaveDetail.js        # Full Save view
│   │   │   │   ├── SaveContent.js       # Renders frames/text/summary
│   │   │   │   ├── ContentSelector.js   # Multi-select for frames/text
│   │   │   │   ├── FolderPicker.js      # Multi-folder selection
│   │   │   │   └── Save.css
│   │   │   ├── Collection/
│   │   │   │   ├── CollectionView.js    # Main collection page
│   │   │   │   ├── CollectionGrid.js    # Grid layout for Saves
│   │   │   │   ├── CollectionList.js    # List layout for Saves
│   │   │   │   ├── FolderList.js        # Flat folder navigation
│   │   │   │   ├── SearchResults.js     # Full-text search results
│   │   │   │   ├── BulkActions.js       # Multi-select actions bar
│   │   │   │   └── Collection.css
│   │   │   ├── Common/
│   │   │   │   ├── Button.js
│   │   │   │   ├── Input.js
│   │   │   │   ├── Modal.js
│   │   │   │   ├── Dropdown.js
│   │   │   │   ├── Toast.js
│   │   │   │   ├── ProgressBar.js      # Analysis progress
│   │   │   │   ├── ThemeToggle.js      # Light/Dark/System toggle
│   │   │   │   ├── DataTable.js        # Sortable, filterable tables
│   │   │   │   └── Common.css
│   │   │   └── Admin/                  # Admin-specific components
│   │   │       ├── AdminLayout.js      # Admin page layout
│   │   │       ├── AdminSidebar.js     # Admin navigation
│   │   │       ├── StatsCard.js        # Metric cards
│   │   │       ├── Chart.js            # Recharts wrapper
│   │   │       ├── UserTable.js        # User management table
│   │   │       ├── FunnelChart.js      # Registration funnel
│   │   │       ├── ActivityLog.js      # Event log display
│   │   │       ├── HealthStatus.js     # System health indicators
│   │   │       └── Admin.css
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── videoService.js
│   │   │   ├── transcriptionService.js
│   │   │   ├── frameService.js
│   │   │   ├── analysisService.js
│   │   │   ├── summaryService.js
│   │   │   ├── saveService.js          # Save CRUD operations
│   │   │   ├── folderService.js        # Folder management
│   │   │   ├── collectionService.js    # Collection queries & search
│   │   │   ├── tagService.js           # Tag management
│   │   │   ├── themeService.js         # Theme persistence
│   │   │   └── adminService.js         # Admin API calls
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useVideo.js
│   │   │   ├── useTranscription.js
│   │   │   ├── useAnalysis.js
│   │   │   ├── useSync.js              # Sync playback with panels
│   │   │   ├── useTheme.js             # Theme management hook
│   │   │   ├── useKeyboard.js
│   │   │   └── useAdmin.js             # Admin data hooks
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   ├── VideoContext.js
│   │   │   ├── AnalysisContext.js
│   │   │   └── ThemeContext.js         # Light/Dark mode context
│   │   ├── utils/
│   │   │   ├── youtube.js
│   │   │   ├── time.js
│   │   │   └── validation.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── database/
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
│
├── uploads/                             # Frame images storage
│   └── frames/
│       └── {video_id}/
│           └── frame_{timestamp}.jpg
│
├── docs/
│   └── api.md
│
├── plan.md                              # This PRD
└── README.md
```

---

## Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=4042

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vidlyx_dev
DB_USER=postgres
DB_PASSWORD=password

# Session
SESSION_SECRET=your-super-secret-session-key

# CORS
ALLOWED_ORIGINS=http://localhost:4042,http://localhost:4043

# Google Gemini (FREE - for Vision + Summaries)
GEMINI_API_KEY=your-gemini-api-key

# Python path (for calling existing scripts)
PYTHON_PATH=/home/pgc/workspace/vidlyx/venv_youtube/bin/python
PYTHON_SCRIPTS_PATH=/home/pgc/vidlyx/python

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
FRAMES_PATH=./uploads/frames

# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Analysis Settings
FRAME_EXTRACTION_INTERVAL=5  # seconds
MAX_FRAMES_PER_VIDEO=200
VISION_ANALYSIS_BATCH_SIZE=10
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:4042/api
REACT_APP_WS_URL=ws://localhost:4042
PORT=4043
```

---

## UI/UX Design Principles

### Design Philosophy

Vidlyx should feel like a **premium, human-crafted product**—not a generic AI-generated template. Every interaction should feel intentional, polished, and delightful.

### Core Principles

**1. Purposeful Minimalism**
- Every element earns its place; no decorative clutter
- Generous whitespace for breathing room
- Information hierarchy through typography, not decoration
- Hidden complexity: powerful features revealed progressively

**2. Micro-interactions & Feedback**
- Subtle animations on hover, click, and state changes (60fps, <300ms)
- Skeleton loaders instead of spinners where possible
- Optimistic UI updates with graceful rollback on errors
- Toast notifications that don't interrupt workflow

**3. Professional Color & Typography**
- Restrained color palette: 1 primary, 1 accent, neutrals
- System font stack for performance and native feel
- Clear typographic scale (12/14/16/20/24/32)
- Proper contrast ratios (WCAG AA minimum)

**4. Spatial Consistency**
- 4px/8px grid system for all spacing
- Consistent border radius (4px small, 8px medium, 12px large)
- Predictable component sizing
- Aligned elements create invisible grids

### Anti-Patterns to Avoid (AI-ish Design)

| Avoid | Instead |
|-------|---------|
| Gradients everywhere | Solid colors with subtle shadows |
| Generic stock illustrations | Custom icons or no illustrations |
| Rounded everything (pill buttons) | Subtle rounding (4-8px) |
| Overly colorful | Monochromatic with strategic accent |
| Excessive animations | Purposeful, subtle motion |
| Center-aligned everything | Left-aligned content, balanced layouts |
| Generic sans-serif (Poppins, Nunito) | System fonts or refined choices (Inter, SF Pro) |
| Card soup (everything in cards) | Mixed layouts, tables, lists |
| Too much padding/rounding | Tighter, more information-dense |

### Icon Library (Premium, Human-Crafted)

**AVOID these AI-ish icon sets:**
- Heroicons (overused, recognizable as template)
- Feather Icons (too thin, generic startup look)
- Font Awesome (dated, heavy, recognizable)
- Generic Flaticon/Iconfinder downloads

**RECOMMENDED Premium Icon Libraries:**

| Library | Style | Why It's Premium | License |
|---------|-------|------------------|---------|
| **Phosphor Icons** | Flexible weights (thin to bold) | 6 weights, consistent design, not overused | MIT (Free) |
| **Lucide** | Clean, geometric | Fork of Feather with better consistency, more icons | ISC (Free) |
| **Radix Icons** | Minimal, 15px optimized | Designed for UI, pixel-perfect at small sizes | MIT (Free) |
| **Tabler Icons** | Rounded, friendly | 3000+ icons, consistent stroke width | MIT (Free) |
| **Untitled UI Icons** | Premium SaaS look | Designed by top design agency, modern | Free tier available |

**BEST CHOICE for Vidlyx: Phosphor Icons**
```bash
npm install @phosphor-icons/react
```

```jsx
// Usage - consistent, professional look
import { Play, Pause, BookmarkSimple, FolderOpen, MagnifyingGlass } from '@phosphor-icons/react';

// Weights: thin, light, regular, bold, fill, duotone
<Play size={24} weight="regular" />
<BookmarkSimple size={20} weight="fill" />  // Filled for active state
```

**Icon Usage Guidelines:**
- Use **regular** weight for most UI icons (not thin, not bold)
- Use **fill** weight for active/selected states
- Consistent size: 16px (inline), 20px (buttons), 24px (headers)
- Never mix icon libraries in the same interface
- Icons should be functional, not decorative
- Always pair icons with text labels (accessibility)

### Component Guidelines

**Buttons**
```css
/* Primary action - solid, not gradient */
.btn-primary {
  background: #2563eb;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  transition: background 150ms ease;
}
.btn-primary:hover {
  background: #1d4ed8;
}

/* Secondary - subtle, not outlined */
.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}
```

**Cards & Containers**
```css
/* Subtle elevation, not heavy shadows */
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

/* Hover state - lift, don't glow */
.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}
```

**Form Inputs**
```css
/* Clean, bordered inputs */
.input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 12px;
  transition: border-color 150ms ease;
}
.input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Layout Patterns

**Video Analysis Page (3-Panel)**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Video title, actions (Save, Export, Share)         │
├───────────────────┬─────────────────┬───────────────────────┤
│                   │                 │                       │
│   VIDEO PLAYER    │   TRANSCRIPT    │   SUMMARIES/ANALYSIS  │
│   (resizable)     │   (synced       │   (tabbed:            │
│                   │    scroll)      │    Summary/Frames/    │
│                   │                 │    Visual)            │
│                   │                 │                       │
├───────────────────┴─────────────────┴───────────────────────┤
│  FRAME TIMELINE - horizontal scroll, click to seek          │
└─────────────────────────────────────────────────────────────┘
```

**Collection Page**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Search bar, View toggle (Grid/List), Filters       │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  FOLDER LIST  │   SAVES GRID/LIST                          │
│  (collapsible │   - SaveCard components                    │
│   sidebar)    │   - Infinite scroll or pagination          │
│               │   - Multi-select mode                       │
│   • Folder 1  │                                             │
│   • Folder 2  │   ┌─────┐ ┌─────┐ ┌─────┐                  │
│   • Folder 3  │   │Save1│ │Save2│ │Save3│                  │
│               │   └─────┘ └─────┘ └─────┘                  │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

### Interaction Details

**Save Creation Flow**
1. User selects content (frames, text) → subtle highlight animation
2. "Save" button appears contextually near selection
3. Click Save → slide-up modal (not center popup)
4. Modal shows: preview of selected content, title input, folder picker
5. Folder picker: flat list with checkboxes, "New Folder" inline
6. Save → modal slides down, toast confirms, item appears in Collection

**Folder Navigation**
- Sidebar folder list (flat, no nesting)
- Drag folders to reorder (with drop indicators)
- Right-click context menu for rename/delete

**Search Experience**
- Search input with keyboard shortcut hint (`⌘K` or `Ctrl+K`)
- Real-time results as you type (debounced 200ms)
- Results grouped by type: Saves, Transcript matches, Summary matches
- Highlight matching text in results
- Click result → navigate to Save with match highlighted

### Motion & Animation

```css
/* Timing functions */
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

/* Standard durations */
--duration-fast: 150ms;    /* Hover, focus states */
--duration-normal: 250ms;  /* Expand/collapse, modals */
--duration-slow: 400ms;    /* Page transitions */

/* Example: Modal entrance */
@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-enter {
  animation: slideUp var(--duration-normal) var(--ease-out);
}
```

### Responsive Behavior

| Breakpoint | Layout Changes |
|------------|----------------|
| Desktop (1280px+) | Full 3-panel layout |
| Tablet (768-1279px) | 2-panel (video + tabbed panels), collapsible sidebar |
| Mobile (<768px) | Single panel with bottom navigation, sheet-based panels |

### Accessibility Requirements

- Keyboard navigation for all interactive elements
- Focus indicators that are visible but not ugly
- Screen reader labels for icon-only buttons
- Reduced motion support: `prefers-reduced-motion`
- Color not used as only indicator (icons + text labels)
- Minimum touch targets: 44x44px on mobile

### Light/Dark Mode (User Preference)

**Implementation Strategy:**
- System preference detection: `prefers-color-scheme`
- Manual toggle in user settings (persisted to database)
- Smooth transition between modes (200ms)
- Consistent contrast ratios in both modes

**Color Tokens:**
```css
:root {
  /* Light Mode (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border-default: #e2e8f0;
  --border-subtle: #f1f5f9;
  --accent-primary: #2563eb;
  --accent-hover: #1d4ed8;
}

[data-theme="dark"] {
  /* Dark Mode */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border-default: #334155;
  --border-subtle: #1e293b;
  --accent-primary: #3b82f6;
  --accent-hover: #60a5fa;
}
```

**Toggle Component:**
```jsx
// Settings page or header dropdown
const ThemeToggle = () => {
  const [theme, setTheme] = useState('system'); // 'light', 'dark', 'system'

  return (
    <SegmentedControl
      options={[
        { value: 'light', icon: <Sun /> },
        { value: 'dark', icon: <Moon /> },
        { value: 'system', icon: <Monitor /> }
      ]}
      value={theme}
      onChange={setTheme}
    />
  );
};
```

**Dark Mode Design Guidelines:**
- Never use pure black (#000) - use dark slate (#0f172a)
- Reduce shadows, increase border visibility
- Slightly desaturate colors for comfortable viewing
- Test all states: hover, focus, active, disabled
- Ensure charts/graphs have dark-mode variants

---

## Landing Page Design

The landing page is the first impression. It must communicate value instantly and convert visitors to registered users.

### Landing Page Principles

**1. Clarity Over Cleverness**
- Headline explains what Vidlyx does in <10 words
- No jargon, no "AI-powered synergy"
- Visitor understands value in 5 seconds

**2. Show, Don't Tell**
- Real product screenshots/videos, not illustrations
- Interactive demo preview (requires login to use fully)
- Before/after comparison of workflow

**3. Trust Signals**
- No fake testimonials or stock photos of people
- Real metrics if available, otherwise omit
- Clear privacy and data handling info

**4. Single Call-to-Action**
- One primary action: "Get Started Free" → Register
- Users MUST register before accessing any features
- No "try without account" option

### Landing Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                              │
│  [Logo: Vidlyx]              [Features] [Pricing] [Login] [Sign Up] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HERO SECTION                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                 │ │
│  │  "Understand videos completely.                                │ │
│  │   Not just what's said—what's shown."                          │ │
│  │                                                                 │ │
│  │  [Subheadline: AI-powered video analysis that syncs            │ │
│  │   transcripts with visual content, generates summaries,        │ │
│  │   and lets you save exactly what matters.]                     │ │
│  │                                                                 │ │
│  │  [Get Started Free - Primary CTA]   [Watch Demo - Secondary]   │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │                                                          │   │ │
│  │  │     PRODUCT SCREENSHOT / VIDEO PREVIEW                   │   │ │
│  │  │     (Real UI, not mockup)                                │   │ │
│  │  │     Shows 3-panel layout with video playing              │   │ │
│  │  │                                                          │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PROBLEM SECTION                                                     │
│  "The old way is broken"                                            │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Screenshot   │  │ Transcribe   │  │ Take notes   │              │
│  │ manually     │  │ separately   │  │ elsewhere    │              │
│  │      ↓       │  │      ↓       │  │      ↓       │              │
│  │ 3 different tools, no connection between them                   │
│  └──────────────┴──────────────┴──────────────┘                    │
│                                                                      │
│  "With Vidlyx: One place. Everything connected."                    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FEATURES SECTION (3-4 key features)                                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ FEATURE 1: Multimodal Analysis                               │   │
│  │ [Screenshot]  "See what's on screen, not just what's said"  │   │
│  │               AI analyzes frames: OCR, diagrams, slides      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ FEATURE 2: Smart Summaries                                   │   │
│  │ "Skip the fluff"  [Screenshot]                               │   │
│  │ Auto-generated summaries per section with key points         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ FEATURE 3: Save & Organize                                   │   │
│  │ [Screenshot]  "Your personal video knowledge base"           │   │
│  │               Save frames, text, summaries to Collection     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ FEATURE 4: Synced Timeline                                   │   │
│  │ "Everything in context"  [Screenshot]                        │   │
│  │ Click transcript → video jumps. Click frame → see context.   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HOW IT WORKS (3 steps)                                             │
│                                                                      │
│  [1]                    [2]                    [3]                   │
│  Paste YouTube URL  →   AI analyzes video  →   Save what matters    │
│  "Just paste a link"    "Auto-magic"          "Your Collection"     │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  USE CASES (Who is this for?)                                       │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Researchers│ │ Students   │ │ Content    │ │ Marketers  │       │
│  │ Document   │ │ Study from │ │ Creators   │ │ Competitor │       │
│  │ evidence   │ │ lectures   │ │ Analyze    │ │ analysis   │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PRICING SECTION (Simple, if applicable)                            │
│                                                                      │
│  "Free to start. No credit card required."                          │
│                                                                      │
│  [Currently free during beta - or simple pricing cards]             │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FINAL CTA                                                          │
│                                                                      │
│  "Ready to understand videos better?"                               │
│  [Get Started Free - Large CTA Button]                              │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FOOTER                                                             │
│  [Logo]   [Features] [Pricing] [Privacy] [Terms]   [Twitter/X]     │
│           © 2025 Vidlyx                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Landing Page Component Breakdown

**Navbar:**
- Sticky on scroll (with backdrop blur)
- Logo left, navigation center/right
- "Sign Up" button is primary (filled), "Login" is secondary (text)
- Mobile: hamburger menu

**Hero:**
- Headline: 48-64px, bold, max 2 lines
- Subheadline: 18-20px, regular weight, muted color
- CTA buttons: Primary large, secondary as text link
- Product image: Real screenshot with subtle shadow, not floating mockup

**Features:**
- Alternating layout (image left/right)
- Each feature: icon + headline + 1-2 sentence description + screenshot
- Screenshots should be actual UI, slightly cropped for focus

**Social Proof (if available):**
- Real user quotes with name/role (no stock photos)
- Usage statistics if meaningful
- Logos of companies using it (only if real)

**Footer:**
- Simple, not cluttered
- Essential links only
- Copyright, privacy policy, terms

### Landing Page Technical Notes

```jsx
// Landing page is PUBLIC - no auth required to view
// But ALL actions lead to registration

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />
      <PricingSection />
      <FinalCTASection />
      <Footer />
    </>
  );
};

// All CTAs redirect to /register
const CTAButton = ({ children }) => (
  <Link to="/register" className="btn-primary btn-large">
    {children}
  </Link>
);
```

---

## External API Requirements

### 1. YouTube (FREE - via yt-dlp)
- **Purpose:** Video metadata + subtitle extraction
- **Cost:** FREE
- **Method:** yt-dlp library (existing implementation)

### 2. Google Gemini API (FREE Tier - RECOMMENDED)
| Service | Model | Purpose | Free Limits |
|---------|-------|---------|-------------|
| Vision + Text | gemini-1.5-flash | Frame analysis, summaries, correlation | 15 RPM, 1M tokens/day, 1500 req/day |
| Complex Tasks | gemini-1.5-pro | Fallback for complex analysis | 2 RPM, 50 req/day |

**Setup:** Google AI Studio → Get API Key (free, no credit card required)

### 3. Local Processing (100% FREE - No Limits)
| Component | Tool | Purpose |
|-----------|------|---------|
| OCR | Tesseract.js / EasyOCR | Extract on-screen text |
| Scene Detection | OpenCV | Detect scene changes |
| Frame Extraction | FFmpeg | Extract video frames |

### Cost Summary: **$0.00 per video**

| Component | Method | Cost |
|-----------|--------|------|
| Metadata extraction | yt-dlp | **FREE** |
| Transcription | YouTube subtitles via yt-dlp | **FREE** |
| Frame extraction | ffmpeg (local) | **FREE** |
| OCR | Tesseract.js (local) | **FREE** |
| Vision analysis | Gemini 1.5 Flash | **FREE** |
| Correlation | Gemini 1.5 Flash | **FREE** |
| Summaries | Gemini 1.5 Flash | **FREE** |
| **TOTAL** | | **FREE** |

**Gemini Free Tier Capacity (per day):**
- 1,500 requests → ~12 videos with 120 frames each
- 1,000,000 tokens → Plenty for summaries and correlation
- 15 requests/minute → Process 1 frame every 4 seconds

---

## Analysis Pipeline Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    VIDEO ANALYSIS PIPELINE                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. VIDEO INPUT                                                   │
│     - User pastes YouTube URL                                     │
│     - Validate URL format                                         │
│     - Extract video ID                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. METADATA EXTRACTION (Python - yt-dlp)                        │
│     - Title, channel, duration, thumbnail                         │
│     - Description, tags                                           │
│     - Store in videos table                                       │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│  3A. TRANSCRIPTION      │     │  3B. FRAME EXTRACTION           │
│  (Python - yt-dlp)      │     │  (Node.js - ffmpeg)             │
│  - Extract subtitles    │     │  - Download video stream        │
│  - Parse JSON3 format   │     │  - Extract frames @ intervals   │
│  - Store segments       │     │  - Store as JPG files           │
└─────────────────────────┘     └─────────────────────────────────┘
              │                               │
              │                               ▼
              │               ┌─────────────────────────────────────┐
              │               │  4. VISION ANALYSIS (FREE)          │
              │               │  Step A: Tesseract OCR (local)      │
              │               │  - Extract on-screen text           │
              │               │  Step B: Gemini 1.5 Flash (free)    │
              │               │  - Scene classification             │
              │               │  - Visual element detection         │
              │               │  - Store analyses                   │
              │               └─────────────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. CORRELATION ANALYSIS                                          │
│  - Match transcript segments with frame analyses                  │
│  - Identify visual references in speech                           │
│  - Calculate correlation scores                                   │
│  - Link related content                                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. SECTION DETECTION                                             │
│  - Identify topic shifts in transcript                            │
│  - Detect visual scene changes                                    │
│  - Merge boundaries                                               │
│  - Create sections                                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  7. SUMMARY GENERATION (Gemini Flash - FREE)                     │
│  - Generate section summaries (audio + visual)                   │
│  - Extract key points                                            │
│  - Generate full video summary                                   │
│  - Store all summaries                                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  8. READY FOR USER                                                │
│  - Display in 3-panel UI                                          │
│  - Enable search across all content                               │
│  - Allow clip/frame saving                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## MVP Scope Definition

### In Scope (MVP)
- YouTube video support only
- Basic video playback with standard controls
- **FREE transcription via yt-dlp (YouTube subtitles)**
- **Frame-by-frame visual analysis (Gemini Vision)**
- **Audio-visual correlation/synchronization**
- **AI-generated summaries per section**
- **Full video summary with key takeaways**
- **Save system:** Save frames, transcript selections, summary excerpts
- **Collection:** Central library for all Saves
- **Folders:** Flat folder structure, multi-folder placement
- Full-text search across all content
- Tags for organization
- Email/password authentication
- Premium UI/UX (polished, human-crafted feel)
- No usage restrictions (full features for all users)

### Out of Scope (Post-MVP)
- Other video platforms (Vimeo, Twitch, etc.)
- Direct video file upload
- Video downloading/export
- Actual video cutting/editing
- Team collaboration / sharing
- API access for developers
- Mobile app (responsive web only for MVP)
- Speaker diarization
- Multi-language support
- Payment/subscription system
- Usage quotas and tiers

---

## Implementation Phases

### Phase 1: Foundation (Core Setup)
1. Initialize project structure
2. Copy Python scripts from /home/pgc/workspace/vidlyx/
3. Set up backend with Express + PostgreSQL
4. Implement authentication system
5. Set up React frontend with routing
6. Create database schema (including Save tables)
7. Build core layout components (following UI/UX principles)
8. Set up design system (colors, typography, spacing)

### Phase 2: Video Core + Transcription
1. YouTube URL input and validation
2. Integrate Python youtube_analyzer.py via python-shell
3. Video metadata storage
4. YouTube iframe player integration
5. Transcription extraction and storage
6. Transcription UI panel with synchronized scrolling

### Phase 3: Frame Extraction & Vision Analysis
1. FFmpeg integration for frame extraction
2. Frame extraction worker (background job)
3. Tesseract.js OCR integration (local, free)
4. Gemini Vision integration (free tier)
5. Frame analysis pipeline
6. Frame gallery UI with analysis display

### Phase 4: Correlation & Synchronization
1. Correlation algorithm implementation
2. Link frames to transcript segments
3. Synchronized timeline view
4. Visual context panel in transcript view
5. Click-to-seek from frames

### Phase 5: Sections & Summaries
1. Section detection algorithm
2. Gemini summary generation
3. Section summaries storage
4. Full video summary
5. Summary panel UI with tabs
6. Key points extraction and display

### Phase 6: Save System & Collection
1. Save creation API (multi-content: frames, text, summaries)
2. Save database operations (with content tables)
3. SaveCreator component (content selection UI)
4. ContentSelector component (multi-select frames, highlight text)
5. Save detail view
6. Collection page with grid/list views

### Phase 7: Folders & Organization
1. Folder CRUD (flat structure)
2. Many-to-many Save-Folder relationships
3. FolderList component (sidebar navigation)
4. FolderPicker component (multi-folder selection)
5. Drag-and-drop (Saves to folders)
6. Tag system implementation

### Phase 8: Search & Polish
1. Full-text search across all content
2. Search results UI with highlighting
3. Keyboard shortcuts (⌘K search, S to save, etc.)
4. Export functionality (PDF, ZIP, JSON)
5. Responsive design (tablet/mobile layouts)
6. Error handling and loading states (skeletons)
7. Micro-interactions and animations
8. Performance optimization

---

## Success Metrics (MVP)

**Core Functionality:**
- User can input YouTube URL and see video playing
- Transcription automatically extracted (FREE)
- Frames analyzed with AI vision (OCR, scene detection)
- Visual content correlated with transcript
- Summaries generated per section AND full video

**Save & Collection:**
- User can Save frames, transcript text, and summary excerpts
- User can create folders (flat structure)
- Same Save can exist in multiple folders
- User can search across ALL content types
- User can bulk-manage Saves (multi-select, tag, move)

**UI/UX Quality:**
- Interface feels premium and human-crafted (not AI-generated)
- Smooth animations and micro-interactions
- Responsive design works on tablet
- Keyboard shortcuts for power users

**Performance:**
- All core features work without errors
- Page load time < 3 seconds
- Full analysis pipeline < 5 minutes for 10-minute video
- Search results appear in < 500ms

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube ToS compliance | High | Use official iframe API, yt-dlp for metadata only |
| Vision API costs | High | Batch processing, frame sampling, cost monitoring |
| Long video processing | Medium | Background jobs, progress indicators, chunking |
| API rate limits | Medium | Queue system, retry logic, caching |
| Frame extraction quality | Low | Use keyframe detection, multiple extraction points |
| Correlation accuracy | Medium | Use confidence scores, allow manual correction |

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Transcription method | Use existing yt-dlp (FREE, proven) |
| Vision AI provider | OpenAI GPT-4 Vision (best accuracy) |
| Frame extraction rate | Every 5 seconds + keyframes |
| Summary granularity | Per-section + full video |
| Storage for frames | Local filesystem (MVP), S3 (post-MVP) |

---

## Cost Analysis (Per Video)

### 10-Minute Video Example - **100% FREE**
| Component | Method | Cost |
|-----------|--------|------|
| Metadata extraction | yt-dlp | **FREE** |
| Transcription | YouTube subtitles via yt-dlp | **FREE** |
| Frame extraction | ffmpeg (120 frames) | **FREE** |
| OCR | Tesseract.js (local) | **FREE** |
| Vision analysis | Gemini 1.5 Flash | **FREE** |
| Correlation | Gemini 1.5 Flash | **FREE** |
| Section detection | Gemini 1.5 Flash | **FREE** |
| Summaries | Gemini 1.5 Flash | **FREE** |
| **TOTAL** | | **$0.00** |

### Gemini Free Tier Daily Capacity
| Resource | Limit | What This Means |
|----------|-------|-----------------|
| Requests | 1,500/day | ~12 videos @ 120 frames each |
| Tokens | 1,000,000/day | ~500+ summary generations |
| Rate | 15 req/min | 1 frame analyzed every 4 seconds |

### Scaling Beyond Free Tier (Future)
If you exceed free limits, options include:
1. **Gemini Pay-as-you-go:** ~$0.00001875/1K chars (extremely cheap)
2. **Local Ollama:** 100% free, unlimited, requires GPU
3. **Queue overnight:** Spread processing across multiple days

### Optimization Strategies (Stay Within Free Tier)
1. **Smart frame sampling:** Analyze keyframes + every 10th frame
2. **Batch similar frames:** Skip near-duplicate frames
3. **Cache aggressively:** Never re-analyze same video
4. **OCR first:** Use local Tesseract before calling Gemini
5. **Rate limiting:** Space out requests to stay under 15 RPM

---

## Future Considerations (Post-MVP)

### Pricing Tiers (To Be Defined)
- **Free Tier:** 3 videos/month, basic analysis
- **Pro Tier:** Unlimited videos, full analysis, priority processing
- **Team Tier:** Collaboration, shared folders, API access

### Advanced Features
- Real-time collaboration on analysis
- Custom AI prompts for specific analysis needs
- Speaker identification in transcription
- Multi-language transcription and translation
- Video comparison tool
- Browser extension for quick capture
- Public sharing of analyses
- Embed analysis widgets on external sites
- Webhook integrations
- Batch video processing

---

## Alternative: 100% Local/Offline Stack (No API Keys)

If you want ZERO external dependencies and unlimited processing:

```javascript
// Using Ollama for completely local AI
const Ollama = require('ollama');

// Vision analysis with local LLaVA model
const analyzeFrameLocal = async (frameBuffer) => {
  const response = await ollama.generate({
    model: 'llava:7b',  // or 'moondream' for lighter weight
    prompt: 'Analyze this image. Describe: scene type, visual elements, any text visible.',
    images: [frameBuffer.toString('base64')]
  });
  return response.response;
};

// Summaries with local Llama
const generateSummaryLocal = async (text) => {
  const response = await ollama.generate({
    model: 'llama3.1:8b',  // or 'mistral' or 'qwen2.5'
    prompt: `Summarize this video section:\n${text}\n\nProvide: title, summary, key points.`
  });
  return response.response;
};
```

**Local Model Requirements:**
| Model | VRAM | RAM | Quality |
|-------|------|-----|---------|
| moondream | 2GB | 4GB | Good for basic vision |
| llava:7b | 6GB | 8GB | Better vision quality |
| llava:13b | 10GB | 16GB | Best vision quality |
| llama3.1:8b | 6GB | 8GB | Great for text/summaries |

**Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models (one-time)
ollama pull moondream      # Lightweight vision
ollama pull llama3.1:8b    # Text/summaries
```

---

## Quick Reference: The FREE Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    VIDLYX FREE STACK                        │
├─────────────────────────────────────────────────────────────┤
│  TRANSCRIPTION     │  yt-dlp (YouTube subtitles)    │ FREE │
│  METADATA          │  yt-dlp                        │ FREE │
│  FRAME EXTRACTION  │  FFmpeg                        │ FREE │
│  OCR               │  Tesseract.js                  │ FREE │
│  VISION ANALYSIS   │  Google Gemini 1.5 Flash       │ FREE │
│  SUMMARIES         │  Google Gemini 1.5 Flash       │ FREE │
│  CORRELATION       │  Google Gemini 1.5 Flash       │ FREE │
│  DATABASE          │  PostgreSQL                    │ FREE │
│  BACKEND           │  Node.js + Express             │ FREE │
│  FRONTEND          │  React                         │ FREE │
├─────────────────────────────────────────────────────────────┤
│  TOTAL COST PER VIDEO                              │ $0.00 │
│  DAILY CAPACITY (Gemini free tier)                 │ ~12   │
└─────────────────────────────────────────────────────────────┘
```

---

*Document Version: 3.1*
*Last Updated: 2025-11-27*
*Status: MVP Planning*
*Major Updates:*
- *v2.0: Added multimodal vision analysis, audio-visual correlation, and AI summaries*
- *v2.1: Switched to 100% FREE stack using Google Gemini + Tesseract OCR*
- *v3.0: Introduced Save system & Collection (replacing Clips), flat folder structure, multi-folder placement, comprehensive UI/UX design principles*
- *v3.1: Added premium icon library (Phosphor), comprehensive landing page design, light/dark mode, admin dashboard with analytics & user monitoring, authentication required before access*
