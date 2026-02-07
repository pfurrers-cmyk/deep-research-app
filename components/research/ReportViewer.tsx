// components/research/ReportViewer.tsx — Visualizador do relatório com streaming
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Copy, Check, FileText, Clock, DollarSign, Database, Download } from 'lucide-react';
import { APP_CONFIG } from '@/config/defaults';
import { MarkdownRenderer } from '@/components/research/MarkdownRenderer';
import type { ResearchMetadata, ResearchResponse } from '@/lib/research/types';

interface ReportViewerProps {
  reportText: string;
  metadata: ResearchMetadata | null;
  response: ResearchResponse | null;
  isStreaming: boolean;
}

export function ReportViewer({
  reportText,
  metadata,
  response,
  isStreaming,
}: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const citationsRef = useRef<HTMLDivElement>(null);
  const { strings } = APP_CONFIG;

  const totalSources = response?.report?.citations?.length ?? 0;

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      const el = contentRef.current;
      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [reportText, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const frontmatter = `---\ntitle: "${metadata?.title ?? 'Research'}"\nquery: "${metadata?.query ?? ''}"\ndate: ${metadata?.createdAt ?? new Date().toISOString()}\nsources: ${metadata?.totalSourcesKept ?? 0}\n---\n\n`;
    const blob = new Blob([frontmatter + reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(metadata?.title ?? 'report').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCitationClick = useCallback((index: number) => {
    const el = citationsRef.current?.querySelector(`[data-citation="${index}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
    }
  }, []);

  if (!reportText && !isStreaming) return null;

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {metadata?.title ?? 'Relatório'}
          </h2>
          {isStreaming && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Gerando...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!reportText}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {strings.buttons.copy}
              </>
            )}
          </button>
          {!isStreaming && reportText && (
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              .md
            </button>
          )}
        </div>
      </div>

      {/* Report content */}
      <div
        ref={contentRef}
        className="max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        {!reportText && isStreaming ? (
          <div className="space-y-3 py-2" aria-busy="true" aria-label="Carregando relatório...">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded-md animate-shimmer"
                style={{ width: `${85 - (i % 4) * 15}%`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : (
          <>
            <MarkdownRenderer
              content={reportText}
              totalSources={totalSources}
              onCitationClick={handleCitationClick}
            />
            {isStreaming && (
              <span className="inline-block h-5 w-1 animate-pulse bg-primary" />
            )}
          </>
        )}
      </div>

      {/* Metadata bar */}
      {metadata && !isStreaming && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {metadata.durationMs < 60000
              ? `${(metadata.durationMs / 1000).toFixed(1)}s`
              : `${(metadata.durationMs / 60000).toFixed(1)}min`}
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            {metadata.totalSourcesKept} {strings.labels.sources}
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            {response?.cost?.totalCostUSD !== undefined
              ? `$${response.cost.totalCostUSD.toFixed(4)}`
              : 'N/A'}
          </div>
          <div className="text-xs">
            Modelos: {metadata.modelsUsed.join(', ')}
          </div>
        </div>
      )}

      {/* Citations */}
      {response?.report?.citations && response.report.citations.length > 0 && !isStreaming && (
        <div ref={citationsRef} className="space-y-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Fontes ({response.report.citations.length})
          </h3>
          <ul className="space-y-2">
            {response.report.citations.map((citation) => (
              <li
                key={citation.index}
                data-citation={citation.index}
                className="flex items-start gap-2 rounded-md p-1.5 text-sm transition-all"
              >
                <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                  {citation.index}
                </span>
                <div className="min-w-0">
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {citation.title || citation.domain}
                  </a>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {citation.domain}
                  </span>
                  {citation.snippet && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {citation.snippet}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
