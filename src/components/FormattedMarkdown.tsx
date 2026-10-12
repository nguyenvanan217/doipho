import React from 'react';

export default function FormattedMarkdown({ content, className = '' }: { content: string; className?: string }) {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');

  // Helper to parse inline bold and highlight
  const renderInline = (text: string) => {
    // Regex matching **bold text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-black dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2 my-2 pl-5 list-disc marker:text-indigo-600 dark:marker:text-indigo-400">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Horizontal divider
    if (line === '---' || line === '***' || line === '___') {
      flushList();
      elements.push(
        <hr key={`hr-${index}`} className="my-4 border-gray-200 dark:border-zinc-800" />
      );
      return;
    }

    // Heading 1 (# Title)
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl font-extrabold text-black dark:text-white mt-4 mb-2 pb-2 border-b border-gray-200 dark:border-zinc-800">
          {renderInline(line.slice(2))}
        </h1>
      );
      return;
    }

    // Heading 2 (## Title)
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${index}`} className="text-base font-bold text-black dark:text-white mt-5 mb-2.5 pb-1 flex items-center gap-2">
          {renderInline(line.slice(3))}
        </h2>
      );
      return;
    }

    // Heading 3 (### Title)
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${index}`} className="text-sm font-bold text-black dark:text-white mt-3.5 mb-1.5">
          {renderInline(line.slice(4))}
        </h3>
      );
      return;
    }

    // Bullet point (* or -)
    const bulletMatch = rawLine.match(/^(\s*)([\*\-])\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const itemContent = bulletMatch[3];
      listItems.push(
        <li 
          key={`li-${index}`} 
          className={`text-sm text-gray-800 dark:text-gray-200 leading-relaxed ${indent > 2 ? 'ml-4 list-circle' : ''}`}
        >
          {renderInline(itemContent)}
        </li>
      );
      return;
    }

    // Numbered list item (1. Item)
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      flushList();
      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-2.5 text-sm text-gray-800 dark:text-gray-200 my-1.5 leading-relaxed">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 min-w-[20px]">
            {numberedMatch[1]}.
          </span>
          <div className="flex-1">{renderInline(numberedMatch[2])}</div>
        </div>
      );
      return;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={`p-${index}`} className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed my-2">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
