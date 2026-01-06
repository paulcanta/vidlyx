# Vidlyx VideoAnalysis Page Redesign Plan v2

## Final Decisions

| Decision | Choice |
|----------|--------|
| Implementation | **Option A: Full Redesign** |
| Frame Analysis | **Claude Code (manual) for now**, architected for future Gemini/Anthropic AI |
| Regeneration | **Yes**, all tabs together, triggered by new captured frames. Metered for future billing |
| Video Types | **All types supported** - educational, entertainment, tutorials, reviews, vlogs, podcasts, news, etc. |

---

## Architecture Overview

### Layout: Split-Pane with Video Modes

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

---

## Video Player Modes

### 1. Default Mode
- Video: **50% width**, max **400px height**
- Summary panel: **50% width**, full height beside video
- Transcript: Below video, left column
- Best for: Analysis work, reading while watching

### 2. Theater Mode
- Video: **80% width, centered**, **560px height**
- Content panels: Below video in 50/50 split
- Best for: Focused viewing, larger video

### 3. Fullscreen Mode
- Native browser fullscreen
- Video fills screen
- Controls overlay on hover

### Mode Toggle UI
Located in header: `[⛶ Default] [🎭 Theater] [⛶ Full]`

---

## Header Design (48px)

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

---

## Frame Capture System

### Architecture for Future AI Providers

```javascript
// Frame Analysis Service Interface
// Currently: Manual/Claude Code
// Future: Gemini Vision API or Anthropic Claude Vision

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

  // Manual analysis - user describes or we extract OCR only
  manualAnalysis(frameData) {
    return {
      ocrText: extractOCR(frameData),
      userDescription: null, // User can add manually
      autoAnalysis: null     // No AI analysis in manual mode
    };
  },

  // Future: Gemini Vision
  geminiAnalysis(frameData, options) {
    // API call to Gemini Vision
  },

  // Future: Anthropic Claude Vision
  anthropicAnalysis(frameData, options) {
    // API call to Claude Vision
  }
};
```

### Frame Capture Flow

```
User clicks "📷 Capture Frame" at timestamp T
                    ↓
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

### Frame-Transcript Linking

When frame captured at timestamp `T`:
1. Find transcript segments in range `[T-15s, T+15s]`
2. Extract OCR text from frame
3. Store frame with linked transcript segment IDs
4. Display correlation in Visual Context

---

## Analysis Regeneration System

### Trigger: New Captured Frames

When user captures new frames and clicks "Regenerate Analysis":
1. All tabs regenerate together (not individual tabs)
2. New frame data enriches the analysis
3. Usage is tracked for future billing

### Database: Usage Tracking

```sql
CREATE TABLE analysis_regenerations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id),
  user_id UUID REFERENCES users(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  trigger_reason VARCHAR(50), -- 'new_frames', 'manual', 'quality_issue'
  frames_included INTEGER,
  tokens_used INTEGER, -- For future billing
  provider VARCHAR(20), -- 'manual', 'gemini', 'anthropic'
  cost_credits DECIMAL(10,4) DEFAULT 0, -- Future billing
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Regeneration UI

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 REGENERATE ANALYSIS                                     │
│                                                             │
│  Your analysis will be regenerated with:                    │
│  • Original transcript data                                 │
│  • 5 captured frames (NEW: +2 since last analysis)         │
│                                                             │
│  ⚠️ This action will be charged when billing is enabled    │
│                                                             │
│  [🔄 Regenerate All] [Cancel]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary Panel: Video Type Detection

### Supported Video Types

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

### Adaptive Analysis Templates

The analysis adapts based on detected video type:

```javascript
const analysisTemplates = {
  educational: {
    overview: ['TL;DR', 'Learning Objectives', 'Prerequisites', 'Summary'],
    sections: ['Topic', 'Concepts Covered', 'Examples Given'],
    keyPoints: ['Concept', 'Definition', 'Example', 'Tip'],
    fullAnalysis: ['Content Depth', 'Teaching Quality', 'Practical Applications']
  },

  entertainment: {
    overview: ['TL;DR', 'Vibe/Mood', 'Entertainment Value', 'Summary'],
    sections: ['Segment', 'Highlights', 'Notable Moments'],
    keyPoints: ['Highlight', 'Funny Moment', 'Memorable Quote'],
    fullAnalysis: ['Entertainment Analysis', 'Audience Appeal', 'Replay Value']
  },

  tutorial: {
    overview: ['TL;DR', 'What You\'ll Make', 'Difficulty', 'Time Required'],
    sections: ['Step', 'Materials/Tools', 'Instructions'],
    keyPoints: ['Step', 'Tip', 'Warning', 'Alternative'],
    fullAnalysis: ['Completeness', 'Clarity', 'Skill Level Required']
  },

  review: {
    overview: ['TL;DR', 'Product', 'Verdict', 'Rating'],
    sections: ['Aspect Reviewed', 'Pros', 'Cons'],
    keyPoints: ['Pro', 'Con', 'Comparison', 'Recommendation'],
    fullAnalysis: ['Objectivity', 'Thoroughness', 'Value Assessment']
  },

  podcast: {
    overview: ['TL;DR', 'Topic', 'Speakers', 'Summary'],
    sections: ['Discussion Topic', 'Key Exchange', 'Tangent'],
    keyPoints: ['Insight', 'Opinion', 'Fact', 'Disagreement'],
    fullAnalysis: ['Discussion Quality', 'Speaker Dynamics', 'Topic Coverage']
  },

  // ... more types
};
```

---

## Tab 1: Overview (Adaptive)

### Educational Video Example
```
┌─────────────────────────────────────────────────────────────┐
│  OVERVIEW                                    📚 Educational │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TL;DR                                                       │
│  ─────                                                       │
│  Learn Claude Opus 4.5's new tool use features with          │
│  practical code examples and cost optimization strategies.   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📊 QUICK FACTS                                      │    │
│  │  Duration: 26:32  │  Level: Advanced                │    │
│  │  Prerequisites: Basic API knowledge                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  LEARNING OBJECTIVES                                         │
│  ───────────────────                                         │
│  After watching, you'll understand:                          │
│  • How to use the new Tool Search feature                    │
│  • Programmatic tool calling patterns                        │
│  • Cost optimization with the Effort parameter               │
│                                                              │
│  SUMMARY                                                     │
│  ───────                                                     │
│  [Well-formatted paragraphs...]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Entertainment Video Example
```
┌─────────────────────────────────────────────────────────────┐
│  OVERVIEW                                   🎬 Entertainment │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TL;DR                                                       │
│  ─────                                                       │
│  A hilarious compilation of gaming fails with commentary.    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📊 QUICK FACTS                                      │    │
│  │  Duration: 12:45  │  Mood: Comedy, Chaotic          │    │
│  │  Content: Gaming highlights, reactions               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  HIGHLIGHTS                                                  │
│  ──────────                                                  │
│  • Epic fail at 3:24 - character falls off map              │
│  • Unexpected plot twist at 7:15                             │
│  • Best reaction moment at 10:02                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Review Video Example
```
┌─────────────────────────────────────────────────────────────┐
│  OVERVIEW                                        📝 Review  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TL;DR                                                       │
│  ─────                                                       │
│  iPhone 16 Pro review - great camera, disappointing battery. │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📊 VERDICT                                          │    │
│  │  Product: iPhone 16 Pro  │  Rating: 8.5/10          │    │
│  │  Recommendation: Buy if upgrading from 13 or older  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  QUICK PROS & CONS                                           │
│  ─────────────────                                           │
│  ✅ Camera system    ❌ Battery life                         │
│  ✅ Build quality    ❌ Price increase                       │
│  ✅ Performance      ❌ Limited AI features                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tab 2: Sections (Enhanced)

```
┌─────────────────────────────────────────────────────────────┐
│  SECTIONS                                        12 sections │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ INTRODUCTION ──────────────────────── 0:00 - 1:24 ────┐ │
│  │  Speaker introduces the topic and sets expectations.    │ │
│  │                                                         │ │
│  │  [▶ Play] [📋 Copy]                         1m 24s      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ PRICING ANALYSIS ══════════════════════ 1:24 - 5:47 ══┐ │
│  │  ★ KEY SECTION                                          │ │
│  │                                                         │ │
│  │  Detailed breakdown of the pricing changes and their    │ │
│  │  implications for production use.                       │ │
│  │                                                         │ │
│  │  Key Points:                                            │ │
│  │  • Input tokens: $15 → $5 (3x reduction)                │ │
│  │  • Output tokens: $75 → $25 (3x reduction)              │ │
│  │  • Now competitive with GPT-4 Turbo pricing             │ │
│  │                                                         │ │
│  │  📷 2 frames captured in this section                   │ │
│  │                                                         │ │
│  │  [▶ Play] [📋 Copy]                         4m 23s      │ │
│  └═════════════════════════════════════════════════════════┘ │
│                                                              │
│  ┌─ EFFORT PARAMETER ──────────────────── 5:47 - 9:12 ────┐ │
│  │  Explanation of the new effort parameter system.        │ │
│  │                                                         │ │
│  │  [▶ Play] [📋 Copy]                         3m 25s      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ════════════════════════════════════════════════════════    │
│  SECTION TIMELINE                                            │
│  ▓▓░░░░░░░░░▓▓▓▓▓░░░░░░░░░▓▓▓░░░░░░░░░░░▓▓▓▓▓▓▓░░░░░░      │
│  Intro   Pricing     Effort    Tools        Demo    Wrap     │
│  ════════════════════════════════════════════════════════    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Time ranges with duration
- Key section highlighting (double border)
- Expandable details
- Frame count indicator
- Play section button
- Visual timeline scrubber
- Copy notes function

---

## Tab 3: Key Points (Categorized)

```
┌─────────────────────────────────────────────────────────────┐
│  KEY POINTS                                      12 points   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [All 12] [💡 Insights 4] [📊 Facts 5] [💬 Quotes 2] [⚡ Actions 1]│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💡 INSIGHT                                   @ 2:34  │   │
│  │                                                      │   │
│  │ "The 3x price reduction fundamentally changes the    │   │
│  │  economics of using Opus for production workloads"   │   │
│  │                                                      │   │
│  │ Section: Pricing Analysis                            │   │
│  │ [▶ Jump] [📋 Copy]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📊 FACT                                      @ 4:15  │   │
│  │                                                      │   │
│  │ Input: $15 → $5/M tokens                             │   │
│  │ Output: $75 → $25/M tokens                           │   │
│  │ Effective: Immediately                               │   │
│  │                                                      │   │
│  │ [▶ Jump] [📋 Copy]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ⚡ ACTION                                    @ 15:30 │   │
│  │                                                      │   │
│  │ Try Tool Search by passing tools as searchable       │   │
│  │ context instead of fixed function definitions        │   │
│  │                                                      │   │
│  │ [▶ Jump] [📋 Copy]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💬 QUOTE                                     @ 22:10 │   │
│  │                                                      │   │
│  │ "The subjective improvement from Sonnet is less      │   │
│  │  dramatic than benchmarks suggest"                   │   │
│  │                                                      │   │
│  │ — Charles, Letta                                     │   │
│  │ [▶ Jump] [📋 Copy]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
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

## Tab 4: Full Analysis (Comprehensive Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│  FULL ANALYSIS                           📚 Educational     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ CONTENT METRICS ───────────────────────────────────────┐│
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   ││
│  │  │ DURATION │ │ SPEECH   │ │ VISUALS  │ │ CODE     │   ││
│  │  │  26:32   │ │   89%    │ │   45%    │ │  12 min  │   ││
│  │  │          │ │ talking  │ │ on-screen│ │ visible  │   ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ COMPREHENSIVE SUMMARY ─────────────────────────────────┐│
│  │                                                          ││
│  │  ## Overview                                             ││
│  │                                                          ││
│  │  This video provides an in-depth technical analysis of   ││
│  │  Anthropic's Claude Opus 4.5 release. Charles from Letta ││
│  │  demonstrates practical implementations while providing  ││
│  │  honest assessments of the improvements.                 ││
│  │                                                          ││
│  │  ## Key Developments                                     ││
│  │                                                          ││
│  │  **Pricing Revolution**                                  ││
│  │  The most impactful change is the 3x price reduction     ││
│  │  across both input and output tokens. This shifts Opus   ││
│  │  from a premium-only option to a viable production       ││
│  │  choice for cost-conscious deployments.                  ││
│  │                                                          ││
│  │  **Effort Parameter**                                    ││
│  │  Replacing the complex reasoning token limits, the new   ││
│  │  effort parameter offers intuitive high/medium/low       ││
│  │  settings. This simplifies API usage while maintaining   ││
│  │  fine-grained control over response depth.               ││
│  │                                                          ││
│  │  **Advanced Tool Use**                                   ││
│  │  Three beta features expand Claude's capabilities:       ││
│  │  1. Tool Search - Dynamic tool discovery                 ││
│  │  2. Programmatic Calling - CodeAct-style execution       ││
│  │  3. Tool Use Examples - In-context learning              ││
│  │                                                          ││
│  │  ## Assessment                                           ││
│  │                                                          ││
│  │  The presenter provides balanced analysis, noting that   ││
│  │  while benchmarks show improvement, subjective quality   ││
│  │  differences from Sonnet 4.5 are less dramatic than      ││
│  │  numbers suggest. The real value lies in the pricing     ││
│  │  and new tool capabilities.                              ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ VISUAL ANALYSIS ───────────────────────────────────────┐│
│  │                                                          ││
│  │  📷 5 Frames Captured                                    ││
│  │                                                          ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ││
│  │  │[thumb] │ │[thumb] │ │[thumb] │ │[thumb] │ │[thumb] │ ││
│  │  │Code    │ │UI      │ │Diagram │ │Config  │ │Results │ ││
│  │  │@ 3:45  │ │@ 8:12  │ │@ 14:30 │ │@ 19:05 │ │@ 23:18 │ ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ ││
│  │                                                          ││
│  │  Visual Content Breakdown:                               ││
│  │  • Code snippets: 3 frames (Python, API calls)           ││
│  │  • UI demonstrations: 1 frame (Letta interface)          ││
│  │  • Results/output: 1 frame (benchmark comparison)        ││
│  │                                                          ││
│  │  💡 Captured frames enhance transcript context by        ││
│  │     showing code that was only referenced verbally.      ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ TRANSCRIPT ANALYSIS ───────────────────────────────────┐│
│  │                                                          ││
│  │  Words: 4,523 │ Unique: 892 │ Technical: 145 │ Names: 12 ││
│  │                                                          ││
│  │  TERMINOLOGY GLOSSARY                                    ││
│  │  ───────────────────                                     ││
│  │  • CodeAct: Code execution pattern for tool calling      ││
│  │  • Tool Search: Dynamic tool discovery via embedding     ││
│  │  • Effort Parameter: Response depth control (H/M/L)      ││
│  │  • Letta: AI agent development platform                  ││
│  │  • MCP: Model Context Protocol                           ││
│  │                                                          ││
│  │  SPEAKER ANALYSIS                                        ││
│  │  ────────────────                                        ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │ Charles (Primary)  ████████████████████████░░ 91%  │ ││
│  │  │ Demo Audio         ██░░░░░░░░░░░░░░░░░░░░░░░░  9%  │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ QUALITY ASSESSMENT ────────────────────────────────────┐│
│  │                                                          ││
│  │  Content Quality    ████████░░  8/10                     ││
│  │  Production Value   ███████░░░  7/10                     ││
│  │  Information Density████████░░  8/10                     ││
│  │  Practical Value    █████████░  9/10                     ││
│  │                                                          ││
│  │  Suitable For:                                           ││
│  │  ✅ API developers wanting Opus 4.5 overview             ││
│  │  ✅ Teams evaluating Claude for production               ││
│  │  ✅ Developers interested in advanced tool use           ││
│  │  ⚠️ Beginners (assumes API familiarity)                  ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ RELATED TOPICS ────────────────────────────────────────┐│
│  │                                                          ││
│  │  For deeper understanding, explore:                      ││
│  │  • Anthropic Claude API Documentation                    ││
│  │  • Tool Use Best Practices Guide                         ││
│  │  • Letta Platform Documentation                          ││
│  │  • Claude Sonnet vs Opus Comparison                      ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [📥 Export Analysis] [🔄 Regenerate] [📋 Copy All]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ⚠️ Regeneration will be charged when billing is enabled    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Full Analysis Sections by Video Type

| Section | Educational | Entertainment | Review | Podcast |
|---------|-------------|---------------|--------|---------|
| Content Metrics | ✅ | ✅ | ✅ | ✅ |
| Comprehensive Summary | ✅ | ✅ | ✅ | ✅ |
| Visual Analysis | ✅ | ✅ Highlights | ✅ Product shots | ✅ Speaker shots |
| Transcript Analysis | ✅ | Lighter | ✅ | ✅ Speakers |
| Learning Assessment | ✅ | — | — | — |
| Entertainment Value | — | ✅ | — | — |
| Product Assessment | — | — | ✅ | — |
| Discussion Quality | — | — | — | ✅ |
| Quality Assessment | ✅ | ✅ | ✅ | ✅ |
| Related Topics | ✅ | Related videos | Alternatives | Related episodes |

---

## Mobile Layout

### Priority: Left-to-Right, Top-to-Bottom

Desktop split-pane maps to mobile as:
```
LEFT COLUMN (first)     →    MOBILE (in order)
├─ Video Player         →    1. Video Player
└─ Transcript           →    2. Transcript

RIGHT COLUMN (second)   →
├─ Summary Overview     →    3. Summary Overview
└─ Summary Tabs         →    4. Summary Tabs

BOTTOM                  →
└─ Frames Strip         →    5. Frames Strip
```

### Mobile Layout Structure

```
┌─────────────────────────┐
│ ← │ Title...    │ ⋯    │  Header (48px)
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │   VIDEO PLAYER    │  │  1. Video (full width, 16:9)
│  │   ▶ ━━━━━ 26:32   │  │
│  └───────────────────┘  │
├─────────────────────────┤
│  TRANSCRIPT       [▼]   │  2. Transcript (collapsible)
│  [0:03] Hi everyone...  │     Default: 3 lines
│  [0:04] another model   │     Expanded: scrollable
│  [Show more ▼]          │
├─────────────────────────┤
│  📚 Educational         │  3. Video type badge
├─────────────────────────┤
│  TL;DR                  │  4. Quick summary
│  Learn Claude Opus...   │
├─────────────────────────┤
│ [Overview][Sections]... │  5. Tabs (horizontal scroll)
├─────────────────────────┤
│  Tab content here       │  6. Tab content (scrollable)
│  ...                    │
├─────────────────────────┤
│  📷 FRAMES  ◀ [t][t] ▶  │  7. Frames (horizontal scroll)
└─────────────────────────┘
```

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column, stacked |
| 768px - 1024px | Video 60% / Summary 40% or stacked |
| > 1024px | Full split-pane layout |

---

## Component Structure

### New Components to Create

```
src/components/
├── VideoPlayer/
│   ├── VideoPlayer.js          # Main player with modes
│   ├── VideoPlayer.css
│   ├── ViewModeToggle.js       # Default/Theater/Full toggle
│   └── PlayerControls.js       # Custom controls bar
│
├── FrameCapture/
│   ├── FrameStrip.js           # Horizontal carousel
│   ├── FrameStrip.css
│   ├── FrameCaptureModal.js    # Capture + analysis UI
│   ├── FrameThumbnail.js       # Individual frame card
│   └── frameAnalysisService.js # Analysis provider interface
│
├── Summary/
│   ├── SummaryPanel.js         # Tab container (update)
│   ├── SummaryPanel.css        # (update)
│   ├── OverviewTab.js          # (major update)
│   ├── SectionsTab.js          # (major update)
│   ├── SectionCard.js          # NEW - expandable section
│   ├── KeyPointsTab.js         # (major update)
│   ├── KeyPointCard.js         # NEW - categorized point
│   ├── FullAnalysisTab.js      # (major update → dashboard)
│   ├── AnalysisDashboard.js    # NEW - full analysis view
│   └── VideoTypeDetector.js    # NEW - detect video type
│
└── Common/
    ├── CompactHeader.js        # NEW - 48px header
    └── TimelineBar.js          # NEW - section timeline
```

### Files to Modify

```
src/pages/app/
├── VideoAnalysis.js            # Complete restructure
└── VideoAnalysis.css           # Complete restyle

src/services/
├── frameService.js             # Add analysis methods
└── summaryService.js           # Add regeneration tracking
```

### Database Changes

```sql
-- Add video type detection
ALTER TABLE videos ADD COLUMN detected_type VARCHAR(30);
ALTER TABLE videos ADD COLUMN type_confidence DECIMAL(3,2);

-- Add key point categories
ALTER TABLE key_points ADD COLUMN category VARCHAR(20);
-- 'insight', 'fact', 'quote', 'action', 'tip', 'warning', etc.

-- Add section importance
ALTER TABLE sections ADD COLUMN importance INTEGER DEFAULT 3;
-- 1-5 scale, 5 = must-watch

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

-- Analysis regeneration tracking
CREATE TABLE analysis_regenerations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id),
  user_id UUID REFERENCES users(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  trigger_reason VARCHAR(50),
  frames_included INTEGER,
  tokens_used INTEGER,
  provider VARCHAR(20) DEFAULT 'manual',
  cost_credits DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Order

### Phase 1: Layout Foundation
1. Create CompactHeader component
2. Restructure VideoAnalysis.js with split-pane
3. Implement video player modes (Default/Theater/Full)
4. Mobile responsive layout

### Phase 2: Frame System
5. Create FrameStrip component
6. Create FrameCaptureModal
7. Implement frame-transcript linking (±15s)
8. Frame analysis service interface

### Phase 3: Summary Enhancement
9. VideoTypeDetector implementation
10. OverviewTab redesign (adaptive)
11. SectionsTab redesign with timeline
12. KeyPointsTab with categories

### Phase 4: Full Analysis
13. AnalysisDashboard component
14. Content metrics display
15. Visual analysis section
16. Transcript analysis section
17. Quality assessment

### Phase 5: Polish
18. Regeneration UI + tracking
19. Export functionality
20. Animation/transitions
21. Final responsive testing

---

## Success Criteria

- [ ] Video player has 3 working modes
- [ ] Header is compact (48px) with all actions
- [ ] Split-pane layout with proper proportions
- [ ] Frame capture links to transcript ±15s
- [ ] Summary adapts to video type
- [ ] Sections show time ranges and importance
- [ ] Key points are categorized with timestamps
- [ ] Full Analysis is comprehensive dashboard
- [ ] Mobile layout follows L-R, T-B priority
- [ ] Regeneration is tracked for future billing
- [ ] All space is utilized efficiently

---

## Ready for Implementation

This plan is final and decisive. All major decisions have been made:

1. ✅ Layout: Split-pane with video modes
2. ✅ Header: 48px compact
3. ✅ Frames: Manual analysis now, AI-ready architecture
4. ✅ Regeneration: All tabs, tracked for billing
5. ✅ Video types: Adaptive analysis templates
6. ✅ Mobile: L-R, T-B priority
7. ✅ Implementation: Option A (Full Redesign)

**Awaiting approval to begin implementation.**
