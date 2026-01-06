# QA Log - Vidlyx

> **REMINDER FOR ALL AGENTS (Main & Subagents):**
> You MUST update this file when finding bugs, fixing issues, or making UI/UX improvements.
> Always add new entries at the TOP (latest first).

This file tracks all bugs found, errors encountered, and fixes applied.

## How to Add Entries

1. Run `date '+%Y-%m-%d %H:%M'` to get accurate timestamp
2. Add entry at the TOP of the current date section
3. Use the template at the bottom of this file

**Do NOT estimate timestamps. Always use the date command.**

---

## 2026-01-06

### [2026-01-06 15:57] Feature: Floating capture button with cinematic shutter effect
**Status:** Completed
**File(s):**
- `dashboard/src/pages/app/VideoAnalysis.js` - Added floating button, capture modal integration
- `dashboard/src/pages/app/VideoAnalysis.css` - Cinematic glassmorphic button styles
**Feature:**
- Floating "Capture" button centered at top of video player
- Glassmorphic dark style with blur effect (visible but not obtrusive)
- Shutter flash animation on capture (radial white flash + border effect)
- Success state with green gradient and checkmark bounce animation
- Icon pulse animation on hover
- Keyboard shortcut: Press 'C' to capture
- Opens FrameCaptureModal after flash animation completes

---

### [2026-01-06 15:48] Fix: Force local analysis with USE_LOCAL_ANALYSIS env var
**Status:** Fixed
**File(s):**
- `server/.env` - added `USE_LOCAL_ANALYSIS=true`
- `server/src/services/summaryService.js` - `isClaudeAvailable()` checks env var
- `server/src/services/sectionDetectionService.js` - `isGeminiAvailable()` checks env var
**Issue:** Summary generation timeout (120000ms exceeded) despite API key validation fixes
**Root Cause:** Even with invalid/exhausted API keys, the system still attempted external API calls. Gemini API key existed but quota was depleted (429 Too Many Requests).
**Fix:** Added `USE_LOCAL_ANALYSIS=true` environment variable. Both `isClaudeAvailable()` and `isGeminiAvailable()` now check this setting first and return `false` if set, ensuring local text analysis is always used regardless of API key presence.

---

### [2026-01-06 15:43] Fix: Video not visible in theater/fullscreen modes
**Status:** Fixed
**File(s):** `dashboard/src/pages/app/VideoAnalysis.css`
**Issue:** YouTube video player invisible in theater and fullscreen modes
**Root Cause:** When parent uses `display: contents`, children lose inherited width. The video player's aspect ratio padding-bottom needs explicit width to calculate height.
**Fix:** Added `width: 100%` to `.video-player-container` in both theater and fullscreen modes

---

### [2026-01-06 15:42] Fix: Complete local fallback for summary generation
**Status:** Fixed
**File(s):**
- `server/src/services/summaryService.js` - improved API key validation
- `server/src/services/sectionDetectionService.js` - added local section detection
- `dashboard/src/components/Summary/OverviewTab.js` - improved error display
**Issues:**
1. API key check accepted placeholder values (`your_api_key_here`)
2. Section detection still used Gemini API (no fallback)
3. Frontend didn't show clear error messages
**Fix:**
- `isClaudeAvailable()` now validates key starts with `sk-ant-` and isn't placeholder
- Added `detectSectionsLocally()` - creates sections from time intervals + keyword analysis
- All summary functions now check API availability and use local fallback
- Frontend shows detailed error with retry button
- Added "Uses local text analysis" note when generating

---

### [2026-01-06 15:41] Fix: Theater & Fullscreen mode layout order
**Status:** Fixed
**File(s):** `dashboard/src/pages/app/VideoAnalysis.css`
**Issue:** Video not visible in theater/fullscreen modes, wrong content order
**Fix:**
- Theater mode: Fixed order to Video → Transcript → Summary → Frames
- Theater mode: All content centered at 80% width
- Fullscreen mode: Removed `display: none` on transcript and summary
- Fullscreen mode: Fixed order to Video → Transcript → Summary → Frames
- Fullscreen mode: Changed background to dark (#1a1a1a) with semi-transparent panels

---

### [2026-01-06 15:26] Feature: Local summary generation (no external API)
**Status:** Fixed
**File(s):**
- `server/src/services/localSummaryService.js` (new)
- `server/src/services/summaryService.js` (updated)
**Issue:** Summary generation failed with 500 error due to:
1. Gemini API quota exceeded (429 Too Many Requests)
2. ANTHROPIC_API_KEY not configured
**Fix:**
- Created `localSummaryService.js` with text analysis algorithms:
  - `extractKeySentences()` - scores sentences by position, length, key phrases
  - `extractTopics()` - word frequency analysis with stop word filtering
  - `detectCategory()` - classifies video type (Tutorial, Review, Tech, etc.)
  - `estimateDifficulty()` - beginner/intermediate/advanced detection
  - `generateLocalSummary()` - creates full summary without API
  - `generateLocalAnalysis()` - creates markdown analysis without API
- Updated `summaryService.js` to check `isClaudeAvailable()` first
- Falls back to local generation when no API key is configured
- Keeps API options available for when keys are added
**Result:** Summary generation works without external APIs

---

### [2026-01-06 15:03] UI: Transcript scroll - top position, no focus stealing
**Status:** Fixed
**File(s):** `dashboard/src/components/Transcript/TranscriptPanel.js`
**Issues:**
1. Auto-scroll was stealing focus from video during playback
2. Active segment scrolled to center, too far from video above
**Fix:**
- Changed from `scrollIntoView()` to `container.scrollTo()` - doesn't steal page focus
- Active segment now scrolls to TOP of transcript (16px offset) instead of center
- User can watch video while transcript smoothly follows along

---

### [2026-01-06 14:59] UI: TranscriptPanel inline search bar
**Status:** Fixed
**File(s):** `dashboard/src/components/Transcript/TranscriptPanel.js`
**Changes:**
- Search bar now appears inline to the LEFT of search icon (not separate row)
- Rounded corners on search input (border-radius: 16px pill shape)
- Input width 160px - fits ~25 characters
- Smooth expand animation when opening search
- Search icon changes to X when search is open
- All buttons (search, auto, copy) remain right-aligned

---

### [2026-01-06 15:00] UI: Fix sidebar collapse jump to center
**Status:** Fixed
**File(s):** `dashboard/src/components/Layout/Layout.css`
**Issue:** Icons briefly jumped to center during collapse animation
**Root Cause:** `justify-content: center` is not animatable - it applied instantly while width was still transitioning
**Fix:**
- Removed `justify-content: center` from `.sidebar.collapsed .nav-item`
- Removed `justify-content: center` from `.sidebar.collapsed .sidebar-toggle`
- Kept padding consistent (var(--space-6) = 24px) in both states
- Icons now stay left-aligned throughout transition

---

### [2026-01-06 14:56] UI: Smooth sidebar collapse/expand animation
**Status:** Fixed
**File(s):** `dashboard/src/components/Layout/Layout.css`
**Issue:** Sidebar collapse/expand animation looked "jumping" and not smooth
**Fix:**
- Changed `nav-label` from `width: 0` to `max-width: 0` with proper transition
- Added `margin-left` transition to nav-label (collapses from 12px to 0)
- Updated transitions to use explicit properties instead of `all`
- Added proper transitions to `.sidebar-toggle` for padding changes
- Set fixed width (20px) on `.nav-icon` for consistent positioning
- All transitions now use matching 300ms cubic-bezier(0.4, 0, 0.2, 1) timing

---

### [2026-01-06 14:53] UI: TranscriptPanel cleanup - remove redundant header
**Status:** Fixed
**File(s):** `dashboard/src/components/Transcript/TranscriptPanel.js`
**Changes:**
- Removed redundant "Transcript" h3 header (already shown in toggle button above)
- Added search icon button - click to expand search bar
- Search bar now toggleable (hidden by default, shown on icon click)
- Shortened "Auto-scroll" to "Auto" for compact header
- Made header more minimal with right-aligned icon buttons
- Match count now shows as badge when search has results

---

### [2026-01-06 14:49] UI: Home page improvements
**Status:** Fixed
**File(s):**
- `dashboard/src/components/Layout/Layout.css`
- `dashboard/src/pages/app/Home.css`
- `dashboard/src/pages/app/Home.js`
**Changes:**
- Sidebar collapse icon now left-aligned with nav icons (was centered)
- "Analyze New Video" button has unique purple-to-pink gradient with shimmer effect on hover
- Removed confusing frame count (638) from video cards - just shows status badge now

---

### [2026-01-06 14:47] UI: Increase Summary panel height to fill vertical space
**Status:** Fixed
**File(s):** `dashboard/src/pages/app/VideoAnalysis.css`
**Issue:** Summary panel (right-column) had fixed max-height of 738px leaving unused vertical space
**Fix:**
- Changed to dynamic calc(): `max-height: calc(100vh - 48px - 32px - 140px - 16px)`
- Added `height: 100%` to fill available space
- Updated mobile breakpoint to use `max-height: none` for stacked layout
- Updated landscape mobile to use `max-height: calc(100vh - 100px)`

---

### [2026-01-06 14:40] Feature: Rename Dashboard to Home with rich content
**Status:** Completed
**File(s):**
- `dashboard/src/pages/app/Home.js` (new - replaces Dashboard.js)
- `dashboard/src/pages/app/Home.css` (new)
- `dashboard/src/services/homeService.js` (new)
- `server/src/routes/homeRoutes.js` (new)
- `dashboard/src/App.js` (updated import)
- `dashboard/src/components/Layout/Sidebar.js` (label: Dashboard → Home)
**Change:**
- Renamed "Dashboard" to "Home" in navigation
- Created comprehensive Home page with:
  - Hero section with personalized greeting and primary CTA
  - Stats cards (videos, duration, saves, frames analyzed)
  - Processing queue showing videos being analyzed
  - Recent videos grid (3-column) with thumbnails, status badges
  - Recent saves list with video context
  - Folders section with item counts
  - Insights section showing key takeaways from videos
  - Empty state with quick-start cards for new users
- Created backend API endpoints:
  - GET /api/home/stats - aggregated user stats
  - GET /api/home/recent-videos - recent videos with metadata
  - GET /api/home/recent-saves - recent saves
  - GET /api/home/folders - folders with counts
  - GET /api/home/processing - videos being processed
  - GET /api/home/insights - key takeaways from summaries
- Responsive design (1400px max, 4→2→1 column stats, sidebar collapse)

---

### [2026-01-06 14:39] Feature: Redesign TranscriptPanel - continuous flowing text
**Status:** Completed
**File(s):**
- `dashboard/src/components/Transcript/TranscriptPanel.js`
**Change:**
- Removed timestamp buttons from each transcript segment
- Changed layout from individual segment rows to continuous flowing text
- Text flows naturally as a paragraph, preserving sentence structure
- Active segment now highlighted with gradient background (blue/indigo)
- Click any part of text to seek to that timestamp
- Non-matching segments dimmed during search (instead of hidden)
- Kept search functionality with yellow highlight for matches
- Kept auto-scroll feature that follows current position
- Kept "Add to Save" popup on text selection

---

### [2026-01-06 14:39] Feature: Remove custom video player controls
**Status:** Completed
**File(s):**
- `dashboard/src/pages/app/VideoAnalysis.js`
- `dashboard/src/pages/app/VideoAnalysis.css`
**Change:**
- Removed custom play/pause button, time display, seek bar, volume, and speed controls
- Now relies solely on YouTube's native player controls
- Cleaned up unused imports (Play, Pause, SpeakerHigh, SpeakerLow, SpeakerX)
- Removed unused state variables (isPlaying, volume, isMuted, playbackRate)
- Removed unused functions (togglePlay, toggleMute, changePlaybackRate)
- Removed related CSS (~85 lines of .player-controls, .control-btn, .seek-bar, .speed-select styles)
- YouTube player still supports seekTo for transcript click-to-seek functionality

---

### [2026-01-06 14:14] Feature: Switch from Gemini to Claude API for summaries
**Status:** Fixed
**File(s):**
- `server/src/services/claudeService.js` (new)
- `server/src/services/summaryService.js`
- `dashboard/src/components/Loading/GeneratingOverlay.js` (new)
- `dashboard/src/components/Loading/GeneratingOverlay.css` (new)
- `dashboard/src/components/Summary/OverviewTab.js`
- `dashboard/src/components/Summary/AnalysisDashboard.js`
**Issue:** Gemini API timeouts on summary generation (120s+)
**Fix:**
- Created `claudeService.js` using @anthropic-ai/sdk (claude-sonnet-4-20250514 model)
- Updated `summaryService.js` to use Claude instead of Gemini
- Added `GeneratingOverlay` component with animated progress (spinner, stages, progress bar)
- Integrated overlay into OverviewTab and AnalysisDashboard for visual feedback during generation
**Note:** User must add `ANTHROPIC_API_KEY` to `server/.env`

---

### [2026-01-06 14:07] Issue: Gemini API timeouts on summary generation
**Status:** Resolved (replaced with Claude API)
**File(s):** `dashboard/src/services/summaryService.js`, `dashboard/src/services/api.js`
**Issue:** Generate Summary and Generate Full Analysis buttons fail with "timeout exceeded" - even at 120s timeout
**Root Cause:** Gemini API calls taking too long or failing
**Attempted Fix:** Increased timeout from 30s to 120s - still failing
**Resolution:** Switched to Claude API (see entry above)

---

### [2026-01-06 14:05] Fix: VideoTypeDetector null safety
**Status:** Fixed
**File(s):** `dashboard/src/components/Summary/VideoTypeDetector.js`
**Issue:** `Cannot read properties of null (reading 'toLowerCase')` error in OverviewTab
**Root Cause:** `detectVideoType()` called `.toLowerCase()` on title/description/tags without null checks. Default params only apply for `undefined`, not `null`.
**Fix:** Added null coalescing: `(title || '').toLowerCase()`, `(tags || []).map(...)` etc.

---

### [2026-01-06 14:02] Fix: Content Metrics not aligned horizontally
**Status:** Fixed
**File:** `dashboard/src/components/Summary/ContentMetrics.js`
**Issue:** Content Metrics (Duration, Speech, Visuals, Words, Frames) were stacking vertically instead of in one line.
**Fix:** Changed `.metrics-grid` from CSS Grid to Flexbox with `flex-wrap: nowrap`. Made metric cards more compact (70px min-width, smaller icons 16px, smaller font 1rem).

---

### [2026-01-06 13:55] Fix: Section timestamps showing 0:00 - 0:00
**Status:** Fixed
**Files:**
- `dashboard/src/components/Summary/SectionCard.js`
- `dashboard/src/components/Summary/SectionsTab.js`
- `dashboard/src/components/Common/TimelineBar.js`

**Issue:** Section timestamps displayed as "0:00 - 0:00" in the Sections tab.
**Root Cause:** Backend returns `startTime`/`endTime` (camelCase) but frontend expected `start_time`/`end_time` (snake_case).
**Fix:** Added fallback support using nullish coalescing: `section.start_time ?? section.startTime ?? 0`

---

### [2026-01-06 13:50] Fix: Full Analysis tab buttons layout
**Status:** Fixed
**File:** `dashboard/src/components/Summary/AnalysisDashboard.js`
**Issue:** Export Analysis, Regenerate, Copy All buttons were stacked vertically with text labels.
**Fix:** Changed to icon-only buttons (40x40px) with hover tooltips. Added `.action-btn.icon-only` and `.tooltip` CSS styles.

---

### [2026-01-06 13:45] Fix: Redundant content in Full Analysis tab
**Status:** Fixed
**File:** `dashboard/src/components/Summary/AnalysisDashboard.js`
**Issue:** Executive Summary and Content Metrics were redundant (already shown in Overview tab).
**Fix:** Removed `ComprehensiveSummary` and `ContentMetrics` components from Full Analysis. Moved Content Metrics to Overview tab.

---

### [2026-01-06 13:35] Fix: Server crash - MODULE_NOT_FOUND
**Status:** Fixed
**File:** `server/src/services/regenerationService.js`
**Error:** `Cannot find module '../config/database'`
**Fix:** Changed `require('../config/database')` to `require('./db')` and all `db.query` to `pool.query`.

---

### [2026-01-06 13:25] Fix: Gamepad icon not found
**Status:** Fixed
**File:** `dashboard/src/components/Summary/AnalysisDashboard.js`
**Error:** `export 'Gamepad' was not found in '@phosphor-icons/react'`
**Fix:** Changed import and usage from `Gamepad` to `GameController`.

---

## Template for New Entries

```markdown
### [YYYY-MM-DD HH:MM] [Fix/Bug/Issue]: Brief description
**Status:** [Fixed/In Progress/Investigating]
**File(s):** `path/to/file.js`
**Issue:** Describe what was wrong
**Root Cause:** (if known) Why it happened
**Fix:** What was done to resolve it
```
