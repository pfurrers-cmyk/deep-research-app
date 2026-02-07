'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bug, X, Download, Clipboard, Trash2, RefreshCw, Server, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import {
  getDebugLogs,
  clearDebugLogs,
  downloadDebugLogs,
  copyDebugLogsToClipboard,
  exportDebugLogs,
  getLogsSummary,
  type DebugLogEntry,
} from '@/lib/utils/debug-logger';

const LEVEL_COLORS: Record<string, string> = {
  ERROR: 'text-red-500',
  WARN: 'text-yellow-500',
  INFO: 'text-blue-400',
  DEBUG: 'text-gray-400',
};

export function FloatingLogButton() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [serverLogs, setServerLogs] = useState<DebugLogEntry[]>([]);
  const [source, setSource] = useState<'client' | 'server'>('client');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const refresh = useCallback(() => {
    const clientLogs = getDebugLogs();
    setLogs(clientLogs);
    const summary = getLogsSummary();
    setErrorCount(summary.errors);
  }, []);

  const fetchServerLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setServerLogs(data.logs ?? []);
    } catch {
      setServerLogs([]);
    }
  }, []);

  // Auto-refresh logs every 3s when panel is open
  useEffect(() => {
    if (!open) return;
    refresh();
    fetchServerLogs();
    const interval = setInterval(() => {
      refresh();
      if (source === 'server') fetchServerLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [open, source, refresh, fetchServerLogs]);

  // Check for errors periodically even when closed
  useEffect(() => {
    const interval = setInterval(() => {
      const summary = getLogsSummary();
      setErrorCount(summary.errors);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeLogs = source === 'client' ? logs : serverLogs;
  const filtered =
    filterLevel === 'ALL'
      ? activeLogs
      : activeLogs.filter((l) => l.level === filterLevel);

  const handleCopyAll = async () => {
    const ok = await copyDebugLogsToClipboard();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyFiltered = async () => {
    try {
      const text = exportDebugLogs(filtered);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const handleClear = () => {
    clearDebugLogs();
    setLogs([]);
    setServerLogs([]);
    setErrorCount(0);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 ${
          errorCount > 0
            ? 'bg-red-600 text-white animate-pulse'
            : 'bg-card text-muted-foreground border border-border hover:text-foreground'
        }`}
        title={`Debug Logs${errorCount > 0 ? ` (${errorCount} erros)` : ''}`}
      >
        <Bug className="h-5 w-5" />
        {errorCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {errorCount > 99 ? '99+' : errorCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div
          className={`fixed right-0 z-50 flex flex-col border-l border-border bg-card shadow-2xl transition-all ${
            expanded
              ? 'bottom-0 top-0 w-full max-w-lg'
              : 'bottom-0 h-[420px] w-full max-w-lg rounded-tl-xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Debug Logs</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {activeLogs.length}
              </span>
              {errorCount > 0 && (
                <span className="rounded bg-red-600/20 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                  {errorCount} erros
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { refresh(); fetchServerLogs(); }} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Atualizar">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleCopyFiltered} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Copiar logs visíveis">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button onClick={handleCopyAll} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Copiar todos os logs">
                <Clipboard className="h-3.5 w-3.5" />
              </button>
              <button onClick={downloadDebugLogs} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Baixar .txt">
                <Download className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleClear} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Limpar logs">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setExpanded(!expanded)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title={expanded ? 'Minimizar' : 'Expandir'}>
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Fechar">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-1.5">
            <div className="flex rounded-md border border-input text-[11px]">
              <button
                onClick={() => setSource('client')}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  source === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cliente ({logs.length})
              </button>
              <button
                onClick={() => { setSource('server'); fetchServerLogs(); }}
                className={`flex items-center gap-1 px-2.5 py-1 font-medium transition-colors ${
                  source === 'server'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Server className="h-3 w-3" />
                Servidor ({serverLogs.length})
              </button>
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="rounded-md border border-input bg-card px-1.5 py-1 text-[11px]"
            >
              <option value="ALL">Todos</option>
              <option value="ERROR">Erros</option>
              <option value="WARN">Avisos</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
            <span className="text-[10px] text-muted-foreground">
              {filtered.length} de {activeLogs.length}
            </span>
          </div>

          {/* Log entries */}
          <div data-select-scope="floating-logs" tabIndex={0} className="flex-1 overflow-y-auto bg-black/30 p-2 font-mono text-[10px] leading-relaxed focus:outline-none">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Nenhum log registrado
              </p>
            ) : (
              filtered.map((entry, i) => (
                <div key={i} className="border-b border-border/20 py-0.5 last:border-0">
                  <div className="flex items-start gap-1.5">
                    <span className="shrink-0 text-muted-foreground/40">
                      {i + 1}
                    </span>
                    <span className="shrink-0 text-muted-foreground/50">
                      {entry.timestamp}
                    </span>
                    <span className={`shrink-0 font-bold ${LEVEL_COLORS[entry.level] ?? ''}`}>
                      {entry.level.padEnd(5)}
                    </span>
                    <span className="shrink-0 text-cyan-400/60">[{entry.module}]</span>
                    <span className="text-foreground/80">{entry.message}</span>
                    {entry.durationMs !== undefined && (
                      <span className="shrink-0 text-yellow-400/60">{entry.durationMs}ms</span>
                    )}
                  </div>
                  {entry.data !== undefined && (
                    <pre className="ml-12 mt-0.5 max-h-16 overflow-auto text-[9px] text-muted-foreground/40">
                      {typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-1 text-[9px] text-muted-foreground">
            Console: <code>window.debugLogs.download()</code> · Auto-refresh: 3s · Contínuo até reset
          </div>
        </div>
      )}
    </>
  );
}
