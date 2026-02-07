// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '0.7.0',
  buildTimestamp: '2026-02-07T13:44:53.254Z',
  commitHash: '9e4eac8',
  branch: 'master',
  changelog: [
    'Vercel Agent Code Review habilitado e integrado ao pipeline',
    'AGENTS.md com guidelines para code review automatizado',
    'Testes unitários automáticos no smart-deploy.ps1 (bloqueia deploy se falhar)',
    'Parâmetros -SkipTests e -SkipAgentReview para emergências',
    'Timeout de Agent Review aumentado para 300s com fallback advisory',
    'Fix: geração de imagem retorna binário (evita limite 4.5MB Vercel)',
    'Fix: TaskManager detecta Content-Type (binary vs JSON) para compatibilidade',
  ],
  previousVersion: '0.6.0',
};