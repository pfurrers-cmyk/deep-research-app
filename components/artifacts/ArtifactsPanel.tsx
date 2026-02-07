// components/artifacts/ArtifactsPanel.tsx — Artifacts side panel (inspired by Claude Artifacts)
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Code2, Eye, Download, ChevronLeft, ChevronRight, Copy, Check, FileText, Trash2, GripVertical } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

const LANG_LABELS: Record<string, string> = {
  markdown: 'Markdown',
  html: 'HTML',
  json: 'JSON',
  text: 'Texto',
  react: 'React',
  code: 'Código',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  css: 'CSS',
};

const MIN_WIDTH = 320;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 560;

export function ArtifactsPanel() {
  const { state, dispatch } = useAppStore();
  const { artifacts, activeArtifactId, artifactsPanelOpen } = state;
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');
  const [copied, setCopied] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId);
  const currentVersion = activeArtifact?.versions[activeArtifact.currentVersionIndex];

  const canPreview = activeArtifact?.type === 'html' || activeArtifact?.type === 'react' || activeArtifact?.type === 'markdown';

  const handleClose = () => dispatch({ type: 'TOGGLE_ARTIFACTS_PANEL' });

  const handleCopy = async () => {
    if (!currentVersion) return;
    await navigator.clipboard.writeText(currentVersion.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentVersion || !activeArtifact) return;
    const ext = getExtension(activeArtifact.type, currentVersion.language);
    const blob = new Blob([currentVersion.content], { type: getMimeType(activeArtifact.type) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemove = () => {
    if (activeArtifactId) dispatch({ type: 'REMOVE_ARTIFACT', payload: activeArtifactId });
  };

  const handleVersionNav = (delta: number) => {
    if (!activeArtifact || !activeArtifactId) return;
    const newIdx = activeArtifact.currentVersionIndex + delta;
    if (newIdx >= 0 && newIdx < activeArtifact.versions.length) {
      dispatch({ type: 'SET_ARTIFACT_VERSION', payload: { id: activeArtifactId, versionIndex: newIdx } });
    }
  };

  if (!artifactsPanelOpen || artifacts.length === 0) return null;

  return (
    <div
      className="fixed right-0 top-0 z-40 flex h-full flex-col border-l border-border bg-card shadow-2xl"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 z-50 flex h-full w-2 cursor-col-resize items-center justify-center hover:bg-primary/10 transition-colors group"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar painel"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <h3 className="truncate text-sm font-semibold">{activeArtifact?.title ?? 'Artifact'}</h3>
          {activeArtifact && activeArtifact.versions.length > 1 && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              v{activeArtifact.currentVersionIndex + 1}/{activeArtifact.versions.length}
            </span>
          )}
        </div>
        <button onClick={handleClose} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs bar (artifact list if multiple) */}
      {artifacts.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1">
          {artifacts.map((a) => (
            <button
              key={a.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_ARTIFACT', payload: a.id })}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                a.id === activeArtifactId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[100px] truncate">{a.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          {canPreview && (
            <div className="flex rounded-md border border-input">
              <button
                onClick={() => setViewMode('code')}
                className={cn('flex items-center gap-1 px-2 py-1 text-xs transition-colors', viewMode === 'code' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <Code2 className="h-3 w-3" /> Code
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={cn('flex items-center gap-1 border-l border-input px-2 py-1 text-xs transition-colors', viewMode === 'preview' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
            </div>
          )}

          {/* Version navigation */}
          {activeArtifact && activeArtifact.versions.length > 1 && (
            <div className="ml-2 flex items-center gap-1">
              <button
                onClick={() => handleVersionNav(-1)}
                disabled={activeArtifact.currentVersionIndex === 0}
                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleVersionNav(1)}
                disabled={activeArtifact.currentVersionIndex === activeArtifact.versions.length - 1}
                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            <Download className="h-3 w-3" /> Download
          </button>
          <button onClick={handleRemove} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div data-select-scope="artifacts" tabIndex={0} className="flex-1 overflow-auto focus:outline-none">
        {!currentVersion ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">Nenhum conteúdo</div>
        ) : viewMode === 'code' || !canPreview ? (
          <pre className="p-4 text-sm leading-relaxed">
            <code className="text-foreground/90 whitespace-pre-wrap break-words font-mono text-xs">
              {currentVersion.content}
            </code>
          </pre>
        ) : activeArtifact?.type === 'html' ? (
          <iframe
            srcDoc={currentVersion.content}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-modals"
            title={activeArtifact.title}
          />
        ) : activeArtifact?.type === 'react' ? (
          <iframe
            srcDoc={wrapReactInHtml(currentVersion.content)}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-modals"
            title={activeArtifact.title}
          />
        ) : (
          <div className="prose prose-sm prose-invert max-w-none p-4">
            <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(currentVersion.content) }} />
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      {currentVersion && (
        <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>{LANG_LABELS[currentVersion.language] ?? currentVersion.language}</span>
          <span>{currentVersion.content.length.toLocaleString()} chars</span>
          <span>{new Date(currentVersion.timestamp).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getExtension(type: string, language: string): string {
  const map: Record<string, string> = {
    html: 'html', react: 'tsx', markdown: 'md', json: 'json',
    typescript: 'ts', javascript: 'js', python: 'py', css: 'css',
  };
  return map[type] ?? map[language] ?? 'txt';
}

function getMimeType(type: string): string {
  const map: Record<string, string> = {
    html: 'text/html', react: 'text/plain', markdown: 'text/markdown',
    json: 'application/json', code: 'text/plain', text: 'text/plain',
  };
  return map[type] ?? 'text/plain';
}

function wrapReactInHtml(code: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
<style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#0a0a0a;color:#fff}</style>
</head><body>
<div id="root"></div>
<script type="text/babel">
${code}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
</script>
</body></html>`;
}

function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}
