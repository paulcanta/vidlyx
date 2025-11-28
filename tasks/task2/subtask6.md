# Task 2 - Subtask 6: Transcription UI Panel with Sync

## Objective
Build the transcript panel with synchronized scrolling and click-to-seek functionality.

## Prerequisites
- Task 2 - Subtask 5 completed (Transcription stored in database)
- YouTube player integrated and firing time updates
- Transcript data available via API

## Instructions

### 1. Create Transcript Panel Component
Create `/home/pgc/vidlyx/dashboard/src/components/Transcript/TranscriptPanel.js`:

**Props:**
- segments (array of transcript segments)
- currentTime (number - current video time)
- onSeek (function - callback when timestamp clicked)
- searchQuery (string - optional search filter)

**Layout:**
```
┌─────────────────────────────────┐
│ TRANSCRIPT        🔍 [Search]  │
├─────────────────────────────────┤
│                                 │
│ [00:00] Hello and welcome...    │
│                                 │
│ [00:05] ████████████████████    │ ← Active segment highlighted
│         Today we'll learn...    │
│                                 │
│ [00:12] First, let's look at... │
│                                 │
│ [00:18] The main concept is...  │
│                                 │
│         [Scroll continues...]   │
│                                 │
└─────────────────────────────────┘
```

### 2. Create Transcript Segment Component
Create `/home/pgc/vidlyx/dashboard/src/components/Transcript/TranscriptSegment.js`:

**Props:**
- segment (object with start, end, text)
- isActive (boolean - currently playing)
- onClick (function - seek to this segment)
- searchQuery (string - for highlighting)

**Features:**
- Timestamp button (clickable to seek)
- Text content
- Active state highlight (background color)
- Hover state
- Search term highlighting

```jsx
function TranscriptSegment({ segment, isActive, onClick, searchQuery }) {
  return (
    <div
      className={`transcript-segment ${isActive ? 'active' : ''}`}
      onClick={() => onClick(segment.start)}
    >
      <button className="timestamp">
        [{formatTimestamp(segment.start)}]
      </button>
      <p className="text">
        {highlightText(segment.text, searchQuery)}
      </p>
    </div>
  );
}
```

### 3. Implement Active Segment Detection
Find the currently playing segment based on video time:

```javascript
function findActiveSegment(segments, currentTime) {
  return segments.findIndex(segment =>
    currentTime >= segment.start && currentTime < segment.end
  );
}

// In TranscriptPanel
const [activeIndex, setActiveIndex] = useState(-1);

useEffect(() => {
  const index = findActiveSegment(segments, currentTime);
  setActiveIndex(index);
}, [segments, currentTime]);
```

### 4. Implement Auto-Scroll
Scroll to keep active segment visible:

```javascript
const scrollContainerRef = useRef(null);
const segmentRefs = useRef([]);

useEffect(() => {
  if (activeIndex >= 0 && segmentRefs.current[activeIndex]) {
    segmentRefs.current[activeIndex].scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}, [activeIndex]);
```

**Auto-scroll toggle:**
- Add "Auto-scroll" toggle switch
- When disabled, user can scroll freely
- Re-enable to jump to current segment

### 5. Implement Click-to-Seek
When user clicks a timestamp or segment:

```javascript
const handleSegmentClick = (startTime) => {
  onSeek(startTime);
  // Player seekTo will be called in parent component
};
```

### 6. Implement Search Within Transcript
Create `/home/pgc/vidlyx/dashboard/src/components/Transcript/TranscriptSearch.js`:

**Features:**
- Search input with debounce (300ms)
- Show match count
- Navigate between matches (up/down arrows)
- Clear search button

```jsx
function TranscriptSearch({ onSearch, matchCount }) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useMemo(
    () => debounce((q) => onSearch(q), 300),
    [onSearch]
  );

  return (
    <div className="transcript-search">
      <input
        type="text"
        placeholder="Search transcript..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
      />
      {query && <span>{matchCount} matches</span>}
    </div>
  );
}
```

### 7. Highlight Search Terms
Create utility to highlight matches:

```javascript
function highlightText(text, query) {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i}>{part}</mark>
      : part
  );
}
```

### 8. Filter Segments by Search
When searching, filter and highlight matching segments:

```javascript
const filteredSegments = useMemo(() => {
  if (!searchQuery) return segments;

  return segments.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [segments, searchQuery]);
```

### 9. Create Copy Transcript Feature
Add ability to copy transcript sections:

```jsx
<button onClick={() => copyTranscript('full')}>
  Copy Full Transcript
</button>

<button onClick={() => copyTranscript('selection')}>
  Copy Selected
</button>

function copyTranscript(mode) {
  const text = mode === 'full'
    ? segments.map(s => `[${formatTimestamp(s.start)}] ${s.text}`).join('\n')
    : selectedText;

  navigator.clipboard.writeText(text);
  showToast('Copied to clipboard');
}
```

### 10. Style the Transcript Panel
Create `/home/pgc/vidlyx/dashboard/src/components/Transcript/Transcript.css`:

```css
.transcript-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
}

.transcript-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transcript-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.transcript-segment {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.transcript-segment:hover {
  background: var(--bg-tertiary);
}

.transcript-segment.active {
  background: var(--color-primary-light);
  border-left: 3px solid var(--color-primary);
}

.timestamp {
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: none;
  border: none;
  padding: 0;
  margin-right: var(--space-2);
}

.timestamp:hover {
  text-decoration: underline;
}

mark {
  background: yellow;
  color: black;
  padding: 0 2px;
  border-radius: 2px;
}
```

### 11. Integrate into Video Analysis Page
Update `VideoAnalysis.js`:

```jsx
function VideoAnalysis() {
  const { transcript } = useTranscript(video?.id);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);

  const handleSeek = (time) => {
    playerRef.current?.seekTo(time);
  };

  return (
    <div className="video-analysis three-panel">
      <div className="panel video-panel">
        <YouTubePlayer
          ref={playerRef}
          onTimeUpdate={setCurrentTime}
        />
      </div>

      <div className="panel transcript-panel">
        <TranscriptPanel
          segments={transcript?.segments || []}
          currentTime={currentTime}
          onSeek={handleSeek}
        />
      </div>

      <div className="panel analysis-panel">
        {/* Frames/Summary - coming later */}
      </div>
    </div>
  );
}
```

## Verification

### Auto-Scroll:
1. Play video
2. Transcript should auto-scroll to current segment
3. Active segment should be highlighted

### Click-to-Seek:
1. Click any timestamp in transcript
2. Video should jump to that time
3. Segment should become active

### Search:
1. Type in search box
2. Matching segments should be highlighted
3. Non-matching segments should be filtered (or dimmed)

### Copy:
1. Click "Copy Transcript"
2. Paste in text editor
3. Should have timestamps and text

## Next Steps
Task 2 Complete! Proceed to Task 3 - Subtask 1 (FFmpeg Integration for Frame Extraction)

## Estimated Time
3-4 hours

## Notes
- Auto-scroll should not fight with user scrolling
- Consider virtual scrolling for very long transcripts
- Search should be case-insensitive
- Keyboard navigation: Ctrl+F to focus search
- Mobile: Swipe between panels instead of three-column
