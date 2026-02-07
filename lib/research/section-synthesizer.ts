// lib/research/section-synthesizer.ts — Multi-section synthesis for long reports (anti-truncation)
// Generates an outline first, then streams each section independently with cross-section context.
import { streamText, generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { selectModel } from '@/lib/ai/model-router';
import { buildSynthesisPrompt } from '@/lib/ai/prompts/synthesis';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type { EvaluatedSource, ResearchAttachment } from '@/lib/research/types';
import { loadPreferences } from '@/lib/config/settings-store';
import { getSafetyProviderOptions } from '@/config/safety-settings';

// ============================================================
// TYPES
// ============================================================

export interface SectionOutline {
  id: string;
  title: string;
  headingLevel: number;
  description: string;
  estimatedTokens: number;
  relevantSourceIndices: number[];
}

export interface OutlineResult {
  sections: SectionOutline[];
  totalEstimatedTokens: number;
}

export type SectionStatus = 'pending' | 'generating' | 'complete' | 'error';

export interface SectionProgress {
  sectionId: string;
  status: SectionStatus;
  progress?: number;
}

// ============================================================
// OUTLINE SCHEMA
// ============================================================

const outlineSchema = z.object({
  reasoning: z.string().describe('Brief reasoning about how to structure this report'),
  sections: z.array(z.object({
    id: z.string().describe('Unique section identifier (snake_case)'),
    title: z.string().describe('Section heading as it will appear in the report'),
    headingLevel: z.number().min(2).max(4).describe('Markdown heading level (2=##, 3=###)'),
    description: z.string().describe('What this section should cover, key points to address'),
    estimatedTokens: z.number().describe('Estimated tokens for this section'),
    relevantSourceIndices: z.array(z.number()).describe('1-indexed source numbers most relevant to this section'),
  })),
  totalEstimatedTokens: z.number().describe('Sum of all section estimated tokens'),
});

// ============================================================
// MULTI-SECTION SYNTHESIZER
// ============================================================

/**
 * Determines if multi-section synthesis should be used based on config.
 */
export function shouldUseMultiSection(
  researchMode: string,
  detailLevel: string,
  sourceCount: number,
): boolean {
  // TCC mode always uses multi-section
  if (researchMode === 'tcc') return true;
  // Exhaustive with many sources uses multi-section
  if (detailLevel === 'exhaustive' && sourceCount > 10) return true;
  return false;
}

/**
 * Generate a structured outline for the report sections.
 */
export async function generateOutline(
  query: string,
  sources: EvaluatedSource[],
  config: AppConfig,
  modelId: string,
): Promise<OutlineResult> {
  const prefs = loadPreferences();
  const researchMode = prefs.pro.researchMode;
  const isTcc = researchMode === 'tcc';

  const sourceSummary = sources
    .map((s, i) => `[${i + 1}] "${s.title}" — ${s.snippet?.slice(0, 150) ?? 'N/A'}`)
    .join('\n');

  const tccSections = isTcc
    ? `\nEstrutura TCC obrigatória:
1. CAPA (elementos pré-textuais)
2. FOLHA DE ROSTO
3. RESUMO + Palavras-chave
4. ABSTRACT + Keywords
5. SUMÁRIO
6. INTRODUÇÃO (contextualização, problema, objetivos, justificativa)
7. REFERENCIAL TEÓRICO (revisão de literatura por temas)
8. METODOLOGIA
9. RESULTADOS E DISCUSSÃO
10. CONSIDERAÇÕES FINAIS
11. REFERÊNCIAS BIBLIOGRÁFICAS`
    : '';

  const systemPrompt = `Você é um planejador de documentos acadêmicos e relatórios de pesquisa.
Sua tarefa: criar um outline detalhado das seções que o relatório final deve conter.

Para cada seção, defina:
- Um ID único em snake_case
- O título exato como aparecerá no documento
- O nível de heading (2 para seções principais, 3 para subseções)
- Uma descrição do que a seção deve cobrir
- Estimativa de tokens necessários
- Quais fontes (por número) são mais relevantes para a seção
${tccSections}

Gere seções suficientes para cobrir o tema com profundidade. Mínimo 5 seções, máximo 15.`;

  const result = await generateObject({
    model: gateway(modelId),
    schema: outlineSchema,
    system: systemPrompt,
    prompt: `PERGUNTA: "${query}"\n\nFONTES DISPONÍVEIS:\n${sourceSummary}\n\nGere o outline estruturado do relatório.`,
    providerOptions: getSafetyProviderOptions(modelId) as never,
  });

  return {
    sections: result.object.sections,
    totalEstimatedTokens: result.object.totalEstimatedTokens,
  };
}

/**
 * Synthesize a single section with context from previous sections.
 */
async function synthesizeSingleSection(
  section: SectionOutline,
  query: string,
  sources: EvaluatedSource[],
  previousSectionsContext: string,
  config: AppConfig,
  modelId: string,
  onTextDelta?: (delta: string) => void,
): Promise<string> {
  const prefs = loadPreferences();

  // Build focused source text for this section
  const relevantSources = section.relevantSourceIndices.length > 0
    ? section.relevantSourceIndices.map((i) => sources[i - 1]).filter(Boolean)
    : sources;

  const sourcesText = relevantSources
    .map((s) => {
      const idx = sources.indexOf(s) + 1;
      return `[${idx}] "${s.title}"\nURL: ${s.url}\n${s.content?.slice(0, 2000) ?? s.snippet?.slice(0, 800) ?? 'N/A'}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt = `Você é um pesquisador sênior escrevendo UMA SEÇÃO de um relatório maior.

REGRAS:
- Escreva SOMENTE a seção "${section.title}" — NÃO inclua outras seções
- Comece diretamente com o conteúdo (NÃO repita o heading — ele será adicionado automaticamente)
- Use citações [N] referenciando as fontes fornecidas
- Mantenha coerência com o contexto das seções anteriores
- Linguagem: ${config.pipeline.synthesis.outputLanguage}
- Tom: acadêmico, analítico, com dados quantitativos quando disponíveis
- Cada parágrafo deve cruzar 2-4 fontes diferentes
- Gere todo o conteúdo necessário para esta seção — sem limite de tamanho

${previousSectionsContext ? `CONTEXTO DAS SEÇÕES ANTERIORES (para manter coerência):\n${previousSectionsContext}\n` : ''}`;

  const prompt = `SEÇÃO A ESCREVER: "${section.title}"
DESCRIÇÃO: ${section.description}

PERGUNTA DE PESQUISA: "${query}"

FONTES RELEVANTES:
${sourcesText}

Escreva o conteúdo completo desta seção agora.`;

  let sectionText = '';

  const result = streamText({
    model: gateway(modelId),
    system: systemPrompt,
    prompt,
    abortSignal: AbortSignal.timeout(config.resilience.timeoutPerStageMs.synthesis),
    providerOptions: getSafetyProviderOptions(modelId) as never,
  });

  for await (const delta of result.textStream) {
    sectionText += delta;
    onTextDelta?.(delta);
  }

  // Check for truncation
  const finishReason = await result.finishReason;
  if (finishReason === 'length') {
    const warning = '\n\n> ⚠️ _Esta seção foi truncada pelo limite de tokens do modelo._\n';
    sectionText += warning;
    onTextDelta?.(warning);
  }

  return sectionText;
}

/**
 * Summarize a section's content for cross-section context (keeps it compact).
 */
function summarizeSection(title: string, content: string): string {
  // Take first 500 chars as summary context for next sections
  const summary = content.slice(0, 500).replace(/\n+/g, ' ').trim();
  return `- "${title}": ${summary}${content.length > 500 ? '...' : ''}`;
}

/**
 * Main multi-section synthesis function.
 * Generates outline → streams each section → concatenates result.
 */
export async function synthesizeBySection(
  query: string,
  sources: EvaluatedSource[],
  depth: DepthPreset,
  config: AppConfig,
  onTextDelta?: (delta: string) => void,
  onSectionProgress?: (progress: SectionProgress) => void,
  attachments?: ResearchAttachment[],
): Promise<string> {
  const prefs = loadPreferences();
  const modelSelection = selectModel('synthesis', 'auto', depth, config);
  const modelId = modelSelection.modelId;

  // Step 1: Generate outline
  onSectionProgress?.({ sectionId: '_outline', status: 'generating' });
  const outline = await generateOutline(query, sources, config, modelId);
  onSectionProgress?.({ sectionId: '_outline', status: 'complete' });

  // Step 2: Stream each section with context accumulation
  let fullText = '';
  const previousSummaries: string[] = [];

  // Add attachment context header if needed
  if (attachments?.length) {
    let attachCtx = '---\n📎 ARQUIVOS ANEXADOS:\n\n';
    for (const att of attachments) {
      attachCtx += `### ${att.name} (${att.category})\n`;
      if (att.extractedText) {
        attachCtx += `${att.extractedText.slice(0, 1500)}\n`;
      }
      attachCtx += '\n';
    }
    attachCtx += '---\n\n';
    fullText += attachCtx;
    onTextDelta?.(attachCtx);
  }

  for (let i = 0; i < outline.sections.length; i++) {
    const section = outline.sections[i];
    onSectionProgress?.({ sectionId: section.id, status: 'generating', progress: i / outline.sections.length });

    // Emit section heading
    const heading = `${'#'.repeat(section.headingLevel)} ${section.title}\n\n`;
    fullText += heading;
    onTextDelta?.(heading);

    try {
      // Build context from previous sections
      const previousContext = previousSummaries.length > 0
        ? `Resumo das seções anteriores:\n${previousSummaries.join('\n')}`
        : '';

      const sectionContent = await synthesizeSingleSection(
        section,
        query,
        sources,
        previousContext,
        config,
        modelId,
        onTextDelta,
      );

      fullText += sectionContent + '\n\n';
      onTextDelta?.('\n\n');

      // Accumulate context for next sections
      previousSummaries.push(summarizeSection(section.title, sectionContent));

      onSectionProgress?.({ sectionId: section.id, status: 'complete', progress: (i + 1) / outline.sections.length });
    } catch (error) {
      console.error(`Section "${section.title}" failed:`, error);
      onSectionProgress?.({ sectionId: section.id, status: 'error' });

      const errorNote = `\n> ⚠️ _Erro ao gerar esta seção. O relatório continua com as seções restantes._\n\n`;
      fullText += errorNote;
      onTextDelta?.(errorNote);
    }
  }

  return fullText;
}
