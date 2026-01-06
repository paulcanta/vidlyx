import React, { useState, useEffect, useRef, useCallback } from 'react';
import './VirtualList.css';

/**
 * VirtualList Component
 *
 * Virtualized scrolling for large lists to improve performance
 * Only renders visible items + overscan buffer
 *
 * @param {Array} items - Array of items to render
 * @param {number} itemHeight - Height of each item in pixels
 * @param {number} windowHeight - Height of the scrollable container in pixels
 * @param {Function} renderItem - Function to render each item (item, index) => JSX
 * @param {number} overscan - Number of items to render outside viewport (default: 3)
 */
function VirtualList({
  items = [],
  itemHeight = 100,
  windowHeight = 600,
  renderItem,
  overscan = 3,
  className = ''
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + windowHeight) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Handle scroll event
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback((index) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{ height: windowHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="virtual-list-item"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
