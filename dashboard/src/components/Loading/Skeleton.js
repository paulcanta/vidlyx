import React from 'react';
import './Skeleton.css';

// Base Skeleton component
export const Skeleton = ({
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  className = '',
  style = {}
}) => {
  const variantClass = `skeleton--${variant}`;

  return (
    <div
      className={`skeleton ${variantClass} ${className}`}
      style={{
        width,
        height,
        ...style
      }}
    />
  );
};

// SkeletonText component for text placeholders
export const SkeletonText = ({
  lines = 3,
  lastLineWidth = '80%',
  lineHeight = '1rem',
  gap = '0.75rem',
  className = ''
}) => {
  return (
    <div className={`skeleton-text ${className}`} style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
        />
      ))}
    </div>
  );
};

// SkeletonCard component for card placeholders
export const SkeletonCard = ({
  hasImage = true,
  imageHeight = '200px',
  hasAvatar = false,
  linesCount = 3,
  className = ''
}) => {
  return (
    <div className={`skeleton-card ${className}`}>
      {hasImage && (
        <Skeleton
          width="100%"
          height={imageHeight}
          className="skeleton-card__image"
        />
      )}

      <div className="skeleton-card__content">
        {hasAvatar && (
          <div className="skeleton-card__header">
            <Skeleton
              variant="circular"
              width="40px"
              height="40px"
            />
            <div className="skeleton-card__header-text">
              <Skeleton width="120px" height="1rem" />
              <Skeleton width="80px" height="0.875rem" />
            </div>
          </div>
        )}

        <SkeletonText lines={linesCount} />

        <div className="skeleton-card__footer">
          <Skeleton width="80px" height="2rem" />
          <Skeleton width="80px" height="2rem" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
