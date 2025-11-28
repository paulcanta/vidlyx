# Task 5 - Subtask 5: Summary Panel UI with Tabs

## Objective
Create a tabbed interface for viewing summaries, sections, and key points.

## Prerequisites
- Task 5 - Subtask 4 completed (Full video summary)

## Instructions

### 1. Create Summary Panel Component
Create `/home/pgc/vidlyx/dashboard/src/components/Summary/SummaryPanel.js`:

```jsx
function SummaryPanel({ videoId, currentTime, onSeek }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { summary } = useVideoSummary(videoId);
  const { sections } = useSections(videoId);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Article /> },
    { id: 'sections', label: 'Sections', icon: <List /> },
    { id: 'keypoints', label: 'Key Points', icon: <Star /> }
  ];

  return (
    <div className="summary-panel">
      <div className="panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="panel-content">
        {activeTab === 'overview' && (
          <OverviewTab summary={summary} />
        )}
        {activeTab === 'sections' && (
          <SectionsTab
            sections={sections}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        )}
        {activeTab === 'keypoints' && (
          <KeyPointsTab summary={summary} sections={sections} />
        )}
      </div>
    </div>
  );
}
```

### 2. Create Overview Tab
```jsx
function OverviewTab({ summary }) {
  if (!summary) return <EmptyState message="Processing..." />;

  return (
    <div className="overview-tab">
      <section>
        <h4>Summary</h4>
        <p>{summary.full_summary}</p>
      </section>

      <section>
        <h4>Topics Covered</h4>
        <div className="topic-tags">
          {summary.topics?.map((topic, i) => (
            <span key={i} className="topic-tag">{topic}</span>
          ))}
        </div>
      </section>

      <section className="meta-grid">
        <div className="meta-card">
          <Users size={20} />
          <span>For: {summary.target_audience}</span>
        </div>
        <div className="meta-card">
          <GraduationCap size={20} />
          <span>Level: {summary.difficulty_level}</span>
        </div>
      </section>
    </div>
  );
}
```

### 3. Create Sections Tab
```jsx
function SectionsTab({ sections, currentTime, onSeek }) {
  const activeSection = sections.find(s =>
    currentTime >= s.start_time && currentTime < s.end_time
  );

  return (
    <div className="sections-tab">
      {sections.map(section => (
        <div
          key={section.id}
          className={`section-card ${section.id === activeSection?.id ? 'active' : ''}`}
          onClick={() => onSeek(section.start_time)}
        >
          <div className="section-header">
            <span className="section-time">
              {formatTimestamp(section.start_time)}
            </span>
            <h4>{section.title}</h4>
          </div>
          {section.summary && (
            <p className="section-summary">{section.summary}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 4. Create Key Points Tab
```jsx
function KeyPointsTab({ summary, sections }) {
  // Combine video-level and section-level key points
  const allKeyPoints = [
    ...(summary?.key_takeaways || []).map(p => ({ text: p, source: 'video' })),
    ...sections.flatMap(s =>
      (s.key_points || []).map(p => ({ text: p, source: s.title }))
    )
  ];

  return (
    <div className="keypoints-tab">
      <ul className="keypoints-list">
        {allKeyPoints.map((point, i) => (
          <li key={i} className="keypoint-item">
            <CheckCircle size={16} className="keypoint-icon" />
            <div>
              <span className="keypoint-text">{point.text}</span>
              <span className="keypoint-source">{point.source}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. Style the Panel
```css
.summary-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  padding: 0 var(--space-2);
}

.tab {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.section-card {
  padding: var(--space-3);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  margin-bottom: var(--space-2);
}

.section-card:hover {
  background: var(--bg-tertiary);
}

.section-card.active {
  background: var(--color-primary-light);
  border-left: 3px solid var(--color-primary);
}

.keypoint-item {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}

.keypoint-icon {
  color: var(--color-success);
  flex-shrink: 0;
}
```

## Verification
1. Tabs switch correctly
2. Sections highlight when video plays through them
3. Clicking section seeks video
4. Key points combine video and section level

## Next Steps
Proceed to Task 5 - Subtask 6 (Key Points Extraction and Display)

## Estimated Time
2-3 hours
