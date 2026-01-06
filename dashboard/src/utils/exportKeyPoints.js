import { formatTimestamp } from './formatters';

/**
 * Export key points in different formats
 * @param {Array} keyPoints - Array of key point objects
 * @param {string} format - Export format ('markdown', 'json', 'text')
 * @returns {string} - Formatted export string
 */
export function exportKeyPoints(keyPoints, format = 'markdown') {
  if (!keyPoints || keyPoints.length === 0) {
    return '';
  }

  switch (format) {
    case 'markdown':
      return exportAsMarkdown(keyPoints);
    
    case 'json':
      return exportAsJSON(keyPoints);
    
    case 'text':
      return exportAsText(keyPoints);
    
    default:
      return exportAsMarkdown(keyPoints);
  }
}

/**
 * Export key points as Markdown
 * @param {Array} keyPoints - Array of key point objects
 * @returns {string} - Markdown formatted string
 */
function exportAsMarkdown(keyPoints) {
  const lines = ['# Key Points\n'];

  // Group by category
  const categories = {
    insight: [],
    action: [],
    definition: [],
    example: []
  };

  keyPoints.forEach(kp => {
    const category = kp.category || 'insight';
    if (categories[category]) {
      categories[category].push(kp);
    } else {
      categories.insight.push(kp);
    }
  });

  // Export by category
  const categoryLabels = {
    insight: 'Insights',
    action: 'Action Items',
    definition: 'Definitions',
    example: 'Examples'
  };

  Object.keys(categories).forEach(cat => {
    if (categories[cat].length > 0) {
      lines.push(`\n## ${categoryLabels[cat]}\n`);
      categories[cat].forEach(kp => {
        const timestamp = formatTimestamp(parseFloat(kp.timestamp_seconds));
        lines.push(`- **[${timestamp}]** ${kp.point_text}`);
        if (kp.context) {
          lines.push(`  > ${kp.context}`);
        }
      });
    }
  });

  return lines.join('\n');
}

/**
 * Export key points as JSON
 * @param {Array} keyPoints - Array of key point objects
 * @returns {string} - JSON formatted string
 */
function exportAsJSON(keyPoints) {
  const exportData = keyPoints.map(kp => ({
    timestamp: parseFloat(kp.timestamp_seconds),
    timestamp_formatted: formatTimestamp(parseFloat(kp.timestamp_seconds)),
    point: kp.point_text,
    context: kp.context,
    category: kp.category,
    section: kp.section_title
  }));

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export key points as plain text
 * @param {Array} keyPoints - Array of key point objects
 * @returns {string} - Plain text formatted string
 */
function exportAsText(keyPoints) {
  const lines = ['KEY POINTS\n' + '='.repeat(50) + '\n'];

  keyPoints.forEach((kp, index) => {
    const timestamp = formatTimestamp(parseFloat(kp.timestamp_seconds));
    lines.push(`${index + 1}. [${timestamp}] ${kp.point_text}`);
    if (kp.context) {
      lines.push(`   Context: ${kp.context}`);
    }
    if (kp.category) {
      lines.push(`   Category: ${kp.category}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

export default exportKeyPoints;
