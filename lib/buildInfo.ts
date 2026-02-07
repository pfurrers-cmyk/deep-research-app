// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '2.0.1',
  buildTimestamp: '2026-02-07T15:39:32.676Z',
  commitHash: 'b3e3b2c',
  branch: 'master',
  changelog: [
    'Fix: modelo inexistente google/imagen-4.0-fast-generate-001 removido do catálogo',
    'Fix: import generateImage → experimental_generateImage (AI SDK 6.x)',
    'Fix: image-only models agora usam aspectRatio em vez de size',
    'Fix: novos modelos bfl/flux-2-pro e bfl/flux-2-flex adicionados',
    'Fix: logs com timestamp completo (dd/mm hh:mm:ss), ordenação cronológica correta',
    'Fix: botão copiar logs filtrados + copiar todos separados',
    'Fix: Ctrl+A scoped funcional via document.activeElement',
  ],
  previousVersion: '2.0.0',
};