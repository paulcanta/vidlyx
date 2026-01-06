# Task 9: VideoAnalysis Layout Foundation

## Overview
Restructure the VideoAnalysis page with a split-pane layout, compact header, and video player modes.

## Scope
This task covers **Phase 1** of the redesign plan (vidlyx-plan2.md).

---

## Final Decisions
| Decision | Choice |
|----------|--------|
| Layout | Split-pane: Video+Transcript (left) / Summary (right) |
| Header | 48px compact with back, title, actions |
| Video Modes | Default (50%), Theater (80%), Fullscreen |
| Mobile | L-R, T-B priority stacking |

---

## Deliverables

### 1. CompactHeader Component
Create `/dashboard/src/components/Common/CompactHeader.js`

```
┌────────────────────────────────────────────────────────────────┐
│ ←  │  Video Title (truncated if long)      │  ⛶ 🎭 💾 ⤓ ⋯  │
└────────────────────────────────────────────────────────────────┘
```

| Element | Function |
|---------|----------|
| ← | Back to previous page |
| Title | Video title, truncated with ellipsis |
| ⛶ | View mode toggle |
| 🎭 | Theater mode shortcut |
| 💾 | Save to collection |
| ⤓ | Export options |
| ⋯ | More actions menu |

**Props:**
- `title` - Video title
- `onBack` - Back navigation handler
- `viewMode` - 'default' | 'theater' | 'fullscreen'
- `onViewModeChange` - Mode change handler
- `onSave` - Save handler
- `onExport` - Export handler
- `actions` - Additional action items

### 2. VideoPlayer Modes
Update/create `/dashboard/src/components/Video/VideoPlayer.js`

#### Default Mode
- Video: **50% width**, max **400px height**
- Summary panel: **50% width**, full height beside video
- Transcript: Below video, left column

#### Theater Mode
- Video: **80% width, centered**, **560px height**
- Content panels: Below video in 50/50 split

#### Fullscreen Mode
- Native browser fullscreen
- Video fills screen
- Controls overlay on hover

### 3. Split-Pane Layout
Restructure `/dashboard/src/pages/app/VideoAnalysis.js`

```
┌────────────────────────────────────────────────────────────────┐
│ ← │ Video Title                                    │ ⛶ 🎭 ⋯ │
├───┴────────────────────────┬───────────────────────────────────┤
│  ┌──────────────────────┐  │  SUMMARY                          │
│  │    VIDEO PLAYER      │  │  ════════                         │
│  │    (400px height)    │  │  Content adapts to video type...  │
│  │    50% width         │  │                                   │
│  └──────────────────────┘  │  Tags: [Topic1] [Topic2]          │
│  ┌──────────────────────┐  ├───────────────────────────────────┤
│  │ TRANSCRIPT           │  │  [Overview][Sections][KeyPts][FA] │
│  │ Scrollable list      │  │  Tab content here...              │
│  └──────────────────────┘  │                                   │
├────────────────────────────┴───────────────────────────────────┤
│  FRAMES STRIP  ◀ [thumb][thumb][thumb][thumb][thumb] ▶  📷     │
└────────────────────────────────────────────────────────────────┘
```

### 4. Mobile Responsive Layout
Rework `/dashboard/src/pages/app/VideoAnalysis.css`

#### Priority Order (L-R, T-B)
1. Video Player (full width, 16:9)
2. Transcript (collapsible, default 3 lines)
3. Video type badge
4. Quick summary
5. Tabs (horizontal scroll)
6. Tab content (scrollable)
7. Frames (horizontal scroll)

#### Breakpoints
| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column, stacked |
| 768px - 1024px | Video 60% / Summary 40% or stacked |
| > 1024px | Full split-pane layout |

---

## Files to Create/Modify

### Create
- `/dashboard/src/components/Common/CompactHeader.js`
- `/dashboard/src/components/Common/CompactHeader.css`
- `/dashboard/src/components/Video/ViewModeToggle.js`

### Modify
- `/dashboard/src/pages/app/VideoAnalysis.js` - Complete restructure
- `/dashboard/src/pages/app/VideoAnalysis.css` - Complete restyle
- `/dashboard/src/components/Video/VideoPlayer.js` - Add modes

---

## Success Criteria
- [ ] Header is 48px with all actions working
- [ ] Video player has 3 working modes (Default/Theater/Full)
- [ ] Split-pane layout works on desktop
- [ ] Mobile layout stacks in L-R, T-B priority
- [ ] Breakpoints work correctly (768px, 1024px)
- [ ] Transcript is collapsible on mobile
- [ ] No visual regressions from current functionality

---

## Dependencies
- None (this is the foundation task)

## Blocks
- Task 10 (Frame System)
- Task 11 (Full Analysis)
