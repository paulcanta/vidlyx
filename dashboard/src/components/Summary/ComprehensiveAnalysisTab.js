import React, { useState, useEffect } from 'react';
import { Sparkle, CircleNotch, FileText, Download, ArrowsClockwise } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { summaryService } from '../../services/summaryService';

/**
 * ComprehensiveAnalysisTab Component
 * Displays comprehensive video analysis in markdown format
 */
function ComprehensiveAnalysisTab({ videoId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch comprehensive analysis
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!videoId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await summaryService.getComprehensiveAnalysis(videoId);
        setAnalysis(response.data.comprehensive_analysis);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Failed to fetch comprehensive analysis:', err);
          setError(err.response?.data?.message || 'Failed to load analysis');
        }
        // 404 means analysis hasn't been generated yet - not an error
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [videoId]);

  // Generate comprehensive analysis
  const handleGenerate = async () => {
    if (!videoId) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await summaryService.generateComprehensiveAnalysis(videoId);
      setAnalysis(response.data.comprehensive_analysis);
    } catch (err) {
      console.error('Failed to generate comprehensive analysis:', err);
      setError(err.response?.data?.message || 'Failed to generate analysis');
    } finally {
      setGenerating(false);
    }
  };

  // Download as markdown file
  const handleDownload = () => {
    if (!analysis) return;

    const blob = new Blob([analysis], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-analysis-${videoId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="analysis-loading">
        <CircleNotch size={32} weight="bold" className="spinning" />
        <p>Loading analysis...</p>
        <style>{styles}</style>
      </div>
    );
  }

  // Empty state - no analysis yet
  if (!analysis) {
    return (
      <div className="analysis-empty">
        <FileText size={48} weight="duotone" />
        <div className="empty-content">
          <h4>Comprehensive Analysis Not Generated</h4>
          <p>Generate a detailed markdown analysis document that covers all aspects of this video including key insights, technical details, and practical takeaways.</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {generating ? (
            <div className="generating-status">
              <CircleNotch size={20} weight="bold" className="spinning" />
              <span>Generating comprehensive analysis... This may take a minute.</span>
            </div>
          ) : (
            <button className="generate-btn" onClick={handleGenerate}>
              <Sparkle size={18} weight="fill" />
              Generate Comprehensive Analysis
            </button>
          )}

          <p className="empty-hint">
            Uses Gemini AI to create a detailed document similar to professional video summaries.
          </p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Display analysis
  return (
    <div className="analysis-content">
      {/* Toolbar */}
      <div className="analysis-toolbar">
        <button className="toolbar-btn" onClick={handleDownload} title="Download as Markdown">
          <Download size={18} />
          <span>Download</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={handleGenerate}
          disabled={generating}
          title="Regenerate Analysis"
        >
          {generating ? (
            <CircleNotch size={18} weight="bold" className="spinning" />
          ) : (
            <ArrowsClockwise size={18} />
          )}
          <span>{generating ? 'Generating...' : 'Regenerate'}</span>
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Markdown content */}
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {analysis}
        </ReactMarkdown>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .analysis-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: #9ca3af;
    gap: 0.5rem;
  }

  .analysis-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
    gap: 1rem;
  }

  .analysis-empty svg {
    color: #9ca3af;
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 500px;
  }

  .empty-content h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .empty-content p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }

  .empty-hint {
    font-size: 0.75rem !important;
    color: #9ca3af !important;
    font-style: italic;
  }

  .generate-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .generate-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .generating-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    background: #f3f4f6;
    border-radius: 8px;
    color: #4b5563;
    font-size: 0.875rem;
  }

  .error-message {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.875rem;
    max-width: 100%;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .analysis-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    min-height: 0;
  }

  .analysis-toolbar {
    display: flex;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.15s;
  }

  .toolbar-btn:hover {
    background: #e5e7eb;
    color: #1f2937;
  }

  .toolbar-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .markdown-content {
    font-size: 1rem;
    line-height: 1.8;
    color: #374151;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 1rem 2rem 0;
    min-height: 0;
    text-align: left;
    max-width: 100%;
  }

  /* Ensure all content is left-aligned */
  .markdown-content * {
    text-align: left;
  }

  .markdown-content h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 3px solid #6366f1;
    text-align: left;
  }

  .markdown-content h2 {
    font-size: 1.375rem;
    font-weight: 600;
    color: #1f2937;
    margin: 2rem 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
    text-align: left;
  }

  .markdown-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 1.5rem 0 0.75rem 0;
    text-align: left;
  }

  .markdown-content h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #4b5563;
    margin: 1.25rem 0 0.5rem 0;
    text-align: left;
  }

  .markdown-content p {
    margin: 1rem 0;
    text-align: left;
    line-height: 1.8;
  }

  .markdown-content ul, .markdown-content ol {
    margin: 1rem 0;
    padding-left: 1.75rem;
    text-align: left;
  }

  .markdown-content li {
    margin: 0.5rem 0;
    line-height: 1.7;
    text-align: left;
  }

  .markdown-content li p {
    margin: 0.25rem 0;
  }

  .markdown-content code {
    background: #f3f4f6;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.875em;
    color: #e11d48;
  }

  .markdown-content pre {
    background: #1f2937;
    padding: 1.25rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1.25rem 0;
    text-align: left;
  }

  .markdown-content pre code {
    background: transparent;
    padding: 0;
    color: #e5e7eb;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .markdown-content table {
    width: auto;
    min-width: 50%;
    max-width: 100%;
    border-collapse: collapse;
    margin: 1.25rem 0;
    font-size: 0.9375rem;
    text-align: left;
  }

  .markdown-content th, .markdown-content td {
    border: 1px solid #e5e7eb;
    padding: 0.75rem 1rem;
    text-align: left;
  }

  .markdown-content th {
    background: #f3f4f6;
    font-weight: 600;
    color: #374151;
  }

  .markdown-content tr:nth-child(even) {
    background: #f9fafb;
  }

  .markdown-content blockquote {
    border-left: 4px solid #6366f1;
    margin: 1.25rem 0;
    padding: 0.75rem 1.25rem;
    background: #f5f3ff;
    color: #5b21b6;
    font-style: italic;
    text-align: left;
  }

  .markdown-content blockquote p {
    margin: 0.5rem 0;
  }

  .markdown-content hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 2rem 0;
  }

  .markdown-content a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }

  .markdown-content a:hover {
    text-decoration: underline;
  }

  .markdown-content strong {
    font-weight: 600;
    color: #1f2937;
  }

  .markdown-content em {
    font-style: italic;
    color: #6b7280;
  }

  /* First heading special treatment */
  .markdown-content > h1:first-child {
    margin-top: 0;
  }

  /* Better spacing between sections */
  .markdown-content h2 + p,
  .markdown-content h3 + p {
    margin-top: 0.75rem;
  }
`;

export default ComprehensiveAnalysisTab;
