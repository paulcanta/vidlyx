/**
 * Local Summary Service
 * Generates summaries without external APIs using text analysis
 * Used as fallback when API keys are not configured
 */

/**
 * Extract key sentences from text based on importance
 * @param {string} text - Full text to analyze
 * @param {number} count - Number of sentences to extract
 * @returns {Array<string>} - Top sentences
 */
function extractKeySentences(text, count = 5) {
  if (!text) return [];

  // Split into sentences
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300);

  if (sentences.length === 0) return [];

  // Score sentences by various factors
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;

    // Position score (early sentences often important)
    if (index < 5) score += 3;
    else if (index < 10) score += 2;

    // Length score (medium length preferred)
    if (sentence.length > 50 && sentence.length < 200) score += 2;

    // Contains numbers (often important facts)
    if (/\d+/.test(sentence)) score += 1;

    // Contains key phrases
    const keyPhrases = ['important', 'key', 'main', 'first', 'second', 'third',
                        'remember', 'note', 'basically', 'essentially', 'means',
                        'because', 'therefore', 'however', 'actually', 'need to'];
    keyPhrases.forEach(phrase => {
      if (sentence.toLowerCase().includes(phrase)) score += 1;
    });

    // Penalize filler sentences
    const fillers = ['um', 'uh', 'like', 'you know', 'i mean', 'so yeah'];
    fillers.forEach(filler => {
      if (sentence.toLowerCase().includes(filler)) score -= 1;
    });

    return { sentence, score, index };
  });

  // Sort by score and take top sentences
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.index - b.index) // Restore original order
    .map(s => s.sentence);
}

/**
 * Extract main topics from text
 * @param {string} text - Full text to analyze
 * @returns {Array<string>} - Main topics
 */
function extractTopics(text) {
  if (!text) return [];

  // Common words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it',
    'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your', 'i',
    'me', 'my', 'he', 'she', 'him', 'her', 'his', 'if', 'then', 'else',
    'when', 'where', 'what', 'which', 'who', 'how', 'why', 'so', 'just',
    'also', 'only', 'very', 'really', 'like', 'about', 'more', 'some',
    'any', 'all', 'most', 'other', 'into', 'over', 'such', 'no', 'not',
    'than', 'too', 'now', 'here', 'there', 'out', 'up', 'down', 'off',
    'going', 'gonna', 'want', 'know', 'think', 'see', 'get', 'got', 'make',
    'right', 'thing', 'things', 'way', 'something', 'okay', 'well', 'yeah',
    'actually', 'basically', 'because', 'um', 'uh', 'oh'
  ]);

  // Extract words and count frequency
  const words = text.toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Get top words as topics
  const topics = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  return topics;
}

/**
 * Detect video category from content
 * @param {string} title - Video title
 * @param {string} transcript - Full transcript
 * @returns {string} - Category
 */
function detectCategory(title, transcript) {
  const text = `${title} ${transcript}`.toLowerCase();

  const categories = {
    'Tutorial': ['tutorial', 'how to', 'step by step', 'learn', 'guide', 'beginner'],
    'Review': ['review', 'unboxing', 'first look', 'hands on', 'opinion', 'rating'],
    'News/Commentary': ['news', 'breaking', 'update', 'announcement', 'react', 'response'],
    'Educational': ['explain', 'understand', 'science', 'history', 'education', 'lecture'],
    'Entertainment': ['funny', 'comedy', 'prank', 'challenge', 'vlog', 'story'],
    'Gaming': ['game', 'gameplay', 'playthrough', 'gaming', 'stream', 'let\'s play'],
    'Tech': ['tech', 'software', 'programming', 'code', 'developer', 'app', 'api'],
    'Music': ['music', 'song', 'album', 'lyrics', 'cover', 'remix'],
    'Interview': ['interview', 'conversation', 'podcast', 'talk', 'guest', 'discussion']
  };

  let bestCategory = 'General';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categories)) {
    let score = 0;
    keywords.forEach(kw => {
      if (text.includes(kw)) score++;
    });
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/**
 * Estimate difficulty level from content
 * @param {string} transcript - Full transcript
 * @returns {string} - Difficulty level
 */
function estimateDifficulty(transcript) {
  if (!transcript) return 'General Audience';

  const text = transcript.toLowerCase();

  // Check for technical indicators
  const technicalTerms = ['api', 'algorithm', 'implementation', 'architecture',
                          'framework', 'configuration', 'deployment', 'database',
                          'optimization', 'integration', 'methodology', 'paradigm'];

  let technicalScore = 0;
  technicalTerms.forEach(term => {
    if (text.includes(term)) technicalScore++;
  });

  // Check for beginner indicators
  const beginnerPhrases = ['for beginners', 'introduction', 'basics', 'getting started',
                           'first time', 'simple', 'easy', 'no experience'];

  let beginnerScore = 0;
  beginnerPhrases.forEach(phrase => {
    if (text.includes(phrase)) beginnerScore++;
  });

  if (beginnerScore >= 2) return 'Beginner';
  if (technicalScore >= 4) return 'Advanced';
  if (technicalScore >= 2) return 'Intermediate';
  return 'General Audience';
}

/**
 * Generate a local summary without external APIs
 * @param {object} video - Video object with title, channel_name, duration
 * @param {string} transcript - Full transcript text
 * @param {Array} sections - Section objects
 * @returns {object} - Generated summary data
 */
function generateLocalSummary(video, transcript, sections = []) {
  const title = video.title || 'Untitled Video';
  const channelName = video.channel_name || 'Unknown Channel';
  const duration = video.duration || 0;

  // Extract key information
  const keySentences = extractKeySentences(transcript, 7);
  const topics = extractTopics(transcript);
  const category = detectCategory(title, transcript);
  const difficulty = estimateDifficulty(transcript);

  // Build executive summary from key sentences
  const executiveSummary = keySentences.length > 0
    ? keySentences.slice(0, 3).join('. ') + '.'
    : `This video from ${channelName} covers ${topics.slice(0, 3).join(', ') || 'various topics'}.`;

  // Generate key takeaways
  const keyTakeaways = keySentences.length > 0
    ? keySentences.map(s => s.length > 100 ? s.substring(0, 100) + '...' : s)
    : [`Video: ${title}`, `Channel: ${channelName}`, `Duration: ${Math.floor(duration / 60)} minutes`];

  // Generate target audience description
  const targetAudience = difficulty === 'Beginner'
    ? 'Newcomers and those new to the topic'
    : difficulty === 'Advanced'
    ? 'Experienced practitioners and professionals'
    : 'Anyone interested in the subject matter';

  return {
    executive_summary: executiveSummary,
    key_takeaways: keyTakeaways,
    main_topics: topics.slice(0, 5),
    target_audience: targetAudience,
    difficulty_level: difficulty.toLowerCase().replace(' ', '_'),
    estimated_value: `Learn about ${topics.slice(0, 3).join(', ') || 'the topic'} from ${channelName}`,
    recommended_for: [`${category} enthusiasts`, 'Self-learners', 'Content researchers'],
    prerequisites: [],
    category: category,
    generated_locally: true
  };
}

/**
 * Generate comprehensive analysis markdown without external APIs
 * @param {object} video - Video object
 * @param {string} transcript - Full transcript
 * @param {Array} sections - Section objects
 * @returns {string} - Markdown analysis
 */
function generateLocalAnalysis(video, transcript, sections = []) {
  const title = video.title || 'Untitled Video';
  const channelName = video.channel_name || 'Unknown Channel';
  const duration = video.duration || 0;
  const durationFormatted = `${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`;

  const keySentences = extractKeySentences(transcript, 10);
  const topics = extractTopics(transcript);
  const category = detectCategory(title, transcript);
  const difficulty = estimateDifficulty(transcript);

  // Build sections summary
  let sectionsContent = '';
  if (sections.length > 0) {
    sectionsContent = sections.map((s, i) => {
      const start = Math.floor(s.start_time / 60) + ':' + String(Math.floor(s.start_time % 60)).padStart(2, '0');
      const end = Math.floor(s.end_time / 60) + ':' + String(Math.floor(s.end_time % 60)).padStart(2, '0');
      return `### Section ${i + 1}: ${s.title || 'Untitled'}\n\n**Time:** ${start} - ${end}\n\n${s.summary || 'Content from this section of the video.'}`;
    }).join('\n\n');
  } else {
    // Create pseudo-sections from key sentences
    sectionsContent = keySentences.slice(0, 5).map((sentence, i) => {
      return `### Key Point ${i + 1}\n\n${sentence}.`;
    }).join('\n\n');
  }

  const markdown = `# Video Analysis: ${title}

## At a Glance

| Detail | Information |
|--------|-------------|
| **Category** | ${category} |
| **Channel** | ${channelName} |
| **Duration** | ${durationFormatted} |
| **Difficulty** | ${difficulty} |
| **Best For** | ${category} enthusiasts |

---

## Overview

This video from **${channelName}** covers topics related to ${topics.slice(0, 3).join(', ') || 'the subject matter'}. ${keySentences[0] ? keySentences[0] + '.' : ''} The content is suitable for ${difficulty.toLowerCase()} level viewers.

${keySentences[1] ? keySentences[1] + '. ' : ''}${keySentences[2] ? keySentences[2] + '.' : ''}

---

## Main Content

${sectionsContent || 'Content analysis based on the video transcript.'}

---

## Key Takeaways

${keySentences.slice(0, 7).map((s, i) => `${i + 1}. **Key Point ${i + 1}** - ${s}`).join('\n\n')}

---

## Topics Covered

${topics.slice(0, 8).map(t => `- ${t}`).join('\n')}

---

## Who Should Watch This

This video is recommended for ${difficulty.toLowerCase()} level viewers interested in ${topics.slice(0, 2).join(' and ') || 'the topic'}. ${category === 'Tutorial' ? 'Those looking to learn practical skills will find this valuable.' : category === 'Educational' ? 'Learners seeking to understand the fundamentals will benefit.' : 'Anyone curious about the subject will find this informative.'}

---

## Final Verdict

"${title}" from ${channelName} provides ${difficulty.toLowerCase()} level content about ${topics[0] || 'the topic'}. Worth watching if you're interested in ${category.toLowerCase()} content.

---

*Analysis generated locally (without AI API)*
*Video: https://www.youtube.com/watch?v=${video.youtube_id}*
`;

  return markdown;
}

/**
 * Generate section summary locally
 * @param {object} section - Section object
 * @param {string} sectionTranscript - Transcript for this section
 * @returns {object} - Summary and key points
 */
function generateLocalSectionSummary(section, sectionTranscript = '') {
  const keySentences = extractKeySentences(sectionTranscript, 4);
  const topics = extractTopics(sectionTranscript);

  return {
    summary: keySentences[0]
      ? keySentences.slice(0, 2).join('. ') + '.'
      : `Section covering ${section.title || 'video content'}.`,
    key_points: keySentences.length > 0
      ? keySentences
      : [`Section: ${section.title || 'Untitled'}`, `Topics: ${topics.slice(0, 3).join(', ') || 'Various'}`]
  };
}

module.exports = {
  extractKeySentences,
  extractTopics,
  detectCategory,
  estimateDifficulty,
  generateLocalSummary,
  generateLocalAnalysis,
  generateLocalSectionSummary
};
