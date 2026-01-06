import React, { useState } from 'react';
import { BookmarkSimple, X } from '@phosphor-icons/react';
import Modal from '../Common/Modal';
import FolderPicker from './FolderPicker';
import useFolders from '../../hooks/useFolders';
import saveService from '../../services/saveService';
import { formatTimestamp } from '../../utils/formatters';

/**
 * SaveCreator Component
 * Modal for creating new saves from selected content
 */
function SaveCreator({ videoId, selectedContent, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { folders, loading: foldersLoading, createFolder } = useFolders();

  // Get content counts
  const frameCount = selectedContent?.frames?.length || 0;
  const transcriptCount = selectedContent?.transcript?.length || 0;

  const handleFolderChange = (folderIds) => {
    setSelectedFolders(folderIds);
  };

  const handleCreateFolder = async (data) => {
    try {
      const newFolder = await createFolder(data);
      // Add the new folder to selected
      setSelectedFolders([...selectedFolders, newFolder.id]);
    } catch (err) {
      console.error('Failed to create folder:', err);
      throw err;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare save data
      const saveData = {
        video_id: videoId,
        title: title.trim() || generateAutoTitle(),
        notes: notes.trim() || null,
        folder_ids: selectedFolders,
        frames: selectedContent?.frames?.map(f => ({
          frame_id: f.id,
          timestamp: f.timestamp
        })) || [],
        transcript_segments: selectedContent?.transcript?.map(t => ({
          transcript_id: t.id,
          start_time: t.start_time,
          end_time: t.end_time,
          text: t.text
        })) || []
      };

      const response = await saveService.create(saveData);

      if (onSave) {
        onSave(response.data);
      }

      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err.response?.data?.error || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const generateAutoTitle = () => {
    const parts = [];
    if (frameCount > 0) {
      parts.push(`${frameCount} frame${frameCount > 1 ? 's' : ''}`);
    }
    if (transcriptCount > 0) {
      parts.push(`${transcriptCount} segment${transcriptCount > 1 ? 's' : ''}`);
    }
    return parts.join(' + ') || 'Untitled Save';
  };

  const folderPickerWithCreate = {
    onCreate: handleCreateFolder
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Save Content"
      size="large"
    >
      <div style={styles.container}>
        {/* Preview Section */}
        <div style={styles.previewSection}>
          <div style={styles.previewHeader}>
            <BookmarkSimple size={20} weight="fill" color="#2563eb" />
            <span style={styles.previewTitle}>Selected Content</span>
          </div>

          {/* Frames Preview */}
          {frameCount > 0 && (
            <div style={styles.contentGroup}>
              <h4 style={styles.contentLabel}>Frames ({frameCount})</h4>
              <div style={styles.frameGrid}>
                {selectedContent.frames.slice(0, 4).map((frame) => (
                  <div key={frame.id} style={styles.frameThumbnail}>
                    <img
                      src={frame.thumbnail_url || frame.image_url}
                      alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
                      style={styles.frameImage}
                    />
                    <div style={styles.frameTimestamp}>
                      {formatTimestamp(frame.timestamp)}
                    </div>
                  </div>
                ))}
                {frameCount > 4 && (
                  <div style={styles.moreIndicator}>
                    +{frameCount - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transcript Preview */}
          {transcriptCount > 0 && (
            <div style={styles.contentGroup}>
              <h4 style={styles.contentLabel}>Transcript Segments ({transcriptCount})</h4>
              <div style={styles.transcriptPreview}>
                {selectedContent.transcript.slice(0, 3).map((segment, idx) => (
                  <div key={segment.id || idx} style={styles.transcriptSegment}>
                    <span style={styles.transcriptTime}>
                      {formatTimestamp(segment.start_time)}
                    </span>
                    <span style={styles.transcriptText}>
                      {segment.text.slice(0, 100)}
                      {segment.text.length > 100 && '...'}
                    </span>
                  </div>
                ))}
                {transcriptCount > 3 && (
                  <div style={styles.moreText}>
                    +{transcriptCount - 3} more segments
                  </div>
                )}
              </div>
            </div>
          )}

          {frameCount === 0 && transcriptCount === 0 && (
            <div style={styles.emptyPreview}>
              No content selected
            </div>
          )}
        </div>

        {/* Form Section */}
        <div style={styles.formSection}>
          {/* Title Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Title
              <span style={styles.optional}>(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={generateAutoTitle()}
              style={styles.input}
              disabled={saving}
            />
          </div>

          {/* Notes Textarea */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this save..."
              style={styles.textarea}
              rows={4}
              disabled={saving}
            />
          </div>

          {/* Folder Picker */}
          <FolderPicker
            selected={selectedFolders}
            onChange={(ids) => {
              if (typeof ids === 'function') {
                setSelectedFolders(ids(selectedFolders));
              } else {
                setSelectedFolders(ids);
              }
            }}
            folders={folders}
            allowCreate={true}
          />

          {/* Error Message */}
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button
            onClick={onClose}
            style={styles.cancelButton}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              ...styles.saveButton,
              ...(saving ? styles.saveButtonDisabled : {})
            }}
            disabled={saving || (frameCount === 0 && transcriptCount === 0)}
          >
            <BookmarkSimple size={18} weight="fill" />
            <span>{saving ? 'Saving...' : 'Save Content'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  previewSection: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px'
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  previewTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151'
  },
  contentGroup: {
    marginBottom: '16px'
  },
  contentLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  frameGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '8px'
  },
  frameThumbnail: {
    position: 'relative',
    aspectRatio: '16/9',
    borderRadius: '4px',
    overflow: 'hidden',
    background: '#e5e7eb'
  },
  frameImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  frameTimestamp: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    padding: '2px 6px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '11px',
    fontFamily: 'monospace',
    borderRadius: '3px'
  },
  moreIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '16/9',
    background: '#e5e7eb',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280'
  },
  transcriptPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  transcriptSegment: {
    display: 'flex',
    gap: '12px',
    padding: '8px',
    background: 'white',
    borderRadius: '4px',
    fontSize: '13px'
  },
  transcriptTime: {
    flexShrink: 0,
    color: '#2563eb',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: '600'
  },
  transcriptText: {
    color: '#374151',
    lineHeight: '1.5'
  },
  moreText: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '4px'
  },
  emptyPreview: {
    padding: '24px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  optional: {
    fontSize: '12px',
    fontWeight: '400',
    color: '#9ca3af'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s'
  },
  errorMessage: {
    padding: '12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    fontSize: '14px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    background: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  saveButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};

export default SaveCreator;
