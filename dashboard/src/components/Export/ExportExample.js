/**
 * Example usage of Export components
 * This file demonstrates how to integrate ExportMenu and CopyButton
 * into your application pages
 */

import React, { useState } from 'react';
import { ExportMenu, CopyButton } from './index';

/**
 * Example: Save View with Export
 */
export const SaveViewExample = ({ save }) => {
  const [exportStatus, setExportStatus] = useState('');

  return (
    <div className="save-view">
      <div className="save-header">
        <h1>{save.title}</h1>
        <div className="save-actions">
          <ExportMenu
            type="save"
            id={save.id}
            onExportStart={(format) => {
              setExportStatus(`Exporting as ${format}...`);
            }}
            onExportComplete={(format, filename) => {
              setExportStatus(`Exported successfully: ${filename}`);
              setTimeout(() => setExportStatus(''), 3000);
            }}
            onExportError={(error) => {
              setExportStatus(`Export failed: ${error.message}`);
              setTimeout(() => setExportStatus(''), 5000);
            }}
          />
        </div>
      </div>

      {exportStatus && (
        <div className="export-status-message">
          {exportStatus}
        </div>
      )}

      {/* Rest of save content */}
    </div>
  );
};

/**
 * Example: Video Analysis with Transcript Export
 */
export const VideoAnalysisExample = ({ video, transcript }) => {
  return (
    <div className="video-analysis">
      <div className="transcript-section">
        <div className="transcript-header">
          <h2>Transcript</h2>
          <div className="transcript-actions">
            <CopyButton
              text={transcript.fullText}
              label="Copy"
              successLabel="Copied!"
              className="copy-button-ghost"
              onCopySuccess={() => {
                console.log('Transcript copied to clipboard');
              }}
            />
            <ExportMenu
              type="transcript"
              id={video.id}
              label="Download"
              className="export-menu-outline"
            />
          </div>
        </div>
        <div className="transcript-content">
          {transcript.fullText}
        </div>
      </div>
    </div>
  );
};

/**
 * Example: Collection Page with Bulk Export
 */
export const CollectionPageExample = ({ saves }) => {
  return (
    <div className="collection-page">
      <div className="collection-grid">
        {saves.map((save) => (
          <div key={save.id} className="save-card">
            <h3>{save.title}</h3>
            <p>{save.notes}</p>
            <div className="save-card-actions">
              <ExportMenu
                type="save"
                id={save.id}
                label="Export"
                className="export-menu-small export-menu-ghost"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Example: Code Block with Copy
 */
export const CodeBlockExample = ({ code, language }) => {
  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-language">{language}</span>
        <CopyButton
          text={code}
          className="copy-button-small copy-button-icon-only"
        />
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Example: Integration with Toast Notifications
 */
export const ToastIntegrationExample = ({ save, showToast }) => {
  return (
    <ExportMenu
      type="save"
      id={save.id}
      onExportComplete={(format, filename) => {
        showToast({
          type: 'success',
          message: `Successfully exported as ${format}`,
          description: filename
        });
      }}
      onExportError={(error) => {
        showToast({
          type: 'error',
          message: 'Export failed',
          description: error.message
        });
      }}
    />
  );
};
