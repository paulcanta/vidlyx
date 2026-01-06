import { useState, useEffect } from 'react';

/**
 * Custom hook to track media query matches
 * @param {string} query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (for SSR compatibility)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Add listener (using addEventListener for better compatibility)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Custom hook for common breakpoint queries
 * @returns {Object} - Object with breakpoint flags and touch detection
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)');

  // Additional useful breakpoints
  const isXSmall = useMediaQuery('(max-width: 479px)');
  const isSmall = useMediaQuery('(min-width: 480px) and (max-width: 639px)');
  const isMedium = useMediaQuery('(min-width: 640px) and (max-width: 767px)');
  const isLarge = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isXLarge = useMediaQuery('(min-width: 1280px)');

  return {
    // Primary breakpoints
    isMobile,
    isTablet,
    isDesktop,
    isTouch,

    // Granular breakpoints
    isXSmall,
    isSmall,
    isMedium,
    isLarge,
    isXLarge,

    // Convenience flags
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}

/**
 * Custom hook for orientation detection
 * @returns {string} - 'portrait' or 'landscape'
 */
export function useOrientation() {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * Custom hook for reduced motion preference
 * @returns {boolean} - Whether user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Custom hook for dark mode preference
 * @returns {boolean} - Whether user prefers dark mode
 */
export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)');
}
