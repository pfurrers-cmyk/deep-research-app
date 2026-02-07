// lib/research/synthesizer.ts — Geração do relatório via streamText
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModel } from '@/lib/ai/model-router';
import { buildSynthesisPrompt } from '@/lib/ai/prompts/synthesis';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type { EvaluatedSource, ResearchAttachment } from '@/lib/research/types';
import { loadPreferences } from '@/lib/config/settings-store';
import { getSafetyProviderOptions } from '@/config/safety-settings';

export async function synthesizeReport(
  query: string,
  sources: EvaluatedSource[],
  depth: DepthPreset,
  config: AppConfig,
  onTextDelta?: (delta: string) => void,
  attachments?: ResearchAttachment[]
): Promise<string> {
  const prefs = loadPreferences();
  const modelSelection = selectModel('synthesis', 'auto', depth, config);
  const { system, prompt: basePrompt } = buildSynthesisPrompt(query, sources, config, undefined, prefs.pro);

  // Inject attachment context into the prompt
  let prompt = basePrompt;
  if (attachments?.length) {
    let attachCtx = '\n\n---\n📎 ARQUIVOS ANEXADOS PELO USUÁRIO:\n\n';
    for (const att of attachments) {
      attachCtx += `### ${att.name} (${att.category}, ${(att.size / 1024).toFixed(0)} KB)\n`;
      if (att.extractedText) {
        const truncated = att.extractedText.slice(0, 3000);
        attachCtx += `**Conteúdo extraído:**\n\`\`\`\n${truncated}\n\`\`\`\n`;
        if (att.extractedText.length > 3000) {
          attachCtx += `_(texto truncado — ${att.metadata?.wordCount ?? '?'} palavras no total)_\n`;
        }
      }
      if (att.extractedData) {
        if (att.extractedData.columns) attachCtx += `Colunas: ${att.extractedData.columns.join(', ')}\n`;
        if (att.extractedData.totalRows) attachCtx += `Total de registros: ${att.extractedData.totalRows}\n`;
      }
      if (att.category === 'image' && att.metadata) {
        attachCtx += `**Dimensões:** ${att.metadata.width}x${att.metadata.height}\n`;
      }
      attachCtx += '\n';
    }
    attachCtx += '---\nINSTRUÇÕES: Use o conteúdo dos arquivos acima para contextualizar e enriquecer a pesquisa. Cruze dados dos anexos com fontes encontradas na web quando relevante.\n';
    prompt += attachCtx;
  }

  let fullText = '';
  let currentModelId = modelSelection.modelId;
  const fallbackChain = [modelSelection.modelId, ...modelSelection.fallbackChain];

  for (const modelId of fallbackChain) {
    try {
      currentModelId = modelId;
      const result = streamText({
        model: gateway(modelId),
        system,
        prompt,
        maxOutputTokens: config.pipeline.synthesis.maxOutputTokens,
        abortSignal: AbortSignal.timeout(
          config.resilience.timeoutPerStageMs.synthesis
        ),
        providerOptions: getSafetyProviderOptions(modelId) as never,
      });

      for await (const delta of result.textStream) {
        fullText += delta;
        onTextDelta?.(delta);
      }

      return fullText;
    } catch (error) {
      console.error(
        `Synthesis failed with model ${modelId}, trying next fallback...`,
        error
      );
      fullText = '';
      if (modelId === fallbackChain[fallbackChain.length - 1]) {
        throw new Error(
          `Synthesis failed with all models in fallback chain: ${fallbackChain.join(', ')}`
        );
      }
    }
  }

  return fullText;
}

export function getUsedModelId(
  depth: DepthPreset,
  config: AppConfig
): string {
  const modelSelection = selectModel('synthesis', 'auto', depth, config);
  return modelSelection.modelId;
}
