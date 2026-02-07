'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  totalSources?: number;
  onCitationClick?: (index: number) => void;
}

export function MarkdownRenderer({
  content,
  totalSources = 0,
  onCitationClick,
}: MarkdownRendererProps) {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-8 text-2xl font-bold first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 border-b border-border pb-2 text-xl font-bold first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 text-lg font-semibold">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-2 mt-4 text-base font-semibold">{children}</h4>
    ),
    p: ({ children }) => (
      <p className="mb-3 leading-7">{processCitations(children)}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="leading-7">{processCitations(children)}</li>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({ className, children }) => {
      const isBlock = className?.includes('language-');
      if (isBlock) {
        return (
          <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4">
            <code className="text-sm">{children}</code>
          </pre>
        );
      }
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
          {children}
        </code>
      );
    },
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-border bg-muted/50">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left font-semibold">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2">{processCitations(children)}</td>
    ),
    hr: () => <hr className="my-6 border-border" />,
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
  };

  function processCitations(children: React.ReactNode): React.ReactNode {
    if (!totalSources || !onCitationClick) return children;

    if (typeof children === 'string') {
      return replaceCitationsInText(children);
    }

    if (Array.isArray(children)) {
      return children.map((child, i) => {
        if (typeof child === 'string') {
          return <span key={i}>{replaceCitationsInText(child)}</span>;
        }
        return child;
      });
    }

    return children;
  }

  function replaceCitationsInText(text: string): React.ReactNode {
    const parts = text.split(/(\[\d+\])/g);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= totalSources) {
          return (
            <button
              key={i}
              onClick={() => onCitationClick?.(num)}
              className="mx-0.5 inline-flex cursor-pointer items-baseline text-xs font-bold text-primary hover:underline"
              title={`Ver fonte ${num}`}
            >
              [{num}]
            </button>
          );
        }
      }
      return part;
    });
  }

  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
