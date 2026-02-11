import React from 'react';

// Color scheme for RAG categories
const COLORS = {
  science: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dark: {
      bg: 'dark:bg-blue-900/30',
      text: 'dark:text-blue-300',
      border: 'dark:border-blue-700'
    }
  },
  social: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dark: {
      bg: 'dark:bg-green-900/30',
      text: 'dark:text-green-300',
      border: 'dark:border-green-700'
    }
  },
  literature: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    dark: {
      bg: 'dark:bg-purple-900/30',
      text: 'dark:text-purple-300',
      border: 'dark:border-purple-700'
    }
  },
  language: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dark: {
      bg: 'dark:bg-orange-900/30',
      text: 'dark:text-orange-300',
      border: 'dark:border-orange-700'
    }
  }
};

const CATEGORY_NAMES = {
  science: 'Science Talk',
  social: 'Social Talk',
  literature: 'Literature Talk',
  language: 'Language Development'
};

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

  // Sort segments by start index
  const sortedSegments = [...segments].sort((a, b) => a.startIndex - b.startIndex);

  // Remove overlapping segments (keep the first one)
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

    if (!hasOverlap) {
      nonOverlapping.push(current);
    }
  }

  // Sort again after removing overlaps
  nonOverlapping.sort((a, b) => a.startIndex - b.startIndex);

  // Build array of text segments and highlighted spans
  const result = [];
  let lastIndex = 0;

  nonOverlapping.forEach((segment, index) => {
    // Add text before segment
    if (segment.startIndex > lastIndex) {
      const beforeText = transcript.substring(lastIndex, segment.startIndex);
      if (beforeText) {
        result.push(beforeText);
      }
    }

    // Add highlighted segment
    const category = segment.category;
    const colorClass = COLORS[category] || COLORS.science;
    const categoryName = CATEGORY_NAMES[category] || category;

    result.push(
      <span
        key={`rag-segment-${index}`}
        className={`${colorClass.bg} ${colorClass.text} ${colorClass.border} px-1 rounded border font-medium ${colorClass.dark.bg} ${colorClass.dark.text} ${colorClass.dark.border}`}
        title={categoryName}
      >
        {segment.text}
      </span>
    );

    lastIndex = segment.endIndex;
  });

  // Add remaining text
  if (lastIndex < transcript.length) {
    const remainingText = transcript.substring(lastIndex);
    if (remainingText) {
      result.push(remainingText);
    }
  }

  return result.length > 0 ? result : [transcript];
}

/**
 * Get color legend component
 */
export function RAGColorLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs mb-3">
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.science.bg} ${COLORS.science.border} border`}></span>
        <span>Science Talk</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.social.bg} ${COLORS.social.border} border`}></span>
        <span>Social Talk</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.literature.bg} ${COLORS.literature.border} border`}></span>
        <span>Literature Talk</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.language.bg} ${COLORS.language.border} border`}></span>
        <span>Language Development</span>
      </div>
    </div>
  );
}
