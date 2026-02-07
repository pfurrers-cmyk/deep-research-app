// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '4.0.0',
  buildTimestamp: '2026-02-07T18:55:29.326Z',
  commitHash: '826a6ca',
  branch: 'master',
  changelog: [
    'Chat: Nova seção "Pergunte à IA" — interface de chat conversacional com streaming palavra-a-palavra',
    'Chat: Sidebar colapsável com lista de conversas agrupadas por data, busca, renomear, exportar e excluir',
    'Chat: Seletor de modelo inline com todos os modelos de texto do AI Gateway (sem embeddings/geradores de imagem)',
    'Chat: Detecção automática de artifacts (<artifact>) no stream com integração ao ArtifactsPanel existente',
    'Chat: Anexação de arquivos com extração de texto (txt, md, csv, json, código) + Ctrl+V para imagens',
    'Chat: Persistência de conversas via IndexedDB (Dexie v3) com auto-save após cada resposta',
    'Chat: Exportação de conversas como Markdown',
    'Chat: System prompt configurável nas Settings com suporte a artifacts automáticos',
    'Chat: Sugestões de prompt na tela inicial (4 exemplos interativos)',
    'Nav: "Pergunte à IA" como primeiro item na topbar, "Pesquisa" renomeada para "Pesquisa Profunda"',
    'Nav: CommandMenu (Ctrl+K) atualizado com atalho para chat',
    'Settings: Nova seção "Chat" com modelo padrão e prompt de sistema customizável',
    'API: Nova rota /api/chat com streamText via Vercel AI Gateway',
  ],
  previousVersion: '3.2.0',
};