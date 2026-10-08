'use client';

import React from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

/**
 * Safely parses inline markdown formatting into React elements:
 * - **bold**
 * - *italic*
 * - `inline code`
 * - [links](url)
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match: **bold**, *italic*, `code`, [link](url)
  const tokenRegex = /(\*\*[\s\S]+?\*\*|\*[^\s*][^*]*?\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="md-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="md-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return (
        <em key={index} className="md-italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Links: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="md-link"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

/**
 * Lightweight, zero-dependency Markdown renderer component for Next.js.
 * Handles headings, bold, italics, lists, code blocks, dividers, and paragraphs cleanly.
 */
export function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  let currentListItems: string[] = [];
  let currentOrderedItems: string[] = [];

  const flushUnorderedList = () => {
    if (currentListItems.length > 0) {
      const items = [...currentListItems];
      currentListItems = [];
      elements.push(
        <ul key={`ul-${elements.length}`} className="md-ul">
          {items.map((item, i) => (
            <li key={i} className="md-li">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    }
  };

  const flushOrderedList = () => {
    if (currentOrderedItems.length > 0) {
      const items = [...currentOrderedItems];
      currentOrderedItems = [];
      elements.push(
        <ol key={`ol-${elements.length}`} className="md-ol">
          {items.map((item, i) => (
            <li key={i} className="md-li">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    }
  };

  const flushLists = () => {
    flushUnorderedList();
    flushOrderedList();
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code blocks: ```ts
    if (trimmed.startsWith('```')) {
      flushLists();
      if (inCodeBlock) {
        // Closing code block
        elements.push(
          <div key={`code-${elements.length}`} className="md-code-block">
            {codeBlockLang && <div className="md-code-lang">{codeBlockLang}</div>}
            <pre>
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Opening code block
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Horizontal Divider: --- or *** or ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushLists();
      elements.push(<hr key={`hr-${elements.length}`} className="md-divider" />);
      continue;
    }

    // Heading 4: ####
    if (trimmed.startsWith('#### ')) {
      flushLists();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="md-h4">
          {renderInline(trimmed.replace(/^####\s+/, ''))}
        </h4>
      );
      continue;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      flushLists();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="md-h3">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      continue;
    }

    // Heading 2: ##
    if (trimmed.startsWith('## ')) {
      flushLists();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="md-h2">
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      continue;
    }

    // Heading 1: #
    if (trimmed.startsWith('# ')) {
      flushLists();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="md-h1">
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      continue;
    }

    // Unordered List: * or -
    if (/^[\*\-]\s+/.test(trimmed)) {
      flushOrderedList();
      currentListItems.push(trimmed.replace(/^[\*\-]\s+/, ''));
      continue;
    }

    // Ordered List: 1. 2. etc.
    if (/^\d+\.\s+/.test(trimmed)) {
      flushUnorderedList();
      currentOrderedItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Empty line / paragraph separator
    if (!trimmed) {
      flushLists();
      continue;
    }

    // Standard paragraph line
    flushLists();
    elements.push(
      <p key={`p-${elements.length}`} className="md-p">
        {renderInline(trimmed)}
      </p>
    );
  }

  // Flush any dangling lists or unclosed code blocks at end of content
  flushLists();
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <div key={`code-${elements.length}`} className="md-code-block">
        <pre>
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      </div>
    );
  }

  return <div className={`markdown-view ${className}`}>{elements}</div>;
}
