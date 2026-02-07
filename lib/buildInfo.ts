// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '0.2.1',
  buildTimestamp: '2026-02-07T12:15:38.054Z',
  commitHash: 'aa75f1b',
  branch: 'master',
  changelog: [
    'smart-deploy.ps1: polling JSON estruturado (gh pr checks --json) em vez de regex',
    'Detecção em tempo real do estado de cada check (nome:estado)',
    'Poll a cada 5s (era 10s), timeout 120s (era 180s)',
  ],
  previousVersion: '0.2.0',
};