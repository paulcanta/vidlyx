import React, { useState } from 'react';
import Modal from '../Common/Modal';
import ColorPicker from '../common/ColorPicker';

/**
 * EditFolderModal component for editing existing folders
 * @param {Object} props
 * @param {Object} props.folder - Folder object to edit
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSave - Callback when folder is saved
 */
function EditFolderModal({ folder, onClose, onSave }) {
  const [name, setName] = useState(folder.name || '');
  const [color, setColor] = useState(folder.color || '#6366f1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate name
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({ name: name.trim(), color });
      onClose();
    } catch (err) {
      console.error('Error updating folder:', err);
      setError(err.message || 'Failed to update folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.6 : 1
        }}
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isSubmitting || !name.trim()}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: isSubmitting || !name.trim() ? '#93c5fd' : '#3b82f6',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Folder"
      footer={footer}
      size="small"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="folder-name"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}
          >
            Folder Name
          </label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Enter folder name"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!error) {
                e.target.style.borderColor = '#3b82f6';
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.target.style.borderColor = '#d1d5db';
              }
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {error}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}
          >
            Color
          </label>
          <ColorPicker selected={color} onChange={setColor} />
        </div>
      </form>
    </Modal>
  );
}

export default EditFolderModal;
