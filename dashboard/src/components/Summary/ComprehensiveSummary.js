import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Article, Copy, Check } from '@phosphor-icons/react';

/**
 * ComprehensiveSummary Component
 * Renders the comprehensive analysis markdown with rich formatting
 */
function ComprehensiveSummary({ content, onCopy }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!content) {
    return (
      <div className="comprehensive-summary empty">
        <Article size={32} weight="duotone" />
        <p>No comprehensive summary available yet.</p>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="comprehensive-summary">
      <div className="summary-header">
        <div className="header-title">
          <Article size={16} weight="fill" />
          <span>Comprehensive Summary</span>
        </div>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={14} weight="bold" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="summary-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .comprehensive-summary {
    display: flex;
    flex-direction: column;
    background: #f9fafb;
    border-radius: 10px;
    overflow: hidden;
  }

  .comprehensive-summary.empty {
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #9ca3af;
    gap: 0.5rem;
    min-height: 150px;
  }

  .comprehensive-summary.empty p {
    margin: 0;
    font-size: 0.875rem;
  }

  .summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .copy-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .summary-content {
    padding: 1rem;
    font-size: 0.9375rem;
    line-height: 1.7;
    color: #374151;
    max-height: 400px;
    overflow-y: auto;
    text-align: left;
  }

  .summary-content h1,
  .summary-content h2,
  .summary-content h3,
  .summary-content h4 {
    color: #111827;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    text-align: left;
  }

  .summary-content h1:first-child,
  .summary-content h2:first-child {
    margin-top: 0;
  }

  .summary-content h2 {
    font-size: 1.125rem;
    font-weight: 600;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .summary-content h3 {
    font-size: 1rem;
    font-weight: 600;
  }

  .summary-content p {
    margin: 0.75rem 0;
    text-align: left;
  }

  .summary-content ul,
  .summary-content ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
    text-align: left;
  }

  .summary-content li {
    margin: 0.375rem 0;
    text-align: left;
  }

  .summary-content code {
    background: #e5e7eb;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 0.875em;
  }

  .summary-content pre {
    background: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
  }

  .summary-content pre code {
    background: transparent;
    padding: 0;
    color: inherit;
  }

  .summary-content blockquote {
    border-left: 3px solid #6366f1;
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    background: #f5f3ff;
    color: #5b21b6;
  }

  .summary-content strong {
    font-weight: 600;
    color: #1f2937;
  }

  .summary-content a {
    color: #2563eb;
    text-decoration: none;
  }

  .summary-content a:hover {
    text-decoration: underline;
  }
`;

export default ComprehensiveSummary;
