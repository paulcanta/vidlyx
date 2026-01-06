# Export Components - Quick Reference Card

## Import

```jsx
import { ExportMenu, CopyButton } from '../../components/Export';
```

## ExportMenu

### Basic Usage

```jsx
// Export a save
<ExportMenu type="save" id={saveId} />

// Export a transcript
<ExportMenu type="transcript" id={videoId} />
```

### With Callbacks

```jsx
<ExportMenu
  type="save"
  id={saveId}
  onExportStart={(format) => console.log(`Exporting ${format}...`)}
  onExportComplete={(format, filename) => console.log(`Done: ${filename}`)}
  onExportError={(error) => console.error(error)}
/>
```

### Styling Variants

```jsx
// Small size
<ExportMenu type="save" id={saveId} className="export-menu-small" />

// Outline style
<ExportMenu type="save" id={saveId} className="export-menu-outline" />

// Ghost style
<ExportMenu type="save" id={saveId} className="export-menu-ghost" />

// Combined
<ExportMenu type="save" id={saveId} className="export-menu-small export-menu-ghost" />
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | string | ✓ | - | 'save' or 'transcript' |
| id | string | ✓ | - | Save ID or Video ID |
| label | string | | 'Export' | Button text |
| className | string | | '' | Additional CSS classes |
| onExportStart | function | | - | Called when export starts |
| onExportComplete | function | | - | Called on success |
| onExportError | function | | - | Called on error |

## CopyButton

### Basic Usage

```jsx
<CopyButton text="Text to copy" />
```

### With Callbacks

```jsx
<CopyButton
  text={textToCopy}
  onCopySuccess={(text) => console.log('Copied!')}
  onCopyError={(error) => console.error(error)}
/>
```

### Styling Variants

```jsx
// Primary style
<CopyButton text={text} className="copy-button-primary" />

// Small size
<CopyButton text={text} className="copy-button-small" />

// Icon only
<CopyButton text={text} className="copy-button-icon-only" />

// Ghost style
<CopyButton text={text} className="copy-button-ghost" />
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| text | string | ✓ | - | Text to copy |
| label | string | | 'Copy' | Button text |
| successLabel | string | | 'Copied!' | Success text |
| className | string | | '' | Additional CSS classes |
| successDuration | number | | 2000 | Success state duration (ms) |
| onCopySuccess | function | | - | Called on success |
| onCopyError | function | | - | Called on error |

## Export Formats

### Save Exports

- **JSON** - `format=json` - Structured data
- **Markdown** - `format=markdown` - Formatted document
- **Plain Text** - `format=txt` - Simple text

### Transcript Exports

- **Plain Text** - `format=txt` - Simple transcript
- **SRT** - `format=srt` - SubRip subtitles
- **WebVTT** - `format=vtt` - Web Video Text Tracks

## API Endpoints

```
GET /api/export/saves/:id?format={format}
GET /api/export/videos/:id/transcript?format={format}
```

## Common Use Cases

### Save Detail Page
```jsx
<div className="save-header">
  <h1>{save.title}</h1>
  <ExportMenu type="save" id={save.id} />
</div>
```

### Collection Grid
```jsx
{saves.map(save => (
  <div className="save-card">
    <h3>{save.title}</h3>
    <ExportMenu
      type="save"
      id={save.id}
      className="export-menu-small export-menu-ghost"
    />
  </div>
))}
```

### Transcript View
```jsx
<div className="transcript-header">
  <h2>Transcript</h2>
  <div className="actions">
    <CopyButton text={transcript.fullText} />
    <ExportMenu type="transcript" id={videoId} />
  </div>
</div>
```

### OCR Text Display
```jsx
<div className="ocr-section">
  <div className="header">
    <h3>On-screen Text</h3>
    <CopyButton
      text={frame.onScreenText}
      className="copy-button-small copy-button-icon-only"
    />
  </div>
  <pre>{frame.onScreenText}</pre>
</div>
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Button doesn't appear | Check imports and required props (type, id) |
| Download doesn't start | Check browser console, verify auth |
| Copy doesn't work | Check text prop, browser permissions |
| Wrong file content | Verify ID is correct, check database |

## Browser Support

- Chrome 87+
- Firefox 78+
- Safari 13+
- Edge 87+

## Files

- Component: `/dashboard/src/components/Export/`
- Service: `/dashboard/src/services/exportService.js`
- Backend: `/server/src/services/exportService.js`
- Routes: `/server/src/routes/exportRoutes.js`
