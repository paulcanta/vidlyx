import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

/**
 * PageTransition Component
 *
 * Wraps route content with smooth page transition animations.
 * Uses react-transition-group for mounting/unmounting animations.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content to animate
 * @param {string} props.mode - Animation mode: 'fade' | 'slide' | 'scale'
 * @param {number} props.timeout - Animation duration in ms
 */
const PageTransition = ({
  children,
  mode = 'fade',
  timeout = 300
}) => {
  const location = useLocation();

  return (
    <TransitionGroup className="page-transition-group">
      <CSSTransition
        key={location.pathname}
        timeout={timeout}
        classNames={`page-${mode}`}
        unmountOnExit
      >
        <div className="page-transition-wrapper">
          {children}
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default PageTransition;
