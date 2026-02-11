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
