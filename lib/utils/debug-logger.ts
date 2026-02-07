/**
 * Debug Logger — Sistema de logging robusto para diagnóstico
 *
 * Client-side: logs salvos em localStorage, exportáveis via console/download/clipboard.
 * Server-side: logs em memória (ring buffer) + console formatado.
 *
 * Adaptado do MemorizaUltra (extrator notion) para o Deep Research App.
 */

// ============================================================
// TYPES
// ============================================================

export interface DebugLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  module: string;
  message: string;
  data?: unknown;
  durationMs?: number;
}

// ============================================================
// CONFIG
// ============================================================

const STORAGE_KEY = 'DEEP_RESEARCH_DEBUG_LOGS';
const MAX_ENTRIES = 1000;
const APP_NAME = 'Deep Research';

// ============================================================
// UTILS
// ============================================================

function getTimestamp(): string {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function getTimestampBRT(): string {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function safeSerialize(data: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return String(data);
  }
}

// ============================================================
// SERVER-SIDE RING BUFFER (para API routes / pipeline)
// ============================================================

const serverLogs: DebugLogEntry[] = [];

function pushServerLog(entry: DebugLogEntry): void {
  serverLogs.push(entry);
  if (serverLogs.length > MAX_ENTRIES) {
    serverLogs.splice(0, serverLogs.length - MAX_ENTRIES);
  }
}

// ============================================================
// CLIENT-SIDE STORAGE (localStorage)
// ============================================================

function saveLogsToStorage(logs: DebugLogEntry[]): void {
  try {
    const trimmed = logs.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage cheio ou indisponível — silenciar
  }
}

function loadLogsFromStorage(): DebugLogEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ============================================================
// CORE LOG FUNCTION
// ============================================================

const isServer = typeof window === 'undefined';

export function debugLog(
  level: DebugLogEntry['level'],
  module: string,
  message: string,
  data?: unknown,
  durationMs?: number
): void {
  const entry: DebugLogEntry = {
    timestamp: getTimestamp(),
    level,
    module,
    message,
    data: data !== undefined ? safeSerialize(data) : undefined,
    durationMs,
  };

  // Console output formatado
  const prefix = `[${entry.timestamp}] [${level}] [${module}]`;
  const suffix = durationMs !== undefined ? ` (${durationMs}ms)` : '';
  const logMsg = `${prefix} ${message}${suffix}`;

  if (level === 'ERROR') {
    console.error(logMsg, data ?? '');
  } else if (level === 'WARN') {
    console.warn(logMsg, data ?? '');
  } else if (level === 'DEBUG') {
    console.debug(logMsg, data ?? '');
  } else {
    console.log(logMsg, data ?? '');
  }

  // Persistir
  if (isServer) {
    pushServerLog(entry);
  } else {
    const logs = loadLogsFromStorage();
    logs.push(entry);
    saveLogsToStorage(logs);
  }
}

// ============================================================
// ATALHOS CONVENIENTES
// ============================================================

export const debug = {
  info: (module: string, message: string, data?: unknown) =>
    debugLog('INFO', module, message, data),

  warn: (module: string, message: string, data?: unknown) =>
    debugLog('WARN', module, message, data),

  error: (module: string, message: string, data?: unknown) =>
    debugLog('ERROR', module, message, data),

  debug: (module: string, message: string, data?: unknown) =>
    debugLog('DEBUG', module, message, data),

  /** Log com medição de tempo */
  timed: (module: string, message: string, startTime: number, data?: unknown) =>
    debugLog('INFO', module, message, data, Date.now() - startTime),
};

// ============================================================
// GERENCIAMENTO DE LOGS
// ============================================================

/** Limpa todos os logs (client-side) */
export function clearDebugLogs(): void {
  if (!isServer) {
    localStorage.removeItem(STORAGE_KEY);
  }
  serverLogs.length = 0;
  console.log('[DebugLogger] Logs limpos');
}

/** Retorna logs como array */
export function getDebugLogs(): DebugLogEntry[] {
  if (isServer) return [...serverLogs];
  return loadLogsFromStorage();
}

/** Retorna logs do servidor (para API route /api/logs) */
export function getServerLogs(): DebugLogEntry[] {
  return [...serverLogs];
}

/** Exporta logs como string formatada para leitura humana */
export function exportDebugLogs(logs?: DebugLogEntry[]): string {
  const entries = logs ?? getDebugLogs();

  const errorCount = entries.filter((e) => e.level === 'ERROR').length;
  const warnCount = entries.filter((e) => e.level === 'WARN').length;

  let output = '='.repeat(80) + '\n';
  output += `${APP_NAME.toUpperCase()} — RELATÓRIO DE DEBUG\n`;
  output += `Gerado em: ${getTimestampBRT()} (GMT-3)\n`;
  output += `Total de entradas: ${entries.length}\n`;
  output += `Erros: ${errorCount} | Avisos: ${warnCount}\n`;
  output += '='.repeat(80) + '\n\n';

  for (const entry of entries) {
    const dur = entry.durationMs !== undefined ? ` [${entry.durationMs}ms]` : '';
    output += `[${entry.timestamp}] [${entry.level.padEnd(5)}] [${entry.module}]${dur}\n`;
    output += `  ${entry.message}\n`;
    if (entry.data !== undefined) {
      const dataStr = JSON.stringify(entry.data, null, 2);
      output += `  DATA: ${dataStr.split('\n').join('\n  ')}\n`;
    }
    output += '\n';
  }

  return output;
}

/** Copia logs para clipboard (client-side apenas) */
export async function copyDebugLogsToClipboard(): Promise<boolean> {
  try {
    const text = exportDebugLogs();
    await navigator.clipboard.writeText(text);
    console.log('[DebugLogger] Logs copiados para clipboard!');
    return true;
  } catch {
    console.error('[DebugLogger] Erro ao copiar para clipboard');
    return false;
  }
}

/** Baixa logs como arquivo .txt (client-side apenas) */
export function downloadDebugLogs(): void {
  const text = exportDebugLogs();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `deep-research-debug_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('[DebugLogger] Arquivo de logs baixado!');
}

/** Retorna resumo dos logs para exibição rápida */
export function getLogsSummary(): {
  total: number;
  errors: number;
  warnings: number;
  lastError?: DebugLogEntry;
  modules: string[];
} {
  const logs = getDebugLogs();
  const errors = logs.filter((e) => e.level === 'ERROR');
  const warnings = logs.filter((e) => e.level === 'WARN');
  const modules = [...new Set(logs.map((e) => e.module))];

  return {
    total: logs.length,
    errors: errors.length,
    warnings: warnings.length,
    lastError: errors.at(-1),
    modules,
  };
}

// ============================================================
// GLOBAL WINDOW ACCESS (client-side, para debug via console)
// ============================================================

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).debugLogs = {
    export: exportDebugLogs,
    clear: clearDebugLogs,
    get: getDebugLogs,
    copy: copyDebugLogsToClipboard,
    download: downloadDebugLogs,
    summary: getLogsSummary,
  };
}
