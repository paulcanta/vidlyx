/**
 * VideoTypeDetector
 * Detects video type based on title, description, transcript, and tags
 */

// Video type definitions with detection keywords and icons
export const VIDEO_TYPES = {
  educational: {
    id: 'educational',
    label: 'Educational',
    icon: 'GraduationCap',
    color: '#7c3aed',
    bgColor: '#f3e8ff',
    keywords: ['tutorial', 'learn', 'course', 'lesson', 'explain', 'understand', 'concept', 'teach', 'education', 'training', 'workshop', 'lecture'],
    categories: ['Concept', 'Definition', 'Example', 'Tip', 'Warning']
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'GameController',
    color: '#ea580c',
    bgColor: '#fff7ed',
    keywords: ['funny', 'comedy', 'gaming', 'game', 'reaction', 'prank', 'entertainment', 'fun', 'laugh', 'meme', 'stream', 'play'],
    categories: ['Highlight', 'Funny', 'Memorable', 'Reaction']
  },
  tutorial: {
    id: 'tutorial',
    label: 'Tutorial',
    icon: 'Wrench',
    color: '#0891b2',
    bgColor: '#ecfeff',
    keywords: ['how to', 'howto', 'diy', 'step by step', 'guide', 'walkthrough', 'setup', 'install', 'configure', 'build', 'make', 'create'],
    categories: ['Step', 'Tip', 'Warning', 'Alternative', 'Shortcut']
  },
  review: {
    id: 'review',
    label: 'Review',
    icon: 'Star',
    color: '#ca8a04',
    bgColor: '#fefce8',
    keywords: ['review', 'unboxing', 'comparison', 'vs', 'best', 'worst', 'pros', 'cons', 'rating', 'test', 'benchmark', 'hands on'],
    categories: ['Pro', 'Con', 'Comparison', 'Verdict', 'Alternative']
  },
  vlog: {
    id: 'vlog',
    label: 'Vlog',
    icon: 'User',
    color: '#db2777',
    bgColor: '#fdf2f8',
    keywords: ['vlog', 'day in', 'daily', 'life', 'routine', 'travel', 'adventure', 'experience', 'story', 'journey', 'visit'],
    categories: ['Highlight', 'Location', 'Story', 'Moment']
  },
  podcast: {
    id: 'podcast',
    label: 'Podcast',
    icon: 'Microphone',
    color: '#059669',
    bgColor: '#ecfdf5',
    keywords: ['podcast', 'interview', 'discussion', 'talk', 'conversation', 'episode', 'guest', 'host', 'q&a', 'debate'],
    categories: ['Insight', 'Opinion', 'Fact', 'Disagreement', 'Question']
  },
  news: {
    id: 'news',
    label: 'News',
    icon: 'Newspaper',
    color: '#4f46e5',
    bgColor: '#eef2ff',
    keywords: ['news', 'breaking', 'update', 'report', 'coverage', 'analysis', 'headline', 'current', 'event', 'announcement'],
    categories: ['Fact', 'Timeline', 'Source', 'Implication']
  },
  techDemo: {
    id: 'techDemo',
    label: 'Tech Demo',
    icon: 'Code',
    color: '#2563eb',
    bgColor: '#dbeafe',
    keywords: ['demo', 'code', 'programming', 'software', 'app', 'developer', 'api', 'feature', 'release', 'launch', 'product'],
    categories: ['Feature', 'UseCase', 'Technical', 'Demo']
  },
  music: {
    id: 'music',
    label: 'Music',
    icon: 'MusicNote',
    color: '#dc2626',
    bgColor: '#fef2f2',
    keywords: ['music', 'song', 'cover', 'performance', 'live', 'concert', 'album', 'artist', 'band', 'lyrics', 'official'],
    categories: ['Verse', 'Chorus', 'Moment', 'Lyrics']
  },
  documentary: {
    id: 'documentary',
    label: 'Documentary',
    icon: 'FilmStrip',
    color: '#374151',
    bgColor: '#f3f4f6',
    keywords: ['documentary', 'history', 'investigation', 'story', 'true', 'real', 'expose', 'explore', 'discover', 'deep dive'],
    categories: ['Evidence', 'Thesis', 'Timeline', 'Conclusion']
  }
};

/**
 * Detect video type from metadata
 * @param {Object} params - Detection parameters
 * @param {string} params.title - Video title
 * @param {string} params.description - Video description
 * @param {Array} params.tags - Video tags
 * @param {string} params.transcript - Full transcript text
 * @returns {Object} Detection result with type and confidence
 */
export function detectVideoType({ title = '', description = '', tags = [], transcript = '' }) {
  const scores = {};
  const normalizedTitle = (title || '').toLowerCase();
  const normalizedDesc = (description || '').toLowerCase();
  const normalizedTags = (tags || []).map(t => (t || '').toLowerCase()).join(' ');
  const normalizedTranscript = (transcript || '').toLowerCase().slice(0, 5000); // First 5000 chars

  // Score each type based on keyword matches
  Object.entries(VIDEO_TYPES).forEach(([typeId, typeConfig]) => {
    let score = 0;

    typeConfig.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();

      // Title matches (highest weight)
      if (normalizedTitle.includes(keywordLower)) {
        score += 10;
      }

      // Tag matches (high weight)
      if (normalizedTags.includes(keywordLower)) {
        score += 5;
      }

      // Description matches (medium weight)
      if (normalizedDesc.includes(keywordLower)) {
        score += 3;
      }

      // Transcript matches (lower weight, but cumulative)
      const transcriptMatches = (normalizedTranscript.match(new RegExp(keywordLower, 'g')) || []).length;
      score += Math.min(transcriptMatches * 0.5, 5); // Cap at 5 points per keyword
    });

    scores[typeId] = score;
  });

  // Find the type with highest score
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const topScore = sortedTypes[0][1];
  const topType = sortedTypes[0][0];

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(topScore / Math.max(totalScore * 0.5, 20), 1) : 0;

  // Default to educational if no clear match
  if (topScore < 5) {
    return {
      type: 'educational',
      typeConfig: VIDEO_TYPES.educational,
      confidence: 0.3,
      scores
    };
  }

  return {
    type: topType,
    typeConfig: VIDEO_TYPES[topType],
    confidence: Math.round(confidence * 100) / 100,
    scores
  };
}

/**
 * Get categories for a video type
 */
export function getCategoriesForType(typeId) {
  return VIDEO_TYPES[typeId]?.categories || VIDEO_TYPES.educational.categories;
}

/**
 * Get type config by ID
 */
export function getTypeConfig(typeId) {
  return VIDEO_TYPES[typeId] || VIDEO_TYPES.educational;
}

export default {
  VIDEO_TYPES,
  detectVideoType,
  getCategoriesForType,
  getTypeConfig
};
