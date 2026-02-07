// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '4.1.0',
  buildTimestamp: '2026-02-07T19:38:02.403Z',
  commitHash: 'a59b49c',
  branch: 'master',
  changelog: [
    'Branding: App renomeado para Âmago.AI em toda a aplicação (header, exports, metadata, testes)',
    'UI: Botão "Pesquisar" não sobrepõe mais elementos no input (padding corrigido)',
    'Safety: Configurações de segurança permissivas (BLOCK_NONE) aplicadas automaticamente para modelos Google em todas as 10 chamadas LLM',
    'Safety: Módulo config/safety-settings.ts com documentação de status por provedor (Google, Anthropic, OpenAI, etc.)',
    'Safety: Integração centralizada via getSafetyProviderOptions() — sem necessidade de config manual por rota',
  ],
  previousVersion: '4.0.0',
};