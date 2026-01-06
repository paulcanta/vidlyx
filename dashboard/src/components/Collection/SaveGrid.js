import React from 'react';
import DraggableSaveCard from '../Save/DraggableSaveCard';

/**
 * SaveGrid component - displays saves in a responsive grid layout
 * @param {Array} saves - List of saves to display
 */
function SaveGrid({ saves = [] }) {
  if (saves.length === 0) {
    return null;
  }

  return (
    <div style={styles.grid}>
      {saves.map((save) => (
        <DraggableSaveCard key={save.id} save={save} />
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
    width: '100%'
  }
};

export default SaveGrid;
