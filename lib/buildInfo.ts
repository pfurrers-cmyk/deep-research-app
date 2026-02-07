// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '0.5.0',
  buildTimestamp: '2026-02-07T12:50:43.373Z',
  commitHash: '45fdfa7',
  branch: 'master',
  changelog: [
    'Botão flutuante de debug logs acessível em TODAS as telas (canto inferior direito)',
    'Drawer de logs com auto-refresh 3s, filtros, export/download/clipboard, expand/minimize',
    'Badge vermelho pulsante no botão quando há erros capturados',
    'TaskManager singleton: tarefas (pesquisa, geração) persistem ao mudar de página',
    'useResearch refatorado para useSyncExternalStore — navegar não mata SSE',
    'Geração de imagem/vídeo também persiste entre navegações',
    'Reset explícito para renovar tarefas (botão na UI)',
  ],
  previousVersion: '0.4.0',
};