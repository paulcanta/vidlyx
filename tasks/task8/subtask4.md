# Task 8 - Subtask 4: Export Functionality

## Objective
Implement export features for saves, transcripts, and frames.

## Prerequisites
- Task 8 - Subtask 3 completed (Keyboard Shortcuts)

## Instructions

### 1. Create Export Service (Backend)
Create `/home/pgc/vidlyx/backend/services/exportService.js`:

```javascript
const db = require('../config/database');
const path = require('path');
const archiver = require('archiver');
const { formatTimestamp } = require('../utils/formatters');

class ExportService {
  async exportSave(saveId, userId, format = 'json') {
    const save = await this.getSaveWithContent(saveId, userId);

    switch (format) {
      case 'json':
        return this.exportAsJson(save);
      case 'markdown':
        return this.exportAsMarkdown(save);
      case 'txt':
        return this.exportAsText(save);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async getSaveWithContent(saveId, userId) {
    // Get save with all related data
    const result = await db.query(
      `SELECT s.*, v.title as video_title, v.youtube_id, v.channel_name
       FROM saves s
       LEFT JOIN videos v ON s.video_id = v.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [saveId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Save not found');
    }

    const save = result.rows[0];

    // Get frames
    const frames = await db.query(
      `SELECT f.* FROM frames f
       JOIN save_frames sf ON f.id = sf.frame_id
       WHERE sf.save_id = $1
       ORDER BY f.timestamp_seconds ASC`,
      [saveId]
    );
    save.frames = frames.rows;

    // Get transcripts
    const transcripts = await db.query(
      `SELECT * FROM save_transcripts
       WHERE save_id = $1
       ORDER BY start_time ASC`,
      [saveId]
    );
    save.transcript_selections = transcripts.rows;

    // Get folders
    const folders = await db.query(
      `SELECT f.name FROM folders f
       JOIN save_folders sf ON f.id = sf.folder_id
       WHERE sf.save_id = $1`,
      [saveId]
    );
    save.folders = folders.rows.map(f => f.name);

    // Get tags
    const tags = await db.query(
      `SELECT t.name FROM tags t
       JOIN save_tags st ON t.id = st.tag_id
       WHERE st.save_id = $1`,
      [saveId]
    );
    save.tags = tags.rows.map(t => t.name);

    return save;
  }

  exportAsJson(save) {
    const exportData = {
      title: save.title || save.auto_title,
      notes: save.notes,
      video: {
        title: save.video_title,
        youtubeId: save.youtube_id,
        channel: save.channel_name,
        url: `https://youtube.com/watch?v=${save.youtube_id}`
      },
      frames: save.frames.map(f => ({
        timestamp: formatTimestamp(f.timestamp_seconds),
        timestampSeconds: f.timestamp_seconds,
        ocrText: f.ocr_text,
        analysisText: f.analysis_text
      })),
      transcriptSelections: save.transcript_selections.map(t => ({
        start: formatTimestamp(t.start_time),
        end: formatTimestamp(t.end_time),
        text: t.text
      })),
      folders: save.folders,
      tags: save.tags,
      createdAt: save.created_at,
      exportedAt: new Date().toISOString()
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      contentType: 'application/json',
      filename: `${this.sanitizeFilename(save.title || save.auto_title || 'save')}.json`
    };
  }

  exportAsMarkdown(save) {
    let md = `# ${save.title || save.auto_title || 'Untitled Save'}\n\n`;

    md += `## Source Video\n`;
    md += `- **Title:** ${save.video_title}\n`;
    md += `- **Channel:** ${save.channel_name}\n`;
    md += `- **URL:** https://youtube.com/watch?v=${save.youtube_id}\n\n`;

    if (save.notes) {
      md += `## Notes\n${save.notes}\n\n`;
    }

    if (save.frames.length > 0) {
      md += `## Frames (${save.frames.length})\n\n`;
      save.frames.forEach((frame, i) => {
        md += `### Frame ${i + 1} - ${formatTimestamp(frame.timestamp_seconds)}\n`;
        if (frame.ocr_text) {
          md += `**OCR Text:**\n${frame.ocr_text}\n\n`;
        }
        if (frame.analysis_text) {
          md += `**Analysis:**\n${frame.analysis_text}\n\n`;
        }
      });
    }

    if (save.transcript_selections.length > 0) {
      md += `## Transcript Selections\n\n`;
      save.transcript_selections.forEach(sel => {
        md += `> **[${formatTimestamp(sel.start_time)} - ${formatTimestamp(sel.end_time)}]**\n`;
        md += `> ${sel.text}\n\n`;
      });
    }

    if (save.folders.length > 0) {
      md += `## Folders\n${save.folders.map(f => `- ${f}`).join('\n')}\n\n`;
    }

    if (save.tags.length > 0) {
      md += `## Tags\n${save.tags.map(t => `\`${t}\``).join(' ')}\n\n`;
    }

    md += `---\n*Exported on ${new Date().toLocaleDateString()}*\n`;

    return {
      content: md,
      contentType: 'text/markdown',
      filename: `${this.sanitizeFilename(save.title || save.auto_title || 'save')}.md`
    };
  }

  exportAsText(save) {
    let text = `${save.title || save.auto_title || 'Untitled Save'}\n`;
    text += `${'='.repeat(50)}\n\n`;

    text += `Source Video: ${save.video_title}\n`;
    text += `Channel: ${save.channel_name}\n`;
    text += `URL: https://youtube.com/watch?v=${save.youtube_id}\n\n`;

    if (save.notes) {
      text += `Notes:\n${save.notes}\n\n`;
    }

    if (save.transcript_selections.length > 0) {
      text += `Transcript Selections:\n${'-'.repeat(30)}\n\n`;
      save.transcript_selections.forEach(sel => {
        text += `[${formatTimestamp(sel.start_time)} - ${formatTimestamp(sel.end_time)}]\n`;
        text += `${sel.text}\n\n`;
      });
    }

    return {
      content: text,
      contentType: 'text/plain',
      filename: `${this.sanitizeFilename(save.title || save.auto_title || 'save')}.txt`
    };
  }

  async exportTranscript(videoId, userId, format = 'txt') {
    const video = await db.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, userId]
    );

    if (video.rows.length === 0) {
      throw new Error('Video not found');
    }

    const transcripts = await db.query(
      `SELECT * FROM transcripts
       WHERE video_id = $1
       ORDER BY start_time ASC`,
      [videoId]
    );

    const v = video.rows[0];

    switch (format) {
      case 'txt':
        return this.transcriptAsText(v, transcripts.rows);
      case 'srt':
        return this.transcriptAsSrt(v, transcripts.rows);
      case 'vtt':
        return this.transcriptAsVtt(v, transcripts.rows);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  transcriptAsText(video, segments) {
    let text = `${video.title}\n`;
    text += `${video.channel_name}\n`;
    text += `${'='.repeat(50)}\n\n`;

    segments.forEach(seg => {
      text += `[${formatTimestamp(seg.start_time)}] ${seg.text}\n`;
    });

    return {
      content: text,
      contentType: 'text/plain',
      filename: `${this.sanitizeFilename(video.title)}-transcript.txt`
    };
  }

  transcriptAsSrt(video, segments) {
    let srt = '';
    segments.forEach((seg, i) => {
      srt += `${i + 1}\n`;
      srt += `${this.formatSrtTime(seg.start_time)} --> ${this.formatSrtTime(seg.end_time)}\n`;
      srt += `${seg.text}\n\n`;
    });

    return {
      content: srt,
      contentType: 'application/x-subrip',
      filename: `${this.sanitizeFilename(video.title)}.srt`
    };
  }

  transcriptAsVtt(video, segments) {
    let vtt = 'WEBVTT\n\n';
    segments.forEach((seg, i) => {
      vtt += `${i + 1}\n`;
      vtt += `${this.formatVttTime(seg.start_time)} --> ${this.formatVttTime(seg.end_time)}\n`;
      vtt += `${seg.text}\n\n`;
    });

    return {
      content: vtt,
      contentType: 'text/vtt',
      filename: `${this.sanitizeFilename(video.title)}.vtt`
    };
  }

  formatSrtTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  formatVttTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  sanitizeFilename(name) {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
  }
}

module.exports = new ExportService();
```

### 2. Create Export Routes
Create `/home/pgc/vidlyx/backend/routes/export.js`:

```javascript
const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Export a save
router.get('/saves/:id', async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const result = await exportService.exportSave(
      req.params.id,
      req.user.id,
      format
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (error) {
    next(error);
  }
});

// Export transcript
router.get('/videos/:id/transcript', async (req, res, next) => {
  try {
    const { format = 'txt' } = req.query;
    const result = await exportService.exportTranscript(
      req.params.id,
      req.user.id,
      format
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 3. Create Frontend Export Menu
Create `/home/pgc/vidlyx/dashboard/src/components/Export/ExportMenu.js`:

```jsx
import React, { useState } from 'react';
import { Export, FileText, FileMd, Code, FileDoc, Subtitles } from '@phosphor-icons/react';
import { Menu, MenuItem } from '../ui/Menu';
import { showToast } from '../../utils/toast';
import './ExportMenu.css';

function ExportMenu({ type, id, title }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const endpoint = type === 'save'
        ? `/api/export/saves/${id}?format=${format}`
        : `/api/export/videos/${id}/transcript?format=${format}`;

      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export.${format}`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast('Export downloaded', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const saveFormats = [
    { id: 'json', label: 'JSON', icon: <Code size={16} />, description: 'Machine-readable data' },
    { id: 'markdown', label: 'Markdown', icon: <FileMd size={16} />, description: 'Formatted document' },
    { id: 'txt', label: 'Plain Text', icon: <FileText size={16} />, description: 'Simple text file' }
  ];

  const transcriptFormats = [
    { id: 'txt', label: 'Plain Text', icon: <FileText size={16} />, description: 'Simple text file' },
    { id: 'srt', label: 'SRT', icon: <Subtitles size={16} />, description: 'Subtitle format' },
    { id: 'vtt', label: 'WebVTT', icon: <Subtitles size={16} />, description: 'Web subtitle format' }
  ];

  const formats = type === 'save' ? saveFormats : transcriptFormats;

  return (
    <Menu
      trigger={
        <button className="export-trigger" disabled={exporting}>
          <Export size={18} />
          <span>Export</span>
        </button>
      }
    >
      <div className="export-menu-header">
        Export as...
      </div>
      {formats.map(format => (
        <MenuItem
          key={format.id}
          icon={format.icon}
          onClick={() => handleExport(format.id)}
        >
          <div className="export-option">
            <span className="export-label">{format.label}</span>
            <span className="export-description">{format.description}</span>
          </div>
        </MenuItem>
      ))}
    </Menu>
  );
}

export default ExportMenu;
```

### 4. Style Export Menu
Create `/home/pgc/vidlyx/dashboard/src/components/Export/ExportMenu.css`:

```css
.export-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.export-trigger:hover {
  background: var(--bg-tertiary);
  border-color: var(--color-primary);
}

.export-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-menu-header {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
}

.export-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.export-label {
  font-weight: 500;
}

.export-description {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

### 5. Add Copy to Clipboard Feature
Create `/home/pgc/vidlyx/dashboard/src/components/Export/CopyButton.js`:

```jsx
import React, { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import './CopyButton.css';

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      className={`copy-button ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check size={16} />
          Copied!
        </>
      ) : (
        <>
          <Copy size={16} />
          {label}
        </>
      )}
    </button>
  );
}

export default CopyButton;
```

### 6. Register Routes
Update `/home/pgc/vidlyx/backend/server.js`:

```javascript
const exportRoutes = require('./routes/export');

app.use('/api/export', exportRoutes);
```

## Verification
1. Export save as JSON downloads correct file
2. Export save as Markdown is well-formatted
3. Export transcript as TXT works
4. Export transcript as SRT has correct timing format
5. Copy button copies text to clipboard
6. Export shows loading state

## Next Steps
Proceed to Task 8 - Subtask 5 (Responsive Design)

## Estimated Time
2-3 hours
