import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TextT, FrameCorners, BookmarkSimple } from '@phosphor-icons/react';

/**
 * SaveList component - displays saves in a list view
 * @param {Array} saves - List of saves to display
 */
function SaveList({ saves = [] }) {
  const navigate = useNavigate();

  const handleClick = (saveId) => {
    navigate(`/app/collection/save/${saveId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  // Render thumbnail or placeholder
  const renderThumbnail = (save) => {
    if (save.thumbnailUrl || save.thumbnail_url) {
      return (
        <img
          src={save.thumbnailUrl || save.thumbnail_url}
          alt={save.title || 'Save thumbnail'}
          style={styles.thumbnail}
        />
      );
    }

    // Text-only save placeholder
    return (
      <div style={styles.placeholderThumbnail}>
        <TextT size={24} weight="thin" />
      </div>
    );
  };

  if (saves.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      {saves.map((save) => {
        const frameCount = save.frameCount || save.frame_count || 1;
        const selectionCount = save.selectionCount || save.selection_count || 0;

        return (
          <div
            key={save.id}
            style={styles.row}
            onClick={() => handleClick(save.id)}
          >
            {/* Thumbnail */}
            <div style={styles.thumbnailContainer}>
              {renderThumbnail(save)}
            </div>

            {/* Content */}
            <div style={styles.content}>
              <div style={styles.titleSection}>
                <h3 style={styles.title}>{save.title || 'Untitled Save'}</h3>
                <p style={styles.videoTitle}>
                  {save.videoTitle || save.video_title || 'Unknown Video'}
                </p>
              </div>

              <div style={styles.metaSection}>
                {frameCount > 1 && (
                  <div style={styles.metaItem}>
                    <FrameCorners size={16} />
                    <span>{frameCount} frames</span>
                  </div>
                )}
                {selectionCount > 0 && (
                  <div style={styles.metaItem}>
                    <BookmarkSimple size={16} />
                    <span>
                      {selectionCount} {selectionCount === 1 ? 'selection' : 'selections'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div style={styles.dateSection}>
              <span style={styles.date}>
                {formatDate(save.createdAt || save.created_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb'
  },
  thumbnailContainer: {
    position: 'relative',
    width: '120px',
    height: '68px',
    flexShrink: 0,
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6'
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    color: '#d1d5db'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  videoTitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  metaSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  dateSection: {
    flexShrink: 0
  },
  date: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    whiteSpace: 'nowrap'
  }
};

export default SaveList;
