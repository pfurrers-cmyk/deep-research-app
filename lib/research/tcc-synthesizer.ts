// lib/research/tcc-synthesizer.ts — TCC-specific multi-section synthesizer
// Uses specialized prompts per section type instead of generic outline.
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModel } from '@/lib/ai/model-router';
import { buildTccSections, extractTccConfig, type TccSectionDef, type TccPromptContext } from '@/lib/ai/prompts/tcc-sections';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type { EvaluatedSource, ResearchAttachment } from '@/lib/research/types';
import { loadPreferences } from '@/lib/config/settings-store';
import { getSafetyProviderOptions } from '@/config/safety-settings';
import type { SectionProgress } from '@/lib/research/section-synthesizer';

// ============================================================
// TCC SYNTHESIZER
// ============================================================

/**
 * Main TCC synthesis function.
 * Generates each TCC section using specialized prompts with ABNT structure.
 */
export async function synthesizeTcc(
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
  const tccConfig = extractTccConfig(prefs);

  // Build TCC section definitions
  const sections = buildTccSections(tccConfig);

  let fullText = '';
  const previousSections: string[] = [];

  // Add attachment context if needed
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

  // Generate each section sequentially
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    onSectionProgress?.({
      sectionId: section.id,
      status: 'generating',
      progress: i / sections.length,
    });

    // Emit section heading
    const heading = `${'#'.repeat(section.headingLevel)} ${section.title}\n\n`;
    fullText += heading;
    onTextDelta?.(heading);

    try {
      const ctx: TccPromptContext = {
        query,
        tcc: tccConfig,
        sources,
        previousSections,
        totalSources: sources.length,
      };

      const { system, prompt } = section.promptBuilder(ctx);

      const sectionContent = await streamTccSection(
        system,
        prompt,
        modelId,
        config,
        onTextDelta,
      );

      fullText += sectionContent + '\n\n';
      onTextDelta?.('\n\n');

      // Store section content for context in subsequent sections
      // Keep compact summary for textual sections, full for pretextual
      if (section.type === 'pretextual') {
        previousSections.push(`[${section.title}]: ${sectionContent.slice(0, 800)}`);
      } else {
        previousSections.push(`[${section.title}]: ${sectionContent.slice(0, 1500)}`);
      }

      onSectionProgress?.({
        sectionId: section.id,
        status: 'complete',
        progress: (i + 1) / sections.length,
      });
    } catch (error) {
      console.error(`TCC section "${section.title}" failed:`, error);
      onSectionProgress?.({ sectionId: section.id, status: 'error' });

      const errorNote = `\n> ⚠️ _Erro ao gerar a seção "${section.title}". O documento continua com as seções restantes._\n\n`;
      fullText += errorNote;
      onTextDelta?.(errorNote);
    }
  }

  return fullText;
}

/**
 * Stream a single TCC section with its specialized prompt.
 */
async function streamTccSection(
  system: string,
  prompt: string,
  modelId: string,
  config: AppConfig,
  onTextDelta?: (delta: string) => void,
): Promise<string> {
  let sectionText = '';

  const result = streamText({
    model: gateway(modelId),
    system,
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
    const warning = '\n\n> ⚠️ _Esta seção foi truncada pelo limite de tokens do modelo. Considere um modelo com maior capacidade._\n';
    sectionText += warning;
    onTextDelta?.(warning);
  }

  return sectionText;
}
