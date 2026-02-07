// lib/research/synthesizer.ts — Geração do relatório via streamText
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModel } from '@/lib/ai/model-router';
import { buildSynthesisPrompt } from '@/lib/ai/prompts/synthesis';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type { EvaluatedSource } from '@/lib/research/types';

export async function synthesizeReport(
  query: string,
  sources: EvaluatedSource[],
  depth: DepthPreset,
  config: AppConfig,
  onTextDelta?: (delta: string) => void
): Promise<string> {
  const modelSelection = selectModel('synthesis', 'auto', depth, config);
  const { system, prompt } = buildSynthesisPrompt(query, sources, config);

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
