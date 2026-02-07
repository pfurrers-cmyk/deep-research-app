// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '0.4.0',
  buildTimestamp: '2026-02-07T12:41:06.298Z',
  commitHash: '7389f38',
  branch: 'master',
  changelog: [
    'Sistema de debug logging robusto (adaptado do MemorizaUltra)',
    'Client-side: localStorage com até 1000 entradas, export/download/clipboard',
    'Server-side: ring buffer em memória, endpoint /api/logs',
    'Pipeline instrumentado: todas as 6 etapas com timing e contagens',
    'API routes /api/generate e /api/research com logging completo',
    'LogViewer na Settings: visualizador client+server, filtros por nível, export .txt',
    'Versão dinâmica no card Sobre (BUILD_INFO.version)',
  ],
  previousVersion: '0.3.0',
};