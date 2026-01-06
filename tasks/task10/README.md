# Task 10: Frame System & Summary Enhancement

## Overview
Implement frame capture with transcript linking, video type detection, and redesign all summary tabs.

## Scope
This task covers **Phase 2 + Phase 3** of the redesign plan (vidlyx-plan2.md).

---

## Final Decisions
| Decision | Choice |
|----------|--------|
| Frame Analysis | Manual (Claude Code) for now, architected for Gemini/Anthropic AI |
| Frame-Transcript Link | ±15 seconds from capture timestamp |
| Video Types | 10 types: Educational, Entertainment, Tutorial, Review, Vlog, Podcast, News, Tech Demo, Music, Documentary |

---

## Part A: Frame System (Phase 2)

### 1. FrameStrip Component
Create `/dashboard/src/components/Frames/FrameStrip.js`

Horizontal carousel at bottom of page:
```
┌────────────────────────────────────────────────────────────────┐
│  FRAMES  ◀ [thumb][thumb][thumb][thumb][thumb] ▶  📷 Capture  │
└────────────────────────────────────────────────────────────────┘
```

**Features:**
- Horizontal scroll with arrow navigation
- Click to seek to frame timestamp
- Capture button triggers modal
- Shows frame count

### 2. FrameCaptureModal Component
Create `/dashboard/src/components/Frames/FrameCaptureModal.js`

```
┌─────────────────────────────────────────┐
│  Frame Captured @ 5:32                  │
│  ┌─────────────────────────────────┐    │
│  │       [Frame Preview]           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📝 OCR Text Detected:                  │
│  "def calculate_tokens(text):"          │
│  "return len(tokenizer.encode(text))"   │
│                                         │
│  🔗 Linked Transcript (±15s):           │
│  [5:17] "...let me show you the code"   │
│  [5:24] "...this function calculates"   │
│  [5:32] ← CAPTURED HERE                 │
│  [5:38] "...tokens in the input..."     │
│                                         │
│  📝 Add Description (optional):         │
│  ┌─────────────────────────────────┐    │
│  │ Code snippet showing token...   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [💾 Save Frame] [❌ Cancel]            │
└─────────────────────────────────────────┘
```

### 3. Frame-Transcript Linking
When frame captured at timestamp `T`:
1. Find transcript segments in range `[T-15s, T+15s]`
2. Extract OCR text from frame (existing Tesseract.js)
3. Store frame with linked transcript segment IDs
4. Display correlation in Visual Context

### 4. Frame Analysis Service Interface
Create `/dashboard/src/services/frameAnalysisService.js`

```javascript
const frameAnalysisService = {
  provider: 'manual', // 'manual' | 'gemini' | 'anthropic'

  async analyzeFrame(frameData, options) {
    switch (this.provider) {
      case 'manual':
        return this.manualAnalysis(frameData);
      case 'gemini':
        return this.geminiAnalysis(frameData, options);
      case 'anthropic':
        return this.anthropicAnalysis(frameData, options);
    }
  },

  manualAnalysis(frameData) {
    return {
      ocrText: extractOCR(frameData),
      userDescription: null,
      autoAnalysis: null
    };
  },

  // Future: AI analysis stubs
  geminiAnalysis(frameData, options) { /* TODO */ },
  anthropicAnalysis(frameData, options) { /* TODO */ }
};
```

---

## Part B: Summary Enhancement (Phase 3)

### 5. VideoTypeDetector
Create `/dashboard/src/components/Summary/VideoTypeDetector.js`

| Type | Detection Signals | Analysis Focus |
|------|-------------------|----------------|
| **Educational** | Tutorial keywords, step-by-step, explanations | Learning objectives, concepts, prerequisites |
| **Entertainment** | Music, comedy, reactions, gaming | Highlights, memorable moments, entertainment value |
| **Tutorial** | How-to, DIY, walkthrough | Steps, materials needed, difficulty, time required |
| **Review** | Product names, ratings, comparisons | Pros/cons, verdict, alternatives, value assessment |
| **Vlog** | Personal narrative, daily life | Story arc, locations, people mentioned |
| **Podcast** | Discussion, interview, multiple speakers | Topics discussed, speaker perspectives, key exchanges |
| **News** | Current events, reporting, facts | Key facts, sources, timeline, implications |
| **Tech Demo** | Software, code, product demos | Features shown, use cases, technical details |
| **Music** | Songs, performances, music videos | Artist, genre, mood, lyrics themes |
| **Documentary** | Narrative, historical, investigative | Thesis, evidence presented, conclusions |

### 6. OverviewTab Redesign
Update `/dashboard/src/components/Summary/OverviewTab.js`

Adaptive layout based on video type:

**Educational:**
```
┌─────────────────────────────────────────────────────────────┐
│  OVERVIEW                                    📚 Educational │
├─────────────────────────────────────────────────────────────┤
│  TL;DR                                                      │
│  ─────                                                      │
│  [Concise summary paragraph...]                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 QUICK FACTS                                      │   │
│  │  Duration: 26:32  │  Level: Advanced                │   │
│  │  Prerequisites: Basic API knowledge                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  LEARNING OBJECTIVES                                        │
│  ───────────────────                                        │
│  • Objective 1                                              │
│  • Objective 2                                              │
│                                                             │
│  SUMMARY                                                    │
│  ───────                                                    │
│  [Well-formatted paragraphs...]                             │
└─────────────────────────────────────────────────────────────┘
```

**Review:**
```
┌─────────────────────────────────────────────────────────────┐
│  OVERVIEW                                        📝 Review  │
├─────────────────────────────────────────────────────────────┤
│  TL;DR                                                      │
│  ─────                                                      │
│  [Product review summary...]                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 VERDICT                                          │   │
│  │  Product: iPhone 16 Pro  │  Rating: 8.5/10          │   │
│  │  Recommendation: Buy if upgrading from 13 or older  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  QUICK PROS & CONS                                          │
│  ─────────────────                                          │
│  ✅ Pro 1      ❌ Con 1                                     │
│  ✅ Pro 2      ❌ Con 2                                     │
└─────────────────────────────────────────────────────────────┘
```

### 7. SectionsTab Redesign
Update `/dashboard/src/components/Summary/SectionsTab.js`

```
┌─────────────────────────────────────────────────────────────┐
│  SECTIONS                                        12 sections │
├─────────────────────────────────────────────────────────────┤
│  ┌─ INTRODUCTION ──────────────────────── 0:00 - 1:24 ────┐ │
│  │  Speaker introduces the topic and sets expectations.    │ │
│  │  [▶ Play] [📋 Copy]                         1m 24s      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ PRICING ANALYSIS ══════════════════════ 1:24 - 5:47 ══┐ │
│  │  ★ KEY SECTION                                          │ │
│  │  Detailed breakdown of the pricing changes...           │ │
│  │  Key Points:                                            │ │
│  │  • Point 1                                              │ │
│  │  • Point 2                                              │ │
│  │  📷 2 frames captured in this section                   │ │
│  │  [▶ Play] [📋 Copy]                         4m 23s      │ │
│  └═════════════════════════════════════════════════════════┘ │
│                                                              │
│  ════════════════════════════════════════════════════════    │
│  SECTION TIMELINE                                            │
│  ▓▓░░░░░░░░░▓▓▓▓▓░░░░░░░░░▓▓▓░░░░░░░░░░░▓▓▓▓▓▓▓░░░░░░      │
│  Intro   Pricing     Effort    Tools        Demo    Wrap     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Time ranges with duration
- Key section highlighting (double border)
- Expandable details
- Frame count indicator
- Play section button
- Visual timeline scrubber

### 8. KeyPointsTab Redesign
Update `/dashboard/src/components/Summary/KeyPointsTab.js`

```
┌─────────────────────────────────────────────────────────────┐
│  KEY POINTS                                      12 points   │
├─────────────────────────────────────────────────────────────┤
│  [All 12] [💡 Insights 4] [📊 Facts 5] [💬 Quotes 2] [⚡ 1] │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💡 INSIGHT                                   @ 2:34  │   │
│  │ "The 3x price reduction fundamentally changes..."    │   │
│  │ Section: Pricing Analysis                            │   │
│  │ [▶ Jump] [📋 Copy]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📊 FACT                                      @ 4:15  │   │
│  │ Input: $15 → $5/M tokens                             │   │
│  │ [▶ Jump] [📋 Copy]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Categories by Video Type:**
| Video Type | Categories |
|------------|------------|
| Educational | Concept, Definition, Example, Tip, Warning |
| Entertainment | Highlight, Funny, Memorable, Reaction |
| Tutorial | Step, Tip, Warning, Alternative, Shortcut |
| Review | Pro, Con, Comparison, Verdict, Alternative |
| Podcast | Insight, Opinion, Fact, Disagreement, Question |

---

## Database Changes

```sql
-- Add video type detection
ALTER TABLE videos ADD COLUMN detected_type VARCHAR(30);
ALTER TABLE videos ADD COLUMN type_confidence DECIMAL(3,2);

-- Add key point categories
ALTER TABLE key_points ADD COLUMN category VARCHAR(20);

-- Add section importance
ALTER TABLE sections ADD COLUMN importance INTEGER DEFAULT 3;

-- Frame analysis storage
CREATE TABLE frame_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID REFERENCES frames(id),
  ocr_text TEXT,
  user_description TEXT,
  ai_analysis JSONB,
  provider VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Frame-transcript links
CREATE TABLE frame_transcript_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID REFERENCES frames(id),
  transcript_segment_id UUID REFERENCES transcriptions(id),
  relevance_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Files to Create/Modify

### Create
- `/dashboard/src/components/Frames/FrameStrip.js`
- `/dashboard/src/components/Frames/FrameStrip.css`
- `/dashboard/src/components/Frames/FrameCaptureModal.js`
- `/dashboard/src/components/Frames/FrameThumbnail.js`
- `/dashboard/src/components/Summary/VideoTypeDetector.js`
- `/dashboard/src/components/Summary/SectionCard.js`
- `/dashboard/src/components/Summary/KeyPointCard.js`
- `/dashboard/src/components/Common/TimelineBar.js`
- `/dashboard/src/services/frameAnalysisService.js`
- `/server/src/routes/frameAnalysisRoutes.js`
- `/database/migrations/003_frame_analysis.sql`

### Modify
- `/dashboard/src/services/frameService.js` - Add analysis methods
- `/dashboard/src/components/Summary/OverviewTab.js` - Adaptive layout
- `/dashboard/src/components/Summary/SectionsTab.js` - Timeline, key sections
- `/dashboard/src/components/Summary/KeyPointsTab.js` - Categories
- `/server/src/services/frameService.js` - Transcript linking

---

## Success Criteria
- [ ] FrameStrip shows captured frames in horizontal carousel
- [ ] Frame capture modal shows OCR + linked transcript (±15s)
- [ ] Frame analysis service interface supports provider switching
- [ ] Video type is detected and displayed
- [ ] OverviewTab adapts layout to video type
- [ ] SectionsTab shows time ranges, importance, frame counts
- [ ] KeyPointsTab has category filters
- [ ] Database migrations run without errors
- [ ] All existing functionality preserved

---

## Dependencies
- Task 9 (Layout Foundation) - split-pane layout must exist

## Blocks
- Task 11 (Full Analysis)
