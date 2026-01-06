import React from 'react';
import { Package } from '@phosphor-icons/react';
import './EmptyState.css';

const EmptyState = ({
  icon: Icon = Package,
  iconSize = 64,
  iconWeight = 'duotone',
  title = 'No items found',
  description = 'There are no items to display at the moment.',
  action = null,
  compact = false,
  className = ''
}) => {
  const containerClass = compact
    ? 'empty-state empty-state--compact'
    : 'empty-state';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="empty-state__icon">
        <Icon size={iconSize} weight={iconWeight} />
      </div>

      <div className="empty-state__content">
        <h3 className="empty-state__title">{title}</h3>
        {description && (
          <p className="empty-state__description">{description}</p>
        )}
      </div>

      {action && (
        <div className="empty-state__action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
