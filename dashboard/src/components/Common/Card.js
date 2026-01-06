import React from 'react';
import './Card.css';

/**
 * Card Component
 *
 * A flexible card component with various styles and animations.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.interactive - Enable hover effects
 * @param {boolean} props.elevated - Show elevation/shadow
 * @param {boolean} props.bordered - Show border
 * @param {boolean} props.selected - Selected state
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onClick - Click handler
 * @param {string} props.badge - Badge text
 */
const Card = ({
  children,
  className = '',
  interactive = false,
  elevated = false,
  bordered = false,
  selected = false,
  loading = false,
  onClick,
  badge,
  ...rest
}) => {
  const cardClasses = [
    'card',
    interactive && 'card-interactive',
    elevated && 'card-elevated',
    bordered && 'card-bordered',
    selected && 'card-selected',
    loading && 'card-loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...rest}
    >
      {badge && <div className="card-badge">{badge}</div>}
      {children}
    </div>
  );
};

/**
 * CardHeader Component
 */
export const CardHeader = ({ children, className = '', ...rest }) => (
  <div className={`card-header ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * CardTitle Component
 */
export const CardTitle = ({ children, className = '', ...rest }) => (
  <h3 className={`card-title ${className}`} {...rest}>
    {children}
  </h3>
);

/**
 * CardBody Component
 */
export const CardBody = ({ children, className = '', ...rest }) => (
  <div className={`card-body ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * CardFooter Component
 */
export const CardFooter = ({ children, className = '', ...rest }) => (
  <div className={`card-footer ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * CardImage Component
 */
export const CardImage = ({ src, alt, className = '', ...rest }) => (
  <div className="card-image-wrapper">
    <img
      src={src}
      alt={alt}
      className={`card-image ${className}`}
      {...rest}
    />
  </div>
);

export default Card;
