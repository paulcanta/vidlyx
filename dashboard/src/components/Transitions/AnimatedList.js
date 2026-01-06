import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './AnimatedList.css';

/**
 * AnimatedList Component
 *
 * Wrapper for list items with enter/exit animations.
 * Supports staggered animations using CSS custom properties.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - List items to animate
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.animation - Animation type: 'fade' | 'slide' | 'scale'
 * @param {number} props.timeout - Animation duration in ms
 * @param {boolean} props.stagger - Enable staggered animation
 * @param {number} props.staggerDelay - Delay between items in ms
 * @param {string} props.component - HTML tag for the container
 */
const AnimatedList = ({
  children,
  className = '',
  animation = 'fade',
  timeout = 300,
  stagger = false,
  staggerDelay = 50,
  component: Component = 'div'
}) => {
  // Convert children to array to access index
  const childArray = React.Children.toArray(children);

  return (
    <TransitionGroup
      className={`animated-list ${className}`}
      component={Component}
    >
      {childArray.map((child, index) => {
        // Create a unique key for each child
        const key = child.key || `item-${index}`;

        return (
          <CSSTransition
            key={key}
            timeout={timeout}
            classNames={`list-${animation}`}
            unmountOnExit
          >
            <div
              className="animated-list-item"
              style={stagger ? { '--index': index, '--stagger-delay': `${staggerDelay}ms` } : {}}
            >
              {child}
            </div>
          </CSSTransition>
        );
      })}
    </TransitionGroup>
  );
};

/**
 * AnimatedListItem Component
 *
 * Individual list item wrapper that can be used directly
 * when you need more control over animations.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Item content
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.index - Item index for stagger calculation
 */
export const AnimatedListItem = ({
  children,
  className = '',
  index = 0
}) => {
  return (
    <div
      className={`animated-list-item ${className}`}
      style={{ '--index': index }}
    >
      {children}
    </div>
  );
};

export default AnimatedList;
