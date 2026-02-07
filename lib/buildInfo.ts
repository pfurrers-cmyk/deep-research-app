// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '3.1.0',
  buildTimestamp: '2026-02-07T16:52:34.173Z',
  commitHash: 'fc1d802',
  branch: 'master',
  changelog: [
    'Upload: Sistema universal de anexação de arquivos e imagens (UniversalAttachment)',
    'Upload: Processadores para imagem (thumbnail+resize+base64), PDF (extração de texto), CSV (parse+preview), JSON, texto',
    'Upload: Botão 📎 no ResearchInput com Ctrl+V para colar imagens do clipboard',
    'Upload: Drag-and-drop global com overlay visual e dropzone dedicada',
    'Upload: Chips de preview com thumbnail, nome, tamanho e botão remover',
    'Upload: Validação de tipo MIME, tamanho, wildcards e anti-duplicatas',
    'Upload: Context builder injeta conteúdo extraído no prompt de síntese automaticamente',
    'Upload: Pipeline completo: ResearchInput → page → useResearch → TaskManager → API → Pipeline → Synthesizer',
    'Upload: Integração no Generate com dropzone + seletor de propósito (Referência/Modificar/Analisar/Contexto)',
    'Upload: Ícones de tipo de arquivo coloridos (PDF vermelho, CSV verde, JSON amarelo, etc)',
    'Upload: 31 testes unitários cobrindo mimeTypes, fileProcessors, contextBuilder e configs',
  ],
  previousVersion: '3.0.0',
};