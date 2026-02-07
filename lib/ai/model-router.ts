// lib/ai/model-router.ts — Seleção inteligente de modelos por etapa do pipeline

import { APP_CONFIG, type DepthPreset } from '@/config/defaults';
import { getModelById, type ModelDefinition } from '@/config/models';
import { calculateCost } from '@/config/pricing';
import type { PipelineStageName } from '@/lib/research/types';

export type CostPreference = 'auto' | 'economy' | 'premium' | 'custom';

export interface ModelSelection {
  modelId: string;
  model: ModelDefinition | undefined;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
  fallbackChain: string[];
}

const STAGE_TOKEN_ESTIMATES: Record<
  PipelineStageName,
  { input: number; output: number }
> = {
  decomposition: { input: 500, output: 1200 },
  search: { input: 200, output: 100 },
  evaluation: { input: 15000, output: 1500 },
  extraction: { input: 20000, output: 5000 },
  synthesis: { input: 25000, output: 16000 },
  postProcessing: { input: 2000, output: 500 },
  researchLoop: { input: 10000, output: 2000 },
  devilsAdvocate: { input: 15000, output: 3000 },
};

export function selectModel(
  stage: PipelineStageName,
  preference: CostPreference,
  depth: DepthPreset,
  config: typeof APP_CONFIG = APP_CONFIG,
  customModelMap?: Partial<Record<PipelineStageName, string>>
): ModelSelection {
  const preset = config.depth.presets[depth];
  const tokenEstimates = STAGE_TOKEN_ESTIMATES[stage];

  let modelId: string;
  let fallbackChain: string[];

  if (preference === 'custom' && customModelMap?.[stage]) {
    modelId = customModelMap[stage]!;
    fallbackChain = config.modelRouter.fallbackChains.tier2;
  } else if (preference === 'economy') {
    const economyPrefs = config.modelRouter.preferences.economy;
    modelId =
      (stage in economyPrefs
        ? (economyPrefs as Record<string, string>)[stage]
        : undefined) ?? config.modelRouter.fallbackChains.tier3[0];
    fallbackChain = config.modelRouter.fallbackChains.tier3;
  } else if (preference === 'premium') {
    const premiumPrefs = config.modelRouter.preferences.premium;
    modelId =
      (stage in premiumPrefs
        ? (premiumPrefs as Record<string, string>)[stage]
        : undefined) ?? config.modelRouter.fallbackChains.tier1[0];
    fallbackChain = config.modelRouter.fallbackChains.tier1;
  } else {
    // Auto: use depth preset defaults
    switch (stage) {
      case 'decomposition':
        modelId = preset.decompositionModel;
        fallbackChain = config.modelRouter.fallbackChains.tier2;
        break;
      case 'evaluation':
        modelId = preset.evaluationModel;
        fallbackChain = config.modelRouter.fallbackChains.tier3;
        break;
      case 'synthesis':
        modelId = preset.synthesisModel;
        fallbackChain = config.modelRouter.fallbackChains.tier1;
        break;
      case 'extraction':
        modelId = preset.evaluationModel;
        fallbackChain = config.modelRouter.fallbackChains.tier3;
        break;
      default:
        modelId = 'openai/gpt-4.1-mini';
        fallbackChain = config.modelRouter.fallbackChains.tier2;
    }
  }

  const model = getModelById(modelId);
  const estimatedCostUSD = calculateCost(
    modelId,
    tokenEstimates.input,
    tokenEstimates.output
  );

  return {
    modelId,
    model,
    estimatedInputTokens: tokenEstimates.input,
    estimatedOutputTokens: tokenEstimates.output,
    estimatedCostUSD,
    fallbackChain: fallbackChain.filter((id) => id !== modelId),
  };
}

export function selectAllModels(
  preference: CostPreference,
  depth: DepthPreset,
  config: typeof APP_CONFIG = APP_CONFIG,
  customModelMap?: Partial<Record<PipelineStageName, string>>
): Record<PipelineStageName, ModelSelection> {
  const stages: PipelineStageName[] = [
    'decomposition',
    'search',
    'evaluation',
    'extraction',
    'synthesis',
    'postProcessing',
    'researchLoop',
    'devilsAdvocate',
  ];

  const result = {} as Record<PipelineStageName, ModelSelection>;
  for (const stage of stages) {
    result[stage] = selectModel(stage, preference, depth, config, customModelMap);
  }
  return result;
}
