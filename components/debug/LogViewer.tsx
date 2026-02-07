'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bug, Download, Clipboard, Trash2, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  getDebugLogs,
  clearDebugLogs,
  downloadDebugLogs,
  copyDebugLogsToClipboard,
  getLogsSummary,
  type DebugLogEntry,
} from '@/lib/utils/debug-logger';

const LEVEL_COLORS: Record<string, string> = {
  ERROR: 'text-red-500',
  WARN: 'text-yellow-500',
  INFO: 'text-blue-400',
  DEBUG: 'text-gray-400',
};

export function LogViewer() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [serverLogs, setServerLogs] = useState<DebugLogEntry[]>([]);
  const [source, setSource] = useState<'client' | 'server'>('client');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    setLogs(getDebugLogs());
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

  useEffect(() => {
    refresh();
    fetchServerLogs();
  }, [refresh, fetchServerLogs]);

  const activeLogs = source === 'client' ? logs : serverLogs;
  const filtered =
    filterLevel === 'ALL'
      ? activeLogs
      : activeLogs.filter((l) => l.level === filterLevel);

  const summary = getLogsSummary();

  const handleCopy = async () => {
    const ok = await copyDebugLogsToClipboard();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    clearDebugLogs();
    setLogs([]);
    setServerLogs([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Debug Logs</CardTitle>
              <CardDescription>
                {summary.total} entradas · {summary.errors} erros · {summary.warnings} avisos
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refresh();
                fetchServerLogs();
              }}
              title="Atualizar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copiar">
              <Clipboard className="h-3.5 w-3.5" />
              {copied && <span className="ml-1 text-xs text-green-500">OK</span>}
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadDebugLogs} title="Baixar .txt">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} title="Limpar logs">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Source + Filter */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-input">
            <button
              onClick={() => setSource('client')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                source === 'client'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cliente ({logs.length})
            </button>
            <button
              onClick={() => {
                setSource('server');
                fetchServerLogs();
              }}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium transition-colors ${
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
            className="rounded-md border border-input bg-card px-2 py-1 text-xs"
          >
            <option value="ALL">Todos</option>
            <option value="ERROR">Erros</option>
            <option value="WARN">Avisos</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} de {activeLogs.length}
          </span>
        </div>

        {/* Log entries */}
        <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-black/40 p-2 font-mono text-[11px] leading-relaxed">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nenhum log registrado
            </p>
          ) : (
            [...filtered].reverse().map((entry, i) => (
              <div key={i} className="border-b border-border/30 py-1 last:border-0">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-muted-foreground/60">
                    {entry.timestamp.slice(11, 23)}
                  </span>
                  <span className={`shrink-0 font-bold ${LEVEL_COLORS[entry.level] ?? ''}`}>
                    {entry.level.padEnd(5)}
                  </span>
                  <span className="shrink-0 text-cyan-400/70">[{entry.module}]</span>
                  <span className="text-foreground/90">{entry.message}</span>
                  {entry.durationMs !== undefined && (
                    <span className="shrink-0 text-yellow-400/70">{entry.durationMs}ms</span>
                  )}
                </div>
                {entry.data !== undefined && (
                  <pre className="ml-16 mt-0.5 max-h-20 overflow-auto text-muted-foreground/50">
                    {typeof entry.data === 'string'
                      ? entry.data
                      : JSON.stringify(entry.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          Console: <code>window.debugLogs.export()</code> · <code>window.debugLogs.download()</code> · <code>window.debugLogs.clear()</code>
        </p>
      </CardContent>
    </Card>
  );
}
