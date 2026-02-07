// utils/contextBuilder.ts — Build AI prompt context from attached files

import type { AttachmentFile, AttachmentPurpose } from '../types';
import { PURPOSE_LABELS } from '../types';
import { formatFileSize } from './mimeTypes';

type FeatureContext = 'research' | 'imageGen' | 'textGen' | 'videoGen';

export function buildAttachmentContext(
  attachments: AttachmentFile[],
  feature: FeatureContext
): string {
  const ready = attachments.filter((a) => a.status === 'ready');
  if (ready.length === 0) return '';

  let context = '\n\n---\n📎 ARQUIVOS ANEXADOS PELO USUÁRIO:\n\n';

  for (const att of ready) {
    context += `### ${att.name} (${att.category}, ${formatFileSize(att.size)})\n`;

    if (att.purpose) {
      context += `**Propósito:** ${PURPOSE_LABELS[att.purpose]}\n`;
    }

    if (att.extractedText) {
      const truncated = att.extractedText.slice(0, 3000);
      context += `**Conteúdo extraído:**\n\`\`\`\n${truncated}\n\`\`\`\n`;
      if (att.extractedText.length > 3000) {
        context += `_(texto truncado — ${att.metadata?.wordCount ?? '?'} palavras no total)_\n`;
      }
    }

    if (att.extractedData) {
      context += `**Dados estruturados (preview):**\n`;
      if (att.extractedData.columns) {
        context += `Colunas: ${att.extractedData.columns.join(', ')}\n`;
      }
      if (att.extractedData.preview && att.extractedData.preview.length > 0) {
        context += `\`\`\`json\n${JSON.stringify(att.extractedData.preview.slice(0, 5), null, 2)}\n\`\`\`\n`;
      }
      if (att.extractedData.totalRows) {
        context += `Total de registros: ${att.extractedData.totalRows}\n`;
      }
    }

    if (att.category === 'image' && att.metadata) {
      context += `**Dimensões:** ${att.metadata.width}x${att.metadata.height}\n`;
    }

    if (att.category === 'document' && att.metadata?.pages) {
      context += `**Páginas:** ${att.metadata.pages}\n`;
    }

    context += '\n';
  }

  context += '---\n';
  context += getFeatureInstructions(feature, ready);

  return context;
}

function getFeatureInstructions(feature: FeatureContext, attachments: AttachmentFile[]): string {
  const hasImages = attachments.some((a) => a.category === 'image');
  const hasData = attachments.some((a) => a.category === 'data');

  switch (feature) {
    case 'research':
      return [
        `INSTRUÇÕES: O usuário anexou ${attachments.length} arquivo(s) como contexto para sua pesquisa. Use o conteúdo extraído acima para:`,
        '- Contextualizar a pesquisa com informações dos arquivos',
        '- Cruzar dados dos arquivos com fontes encontradas na web',
        '- Referenciar dados específicos dos anexos no relatório quando relevante',
        hasImages ? '- Analisar imagens anexadas e incorporar observações na análise' : '',
        hasData ? '- Utilizar dados estruturados para comparações e análises quantitativas' : '',
      ].filter(Boolean).join('\n');

    case 'imageGen':
      return [
        'INSTRUÇÕES: O usuário anexou imagem(ns) como referência.',
        `Propósito: ${attachments.map((a) => PURPOSE_LABELS[a.purpose]).join(', ')}`,
        'Siga as instruções do usuário considerando a(s) imagem(ns) fornecida(s).',
      ].join('\n');

    case 'textGen':
      return [
        `INSTRUÇÕES: O usuário forneceu ${attachments.length} arquivo(s) como material de apoio para geração de texto.`,
        'Incorpore o conteúdo extraído conforme solicitado no prompt principal.',
      ].join('\n');

    case 'videoGen':
      return [
        'INSTRUÇÕES: O usuário forneceu referência(s) visual(is) para geração de vídeo.',
        `Propósito: ${attachments.map((a) => PURPOSE_LABELS[a.purpose]).join(', ')}`,
        'Use como base para estilo, composição ou frame inicial conforme indicado.',
      ].join('\n');

    default:
      return '';
  }
}

export function getImageAttachmentsForMultimodal(
  attachments: AttachmentFile[]
): Array<{ base64: string; mimeType: string }> {
  return attachments
    .filter((a) => a.category === 'image' && a.base64 && a.status === 'ready')
    .map((a) => ({
      base64: a.base64!.replace(/^data:image\/[^;]+;base64,/, ''),
      mimeType: a.mimeType,
    }));
}
