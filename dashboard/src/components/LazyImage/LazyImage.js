import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

/**
 * LazyImage Component
 *
 * Lazy loads images using IntersectionObserver
 * Shows placeholder until image enters viewport and loads
 * Fades in smoothly when loaded
 *
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for image
 * @param {string} placeholder - Placeholder image URL or color (optional)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */
function LazyImage({
  src,
  alt = '',
  placeholder = '#f0f0f0',
  className = '',
  style = {},
  ...props
}) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Create IntersectionObserver to detect when image enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before visible
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsLoaded(true); // Still fade in to show broken image
  };

  // Determine if placeholder is color or image URL
  const isColorPlaceholder = placeholder.startsWith('#') ||
                            placeholder.startsWith('rgb') ||
                            placeholder.startsWith('hsl');

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: isColorPlaceholder ? placeholder : 'transparent',
        ...style
      }}
      {...props}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="lazy-image-placeholder">
          {!isColorPlaceholder && (
            <img
              src={placeholder}
              alt=""
              className="lazy-image-placeholder-img"
            />
          )}
          <div className="lazy-image-skeleton" />
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'lazy-image-loaded' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

export default LazyImage;
