import React from 'react';
import { X } from '@phosphor-icons/react';

/**
 * TagChip component - displays a colored chip with tag name and optional remove button
 * @param {Object} props
 * @param {Object} props.tag - Tag object with name and color
 * @param {Function} props.onRemove - Optional callback when X button is clicked
 */
function TagChip({ tag, onRemove }) {
  if (!tag) return null;

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    backgroundColor: `${tag.color}20`,
    color: tag.color,
    border: `1px solid ${tag.color}40`,
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    color: 'inherit',
    opacity: '0.7',
    transition: 'opacity 0.2s',
  };

  return (
    <div className="tag-chip" style={chipStyle}>
      <span>{tag.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag._id || tag.id);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          aria-label={`Remove ${tag.name}`}
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

export default TagChip;
