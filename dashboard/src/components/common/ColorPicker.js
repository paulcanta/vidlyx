import React from 'react';
import { Check } from '@phosphor-icons/react';

const DEFAULT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#64748b'
];

/**
 * ColorPicker component for selecting colors
 * @param {Object} props
 * @param {Array} props.colors - Array of color hex codes
 * @param {string} props.selected - Currently selected color
 * @param {Function} props.onChange - Callback when color is selected
 */
function ColorPicker({ colors = DEFAULT_COLORS, selected, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '8px'
      }}
    >
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: color,
            border: selected === color ? '3px solid #1e40af' : '2px solid #e5e7eb',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            position: 'relative',
            boxShadow: selected === color ? '0 2px 8px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          aria-label={`Select color ${color}`}
          onMouseEnter={(e) => {
            if (selected !== color) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {selected === color && (
            <Check size={20} weight="bold" color="#ffffff" />
          )}
        </button>
      ))}
    </div>
  );
}

export default ColorPicker;
