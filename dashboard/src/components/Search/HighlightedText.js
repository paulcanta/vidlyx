import React from 'react';
import DOMPurify from 'dompurify';

/**
 * HighlightedText Component
 *
 * Renders text with highlighted search matches using HTML marks.
 * Sanitizes HTML to prevent XSS attacks while allowing only <mark> tags.
 */
const HighlightedText = ({ text, className = '' }) => {
  if (!text) {
    return null;
  }

  // Configure DOMPurify to only allow mark tags for highlighting
  const sanitizeConfig = {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  };

  // Sanitize the HTML to prevent XSS while preserving mark tags
  const sanitizedHTML = DOMPurify.sanitize(text, sanitizeConfig);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

export default HighlightedText;
