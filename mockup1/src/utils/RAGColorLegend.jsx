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

export function RAGColorLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs mb-3">
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.science.bg} ${COLORS.science.border} border`}></span>
        <span>Science skills</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.social.bg} ${COLORS.social.border} border`}></span>
        <span>Social emotional skills</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.literature.bg} ${COLORS.literature.border} border`}></span>
        <span>Literature skills</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded ${COLORS.language.bg} ${COLORS.language.border} border`}></span>
        <span>Language development skills</span>
      </div>
    </div>
  );
}
