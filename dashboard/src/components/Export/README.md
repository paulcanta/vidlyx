# Export Components

Components for exporting saves and transcripts in various formats.

## Components

### ExportMenu

A dropdown menu component for exporting content in various formats.

**Props:**
- `type` (string, required): Type of export ('save' or 'transcript')
- `id` (string, required): ID of the save or video
- `label` (string, optional): Button label (default: 'Export')
- `className` (string, optional): Additional CSS classes
- `onExportStart` (function, optional): Callback when export starts
- `onExportComplete` (function, optional): Callback when export completes
- `onExportError` (function, optional): Callback when export fails

**Export Formats:**

For saves:
- JSON - Structured data format
- Markdown - Formatted document
- Plain Text - Simple text format

For transcripts:
- Plain Text - Simple text format
- SRT - SubRip subtitle format
- WebVTT - Web Video Text Tracks

**Example Usage:**

```jsx
import { ExportMenu } from '../../components/Export';

// Export a save
<ExportMenu
  type="save"
  id={saveId}
  onExportComplete={(format, filename) => {
    console.log(`Exported as ${format}: ${filename}`);
  }}
  onExportError={(error) => {
    console.error('Export failed:', error);
  }}
/>

// Export a transcript
<ExportMenu
  type="transcript"
  id={videoId}
  label="Download Transcript"
  className="custom-class"
/>
```

### CopyButton

A button component for copying text to clipboard.

**Props:**
- `text` (string, required): Text to copy
- `label` (string, optional): Button label (default: 'Copy')
- `successLabel` (string, optional): Label shown after successful copy (default: 'Copied!')
- `className` (string, optional): Additional CSS classes
- `successDuration` (number, optional): Duration to show success state in ms (default: 2000)
- `onCopySuccess` (function, optional): Callback when copy succeeds
- `onCopyError` (function, optional): Callback when copy fails

**Example Usage:**

```jsx
import { CopyButton } from '../../components/Export';

<CopyButton
  text="Text to copy"
  label="Copy to Clipboard"
  onCopySuccess={(text) => {
    console.log('Copied:', text);
  }}
/>

// Icon only variant
<CopyButton
  text={transcriptText}
  className="copy-button-icon-only"
/>
```

## Styling

The components come with pre-styled CSS classes. You can customize them using:

### ExportMenu Variants

- `export-menu-small` - Smaller button size
- `export-menu-outline` - Outline style button
- `export-menu-ghost` - Ghost style button

### CopyButton Variants

- `copy-button-primary` - Primary colored button
- `copy-button-small` - Smaller button size
- `copy-button-icon-only` - Show only icon
- `copy-button-ghost` - Ghost style button

## API Endpoints

The components use the following API endpoints:

- `GET /api/export/saves/:id?format=json|markdown|txt` - Export a save
- `GET /api/export/videos/:id/transcript?format=txt|srt|vtt` - Export transcript

Both endpoints require authentication and return file downloads.
