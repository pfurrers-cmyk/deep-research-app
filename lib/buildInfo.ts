// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '0.2.3',
  buildTimestamp: '2026-02-07T12:23:24.168Z',
  commitHash: 'c45634a',
  branch: 'master',
  changelog: [
    'smart-deploy.ps1: Vercel Agent Review tratado como advisory (não-bloqueante)',
    'Checks separados em blocking (Vercel, Preview Comments) vs advisory (Agent Review)',
    'Merge imediato quando blocking checks passam — sem esperar Agent Review eternamente IN_PROGRESS',
  ],
  previousVersion: '0.2.2',
};