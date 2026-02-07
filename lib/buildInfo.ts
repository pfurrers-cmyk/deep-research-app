// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '3.2.0',
  buildTimestamp: '2026-02-07T18:30:54.096Z',
  commitHash: '0040059',
  branch: 'master',
  changelog: [
    'Pipeline: Sistema de 3 modos de processamento — Base (single-pass), Extended (Map-Reduce), Ultra (Iterativo + Verificação)',
    'Pipeline: Resolução automática de modo baseada no modelo e quantidade de fontes configuradas',
    'Pipeline: Map-Reduce paralelo com batches via Promise.all para processamento de grandes volumes de fontes',
    'Pipeline: Enriquecimento iterativo com fontes remanescentes no modo Ultra',
    'Pipeline: Verificação cruzada obrigatória de afirmações factuais no modo Ultra',
    'Config: Mapa de limites de fontes para 130+ modelos com margens de segurança de 15%',
    'Config: System prompts especializados para MAP, REDUCE, ENRICH e VERIFY',
    'UI: Sliders dinâmicos de fontes com limites máximos baseados no modelo de síntese selecionado',
    'UI: Badge colorido de modo de processamento (Direto/Map-Reduce/Iterativo) com custo e latência estimados',
    'UI: Progresso granular no ResearchProgress — sub-estágios MAP, REDUCE, ENRICH, VERIFY visíveis quando ativos',
    'Testes: 31 novos testes unitários para model-source-limits e pipeline-prompts',
  ],
  previousVersion: '3.1.0',
};