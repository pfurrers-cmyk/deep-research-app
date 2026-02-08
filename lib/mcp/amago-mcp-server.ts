/**
 * Âmago.AI MCP Server — Expõe ferramentas de diagnóstico para conexão com Claude.ai
 *
 * Tools expostas:
 *  - get_server_logs: Logs do servidor com filtros
 *  - get_app_status: Status do app, modo TCC, configuração
 *  - get_divergence_report: Relatório de divergências TCC
 *  - get_reverse_prompt: Prompt reverso estruturado para diagnóstico e correção do modo TCC
 *  - read_source_file: Lê arquivo-fonte do projeto
 *  - list_key_files: Lista arquivos-chave do projeto
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getServerLogs, exportDebugLogs, getLogsSummary, type DebugLogEntry } from '@/lib/utils/debug-logger';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();

// Allowed directories for file reading (security)
const ALLOWED_DIRS = [
  'lib', 'components', 'app', 'config', 'docs', 'tests', 'hooks',
];

function isAllowedPath(filePath: string): boolean {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  if (normalized.includes('..')) return false;
  return ALLOWED_DIRS.some(dir => normalized.startsWith(dir + '/') || normalized === dir);
}

export function createAmagoMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'Âmago.AI',
      version: '5.1.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  // ============================================================
  // TOOL: get_server_logs
  // ============================================================
  server.tool(
    'get_server_logs',
    'Retorna logs do servidor Âmago.AI com filtros opcionais. Inclui logs de pipeline, síntese, API, TCC, exportação.',
    {
      level: z.string().optional().describe('Filtrar por nível: ALL, ERROR, WARN, INFO, DEBUG'),
      module: z.string().optional().describe('Filtrar por módulo (ex: Pipeline, Synthesizer, API:Research, TCC:UI, ExportModal, TaskManager)'),
      last_n: z.number().optional().describe('Retornar apenas os últimos N logs (default: 200)'),
      format: z.string().optional().describe('Formato: json ou text (default: text)'),
    },
    async (args) => {
      const level = args.level || 'ALL';
      const mod = args.module || '';
      const lastN = args.last_n || 200;
      const format = args.format || 'text';

      let logs: DebugLogEntry[] = getServerLogs();

      if (level !== 'ALL') {
        logs = logs.filter(l => l.level === level);
      }
      if (mod) {
        logs = logs.filter(l => l.module.toLowerCase().includes(mod.toLowerCase()));
      }
      logs = logs.slice(-lastN);

      const summary = getLogsSummary();

      if (format === 'json') {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ summary, logs, filtered: logs.length, total: summary.total }, null, 2),
          }],
        };
      }

      const text = exportDebugLogs(logs);
      return {
        content: [{
          type: 'text' as const,
          text: `RESUMO: ${summary.total} total, ${summary.errors} erros, ${summary.warnings} avisos\nMódulos: ${summary.modules.join(', ')}\n\n${text}`,
        }],
      };
    },
  );

  // ============================================================
  // TOOL: get_app_status
  // ============================================================
  server.tool(
    'get_app_status',
    'Retorna status do app: versão, modo TCC, configuração atual, preferências default, pipeline info.',
    async () => {
      const summary = getLogsSummary();

      // Read buildInfo for version
      let buildInfo = 'N/A';
      try {
        const biPath = path.join(PROJECT_ROOT, 'lib', 'buildInfo.ts');
        buildInfo = fs.readFileSync(biPath, 'utf-8');
      } catch { /* ignore */ }

      // Read defaults for export formats
      let exportFormats: string[] = [];
      try {
        const configPath = path.join(PROJECT_ROOT, 'config', 'defaults.ts');
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const match = configContent.match(/exportFormats:\s*\{[\s\S]*?options:\s*\{([\s\S]*?)\}\s*as/);
        if (match) {
          const keys = [...match[1].matchAll(/(\w+):\s*\{/g)].map(m => m[1]);
          exportFormats = keys;
        }
      } catch { /* ignore */ }

      // Read settings-store defaults
      let defaultPrefs = 'N/A';
      try {
        const storePath = path.join(PROJECT_ROOT, 'lib', 'config', 'settings-store.ts');
        const storeContent = fs.readFileSync(storePath, 'utf-8');
        const defaultMatch = storeContent.match(/DEFAULT_PREFERENCES[\s\S]*?=\s*(\{[\s\S]*?\n\};)/);
        if (defaultMatch) defaultPrefs = defaultMatch[1].slice(0, 2000);
      } catch { /* ignore */ }

      const status = {
        app: 'Âmago.AI',
        buildInfo: buildInfo.slice(0, 500),
        logSummary: summary,
        exportFormats,
        hasDocxInExport: exportFormats.includes('docx'),
        defaultPreferences: defaultPrefs,
        serverEnvironment: {
          nodeVersion: process.version,
          platform: process.platform,
          isVercel: !!process.env.VERCEL,
          cwd: PROJECT_ROOT,
        },
        knownIssues: [
          'loadPreferences() retorna defaults no servidor (localStorage indisponível)',
          'proSettings e tccSettings adicionados ao request body mas pipeline ainda usa loadPreferences()',
          'DOCX não está listado em APP_CONFIG.pro.exportFormats.options',
          'TCC synthesizer nunca é chamado em produção',
        ],
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(status, null, 2),
        }],
      };
    },
  );

  // ============================================================
  // TOOL: get_divergence_report
  // ============================================================
  server.tool(
    'get_divergence_report',
    'Retorna o relatório de divergências entre o que foi solicitado (TCC ABNT) e o que foi entregue. Documento de análise técnica.',
    async () => {
      const docPath = path.join(PROJECT_ROOT, 'docs', 'DIVERGENCIAS_TCC.md');
      try {
        const content = fs.readFileSync(docPath, 'utf-8');
        return {
          content: [{
            type: 'text' as const,
            text: content,
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Erro ao ler divergências: ${err instanceof Error ? err.message : String(err)}`,
          }],
        };
      }
    },
  );

  // ============================================================
  // TOOL: get_reverse_prompt
  // ============================================================
  server.tool(
    'get_reverse_prompt',
    'Retorna o prompt reverso estruturado com diagnóstico completo, cadeia de falha, e plano de correção do modo TCC ABNT. Use este documento como guia principal para corrigir os problemas do app.',
    async () => {
      const docPath = path.join(PROJECT_ROOT, 'docs', 'PROMPT_REVERSO_CLAUDE_MCP.md');
      try {
        const content = fs.readFileSync(docPath, 'utf-8');
        return {
          content: [{
            type: 'text' as const,
            text: content,
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Erro ao ler prompt reverso: ${err instanceof Error ? err.message : String(err)}`,
          }],
        };
      }
    },
  );

  // ============================================================
  // TOOL: read_source_file
  // ============================================================
  server.tool(
    'read_source_file',
    'Lê um arquivo-fonte do projeto Âmago.AI. Caminhos relativos à raiz do projeto. Ex: lib/research/synthesizer.ts',
    {
      file_path: z.string().describe('Caminho relativo ao projeto (ex: lib/research/pipeline.ts, config/defaults.ts)'),
      start_line: z.number().optional().describe('Linha inicial (1-indexed, opcional)'),
      end_line: z.number().optional().describe('Linha final (1-indexed, opcional)'),
    },
    async (args) => {
      const relPath = args.file_path || '';
      const startLine = args.start_line || 0;
      const endLine = args.end_line || 0;

      if (!relPath || !isAllowedPath(relPath)) {
        return {
          content: [{
            type: 'text' as const,
            text: `Caminho não permitido: "${relPath}". Diretórios permitidos: ${ALLOWED_DIRS.join(', ')}`,
          }],
        };
      }

      const fullPath = path.join(PROJECT_ROOT, relPath);
      try {
        let content = fs.readFileSync(fullPath, 'utf-8');
        if (startLine > 0 || endLine > 0) {
          const lines = content.split('\n');
          const s = Math.max(0, startLine - 1);
          const e = endLine > 0 ? Math.min(lines.length, endLine) : lines.length;
          content = lines.slice(s, e).map((l, i) => `${s + i + 1}\t${l}`).join('\n');
        }

        // Truncate if too large
        if (content.length > 30000) {
          content = content.slice(0, 30000) + '\n\n... (truncado, use start_line/end_line para ler seções)';
        }

        return {
          content: [{
            type: 'text' as const,
            text: `// FILE: ${relPath} (${content.split('\n').length} linhas)\n\n${content}`,
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Erro ao ler "${relPath}": ${err instanceof Error ? err.message : String(err)}`,
          }],
        };
      }
    },
  );

  // ============================================================
  // TOOL: list_key_files
  // ============================================================
  server.tool(
    'list_key_files',
    'Lista os arquivos-chave do projeto Âmago.AI relevantes para diagnóstico do modo TCC.',
    {
      directory: z.string().optional().describe('Diretório a listar (ex: lib/research, lib/export, components/export). Default: lista os arquivos TCC-related.'),
    },
    async (args) => {
      const dir = args.directory || '';

      if (dir) {
        if (!isAllowedPath(dir)) {
          return {
            content: [{
              type: 'text' as const,
              text: `Diretório não permitido: "${dir}". Permitidos: ${ALLOWED_DIRS.join(', ')}`,
            }],
          };
        }

        const fullDir = path.join(PROJECT_ROOT, dir);
        try {
          const entries = fs.readdirSync(fullDir, { withFileTypes: true });
          const listing = entries.map(e => {
            const stat = e.isFile() ? fs.statSync(path.join(fullDir, e.name)) : null;
            return `${e.isDirectory() ? '📁' : '📄'} ${e.name}${stat ? ` (${stat.size} bytes)` : ''}`;
          }).join('\n');
          return {
            content: [{
              type: 'text' as const,
              text: `Diretório: ${dir}\n\n${listing}`,
            }],
          };
        } catch (err) {
          return {
            content: [{
              type: 'text' as const,
              text: `Erro ao listar "${dir}": ${err instanceof Error ? err.message : String(err)}`,
            }],
          };
        }
      }

      // Default: key TCC-related files
      const keyFiles = [
        'lib/research/pipeline.ts',
        'lib/research/synthesizer.ts',
        'lib/research/tcc-synthesizer.ts',
        'lib/research/section-synthesizer.ts',
        'lib/research/types.ts',
        'lib/ai/prompts/tcc-sections.ts',
        'lib/ai/prompts/synthesis.ts',
        'lib/config/settings-store.ts',
        'lib/store/task-manager.ts',
        'lib/export/converters.ts',
        'lib/export/docx-abnt.ts',
        'lib/utils/debug-logger.ts',
        'components/research/ResearchInput.tsx',
        'components/export/ExportModal.tsx',
        'components/debug/FloatingLogButton.tsx',
        'app/api/research/route.ts',
        'app/api/mcp/route.ts',
        'config/defaults.ts',
        'docs/DIVERGENCIAS_TCC.md',
        'docs/PROMPT_REVERSO_CLAUDE_MCP.md',
      ];

      const listing = keyFiles.map(f => {
        const fullPath = path.join(PROJECT_ROOT, f);
        try {
          const stat = fs.statSync(fullPath);
          return `📄 ${f} (${stat.size} bytes, ${new Date(stat.mtime).toISOString().slice(0, 19)})`;
        } catch {
          return `❌ ${f} (não encontrado)`;
        }
      }).join('\n');

      return {
        content: [{
          type: 'text' as const,
          text: `Arquivos-chave do Âmago.AI (modo TCC):\n\n${listing}`,
        }],
      };
    },
  );

  return server;
}
