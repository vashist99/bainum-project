import React from 'react';

const COLORS = {
  science: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dark: { bg: 'dark:bg-blue-900/30', text: 'dark:text-blue-300', border: 'dark:border-blue-700' }
  },
  social: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dark: { bg: 'dark:bg-green-900/30', text: 'dark:text-green-300', border: 'dark:border-green-700' }
  },
  literature: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    dark: { bg: 'dark:bg-purple-900/30', text: 'dark:text-purple-300', border: 'dark:border-purple-700' }
  },
  language: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dark: { bg: 'dark:bg-orange-900/30', text: 'dark:text-orange-300', border: 'dark:border-orange-700' }
  }
};

const CATEGORY_NAMES = {
  science: 'Science skills',
  social: 'Social emotional skills',
  literature: 'Literature skills',
  language: 'Language development skills'
};

// Keyword lists for fallback highlighting (matches backend when RAG is disabled)
const KEYWORDS = {
  science: ['experiment', 'hypothesis', 'observe', 'predict', 'measure', 'test', 'data', 'result', 'science', 'scientist', 'discover', 'investigate', 'analyze', 'research', 'study', 'evidence', 'theory', 'fact', 'nature', 'weather', 'water', 'plant', 'animal', 'grow', 'change', 'why', 'how', 'because', 'reason', 'cause', 'effect'],
  social: ['friend', 'share', 'help', 'together', 'feelings', 'happy', 'sad', 'angry', 'excited', 'play', 'game', 'fun', 'laugh', 'smile', 'love', 'care', 'kind', 'family', 'mom', 'dad', 'thank', 'please', 'hello', 'goodbye', 'listen', 'talk', 'say', 'tell', 'ask', 'answer'],
  literature: ['story', 'character', 'beginning', 'ending', 'book', 'read', 'page', 'picture', 'create', 'make', 'once upon a time', 'prince', 'princess', 'magic', 'adventure', 'imagine', 'pretend'],
  language: ['word', 'sentence', 'speak', 'listen', 'talk', 'say', 'tell', 'language', 'voice', 'describe', 'explain', 'mean', 'understand', 'learn', 'teach', 'question', 'ask', 'answer', 'letter', 'read', 'write', 'spell', 'vocabulary']
};

/**
 * Extract keyword-based segments for fallback when RAG segments are missing (e.g. old assessments, production without RAG)
 * @param {string} transcript - The transcript text
 * @returns {Array} Array of segment objects { text, category, startIndex, endIndex }
 */
export function extractKeywordSegments(transcript) {
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return [];
  }
  const segments = [];
  Object.keys(KEYWORDS).forEach((category) => {
    KEYWORDS[category].forEach((keyword) => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = keyword.includes(' ')
        ? new RegExp(`\\b${escaped.replace(/\s+/g, '\\s+')}\\b`, 'gi')
        : new RegExp(`\\b${escaped}\\b`, 'gi');
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        segments.push({
          text: match[0],
          category,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });
  });
  return segments;
}

/**
 * Get segments for highlighting - uses RAG segments if available, otherwise keyword-based fallback
 * @param {string} transcript - The transcript text
 * @param {Array} ragSegments - RAG segments from backend (may be null/empty)
 * @returns {Array} Segments to use for highlighting
 */
export function getSegmentsForHighlighting(transcript, ragSegments) {
  if (ragSegments && Array.isArray(ragSegments) && ragSegments.length > 0) {
    return ragSegments;
  }
  return extractKeywordSegments(transcript || '');
}

/**
 * Highlight transcript segments based on RAG classification
 * @param {string} transcript - The transcript text
 * @param {Array} segments - Array of segment objects from RAG classifier
 * @returns {Array} Array of React elements with highlighted segments
 */
export function highlightRAGSegments(transcript, segments) {
  if (!transcript || !segments || segments.length === 0) {
    return [transcript];
  }

  const sortedSegments = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const nonOverlapping = [];

  for (let i = 0; i < sortedSegments.length; i++) {
    const current = sortedSegments[i];
    let hasOverlap = false;
    for (const existing of nonOverlapping) {
      if (!(current.endIndex <= existing.startIndex || current.startIndex >= existing.endIndex)) {
        hasOverlap = true;
        break;
      }
    }
    if (!hasOverlap) nonOverlapping.push(current);
  }

  nonOverlapping.sort((a, b) => a.startIndex - b.startIndex);
  const result = [];
  let lastIndex = 0;

  nonOverlapping.forEach((segment, index) => {
    if (segment.startIndex > lastIndex) {
      const beforeText = transcript.substring(lastIndex, segment.startIndex);
      if (beforeText) result.push(beforeText);
    }

    const category = segment.category;
    const colorClass = COLORS[category] || COLORS.science;
    const categoryName = CATEGORY_NAMES[category] || category;

    result.push(
      React.createElement(
        'span',
        {
          key: `rag-segment-${index}`,
          className: `${colorClass.bg} ${colorClass.text} ${colorClass.border} px-1 rounded border font-medium ${colorClass.dark.bg} ${colorClass.dark.text} ${colorClass.dark.border}`,
          title: categoryName
        },
        segment.text
      )
    );

    lastIndex = segment.endIndex;
  });

  if (lastIndex < transcript.length) {
    const remainingText = transcript.substring(lastIndex);
    if (remainingText) result.push(remainingText);
  }

  return result.length > 0 ? result : [transcript];
}
