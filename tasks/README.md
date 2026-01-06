# Vidlyx MVP Development Tasks

This directory contains all task files for building the Vidlyx MVP, organized sequentially from project setup through final polish.

## Ports Configuration

| Service | Port |
|---------|------|
| **Frontend (React)** | 4050 |
| **Backend (Express)** | 4051 |
| **PostgreSQL** | 5432 |

## Task Overview

### Task 1: Project Setup & Infrastructure
Foundation setup for all components of Vidlyx.

- **task1-subtask1.md** - Create Project Structure (15 min)
- **task1-subtask2.md** - Initialize Git Repository (10 min)
- **task1-subtask3.md** - Setup Backend Server Project (30 min)
- **task1-subtask4.md** - Setup Database Schema (45 min)
- **task1-subtask5.md** - Setup React Frontend Project (30 min)
- **task1-subtask6.md** - Implement Authentication System (2-3 hours)
- **task1-subtask7.md** - Build Core Layout Components (2-3 hours)
- **task1-subtask8.md** - Setup Design System (1-2 hours)

**Total Estimated Time:** 8-10 hours

---

### Task 2: Video Core + Transcription
Build video input, playback, and transcription features.

- **task2-subtask1.md** - YouTube URL Input and Validation (1-2 hours)
- **task2-subtask2.md** - Integrate Python youtube_analyzer.py (2-3 hours)
- **task2-subtask3.md** - Video Metadata Storage and Display (1-2 hours)
- **task2-subtask4.md** - YouTube IFrame Player Integration (2-3 hours)
- **task2-subtask5.md** - Transcription Extraction and Storage (2-3 hours)
- **task2-subtask6.md** - Transcription UI Panel with Sync (3-4 hours)

**Total Estimated Time:** 11-17 hours

---

### Task 3: Frame Extraction & Vision Analysis
Implement AI-powered frame analysis.

- **task3-subtask1.md** - FFmpeg Integration for Frame Extraction (2-3 hours)
- **task3-subtask2.md** - Frame Extraction Worker (Background Job) (2-3 hours)
- **task3-subtask3.md** - Tesseract.js OCR Integration (2-3 hours)
- **task3-subtask4.md** - Gemini Vision API Integration (2-3 hours)
- **task3-subtask5.md** - Frame Analysis Pipeline (3-4 hours)
- **task3-subtask6.md** - Frame Gallery UI with Analysis Display (3-4 hours)

**Total Estimated Time:** 14-20 hours

---

### Task 4: Correlation & Synchronization
Connect visual and audio content together.

- **task4-subtask1.md** - Correlation Algorithm Implementation (3-4 hours)
- **task4-subtask2.md** - Link Frames to Transcript Segments (2-3 hours)
- **task4-subtask3.md** - Synchronized Timeline View (3-4 hours)
- **task4-subtask4.md** - Visual Context Panel in Transcript View (2-3 hours)
- **task4-subtask5.md** - Click-to-Seek from Frames (1-2 hours)

**Total Estimated Time:** 11-16 hours

---

### Task 5: Sections & Summaries
Implement AI-powered summarization.

- **task5-subtask1.md** - Section Detection Algorithm (3-4 hours)
- **task5-subtask2.md** - Gemini Summary Generation (2-3 hours)
- **task5-subtask3.md** - Section Summaries Storage (1-2 hours)
- **task5-subtask4.md** - Full Video Summary (2-3 hours)
- **task5-subtask5.md** - Summary Panel UI with Tabs (2-3 hours)
- **task5-subtask6.md** - Key Points Extraction and Display (2-3 hours)

**Total Estimated Time:** 12-18 hours

---

### Task 6: Save System & Collection
Build the save and collection features.

- **task6-subtask1.md** - Save Creation API (2-3 hours)
- **task6-subtask2.md** - Save Database Operations (2-3 hours)
- **task6-subtask3.md** - SaveCreator Component (3-4 hours)
- **task6-subtask4.md** - ContentSelector Component (2-3 hours)
- **task6-subtask5.md** - Save Detail View (2-3 hours)
- **task6-subtask6.md** - Collection Page with Grid/List Views (3-4 hours)

**Total Estimated Time:** 14-20 hours

---

### Task 7: Folders & Organization
Implement folder and tag organization.

- **task7-subtask1.md** - Folder CRUD Operations (2-3 hours)
- **task7-subtask2.md** - Many-to-Many Save-Folder Relationships (1-2 hours)
- **task7-subtask3.md** - FolderList Component (2-3 hours)
- **task7-subtask4.md** - FolderPicker Component (2-3 hours)
- **task7-subtask5.md** - Drag-and-Drop Saves to Folders (2-3 hours)
- **task7-subtask6.md** - Tag System Implementation (2-3 hours)

**Total Estimated Time:** 11-17 hours

---

### Task 8: Search & Polish
Final polish and optimization.

- **task8-subtask1.md** - Full-Text Search Implementation (3-4 hours)
- **task8-subtask2.md** - Search Results UI with Highlighting (2-3 hours)
- **task8-subtask3.md** - Keyboard Shortcuts (2-3 hours)
- **task8-subtask4.md** - Export Functionality (2-3 hours)
- **task8-subtask5.md** - Responsive Design (3-4 hours)
- **task8-subtask6.md** - Error Handling and Loading States (2-3 hours)
- **task8-subtask7.md** - Micro-interactions and Animations (2-3 hours)
- **task8-subtask8.md** - Performance Optimization (2-3 hours)

**Total Estimated Time:** 18-26 hours

---

## VideoAnalysis Page Redesign (Tasks 9-11)

Based on vidlyx-plan2.md - comprehensive redesign of the video analysis page.

### Task 9: Layout Foundation
Restructure VideoAnalysis page with split-pane layout, compact header, and video player modes.

**Deliverables:**
- CompactHeader component (48px)
- Split-pane layout (Video+Transcript | Summary)
- Video player modes (Default 50% / Theater 80% / Fullscreen)
- Mobile responsive layout (L-R, T-B priority)

**Dependencies:** None (foundation task)

---

### Task 10: Frame System & Summary Enhancement
Implement frame capture with transcript linking, video type detection, and redesign all summary tabs.

**Deliverables:**
- FrameStrip horizontal carousel
- FrameCaptureModal with OCR + transcript linking (±15s)
- Frame analysis service interface (manual now, AI-ready)
- VideoTypeDetector (10 video types)
- OverviewTab adaptive layout by video type
- SectionsTab with time ranges, importance, timeline
- KeyPointsTab with category filters

**Dependencies:** Task 9

---

### Task 11: Full Analysis Dashboard & Polish
Create comprehensive Full Analysis tab, implement regeneration system with tracking, and final polish.

**Deliverables:**
- AnalysisDashboard component (Content Metrics, Comprehensive Summary, Visual Analysis, Transcript Analysis, Quality Assessment, Related Topics)
- Regeneration UI + database tracking for future billing
- Export functionality (MD, PDF, JSON, TXT)
- Animation & transitions
- Final responsive testing

**Dependencies:** Task 9, Task 10

---

## Total MVP Development Time
**Estimated: 99-144 hours (12-18 weeks at part-time)**

## How to Use These Tasks

1. **Sequential Execution:** Tasks are numbered in the order they should be completed. Some tasks can be done in parallel after core setup.

2. **Check Prerequisites:** Each task lists prerequisites that must be completed first.

3. **Follow Instructions:** Each task provides detailed step-by-step instructions without code implementation (you write the code).

4. **Verify Completion:** Each task has a verification section to confirm it's done correctly.

5. **Track Progress:** Mark tasks as complete in your own tracking system.

## Task Format

Each task file follows this structure:
- **Objective:** What you'll accomplish
- **Prerequisites:** What must be done first
- **Instructions:** Detailed steps to follow
- **Verification:** How to test completion
- **Next Steps:** What comes next
- **Estimated Time:** How long it should take
- **Notes:** Additional tips and considerations

## Reference Documents

- `/home/pgc/vidlyx/vidlyx-plan.md` - Main PRD and architecture
- `/home/pgc/basicsaas/basic-saas-plan.md` - SaaS boilerplate patterns
- `/home/pgc/mailwatch/` - Reference implementation

## Notes

- **Don't skip tasks** - each builds on previous work
- **Test thoroughly** - especially the video analysis pipeline
- **Document issues** - keep notes of bugs and solutions
- **Stay organized** - use Git commits after each task
- **Free tier limits** - Monitor Gemini API usage (1500 req/day)

---

**Good luck building Vidlyx!**
