import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TextT, FrameCorners } from '@phosphor-icons/react';

/**
 * SaveCard component - displays a save in grid view
 * @param {Object} save - Save object
 */
function SaveCard({ save }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/app/collection/save/${save.id}`);
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

  // Get thumbnail or placeholder
  const renderThumbnail = () => {
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
        <TextT size={48} weight="thin" />
      </div>
    );
  };

  const frameCount = save.frameCount || save.frame_count || 1;
  const selectionCount = save.selectionCount || save.selection_count || 0;

  return (
    <div style={styles.card} onClick={handleClick}>
      <div style={styles.thumbnailContainer}>
        {renderThumbnail()}
        {frameCount > 1 && (
          <div style={styles.badge}>
            <FrameCorners size={14} weight="bold" />
            <span style={styles.badgeText}>{frameCount}</span>
          </div>
        )}
      </div>

      <div style={styles.content}>
        <h3 style={styles.title}>{save.title || 'Untitled Save'}</h3>
        <p style={styles.videoTitle}>
          {save.videoTitle || save.video_title || 'Unknown Video'}
        </p>
        <div style={styles.meta}>
          <span style={styles.date}>
            {formatDate(save.createdAt || save.created_at)}
          </span>
          {selectionCount > 0 && (
            <>
              <span style={styles.separator}>•</span>
              <span style={styles.selectionCount}>
                {selectionCount} {selectionCount === 1 ? 'selection' : 'selections'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb'
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%', // 16:9 aspect ratio
    backgroundColor: '#f3f4f6',
    overflow: 'hidden'
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  placeholderThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    color: '#d1d5db'
  },
  badge: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600
  },
  badgeText: {
    lineHeight: 1
  },
  content: {
    padding: '12px'
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  videoTitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: '0 0 8px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  date: {
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  separator: {
    fontSize: '0.75rem',
    color: '#d1d5db'
  },
  selectionCount: {
    fontSize: '0.75rem',
    color: '#9ca3af'
  }
};

export default SaveCard;
