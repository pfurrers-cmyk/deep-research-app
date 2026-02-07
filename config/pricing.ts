// config/pricing.ts — Funções de cálculo de custo baseadas no catálogo de modelos

import { getModelById } from './models';
import { APP_CONFIG, type DepthPreset } from './defaults';

export const SEARCH_COST_PER_REQUEST = 0.005; // $5/1000 requests (Perplexity & Parallel Search)

export interface StageCostEstimate {
  stage: string;
  modelId: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
}

export interface PipelineCostEstimate {
  depth: DepthPreset;
  stages: StageCostEstimate[];
  searchCostUSD: number;
  totalCostUSD: number;
  breakdown: {
    llmCostUSD: number;
    searchCostUSD: number;
  };
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelById(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1_000_000) * model.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * model.outputPricePer1M;

  return inputCost + outputCost;
}

export function estimateSearchCost(numQueries: number): number {
  return numQueries * SEARCH_COST_PER_REQUEST;
}

export function estimatePipelineCost(
  depth: DepthPreset,
  config: typeof APP_CONFIG = APP_CONFIG
): PipelineCostEstimate {
  const preset = config.depth.presets[depth];
  const stages: StageCostEstimate[] = [];

  // Etapa 1: Decomposição — input ~500 tokens, output ~200 tokens per sub-query
  const decompositionInputTokens = 500;
  const decompositionOutputTokens = preset.subQueries * 200;
  stages.push({
    stage: 'decomposition',
    modelId: preset.decompositionModel,
    estimatedInputTokens: decompositionInputTokens,
    estimatedOutputTokens: decompositionOutputTokens,
    estimatedCostUSD: calculateCost(
      preset.decompositionModel,
      decompositionInputTokens,
      decompositionOutputTokens
    ),
  });

  // Etapa 3: Avaliação — input ~1000 tokens per source, output ~100 tokens per source
  const evalInputTokens = preset.maxSources * 1000;
  const evalOutputTokens = preset.maxSources * 100;
  stages.push({
    stage: 'evaluation',
    modelId: preset.evaluationModel,
    estimatedInputTokens: evalInputTokens,
    estimatedOutputTokens: evalOutputTokens,
    estimatedCostUSD: calculateCost(
      preset.evaluationModel,
      evalInputTokens,
      evalOutputTokens
    ),
  });

  // Etapa 4: Extração (se habilitada) — input ~2000 tokens per source, output ~500 tokens
  if (preset.extractionEnabled) {
    const extractionSources = Math.min(
      config.pipeline.extraction.maxSourcesForExtraction,
      preset.maxSources
    );
    const extractionInputTokens = extractionSources * 2000;
    const extractionOutputTokens = extractionSources * 500;
    const extractionModel = preset.evaluationModel; // Uses same tier
    stages.push({
      stage: 'extraction',
      modelId: extractionModel,
      estimatedInputTokens: extractionInputTokens,
      estimatedOutputTokens: extractionOutputTokens,
      estimatedCostUSD: calculateCost(
        extractionModel,
        extractionInputTokens,
        extractionOutputTokens
      ),
    });
  }

  // Etapa 5: Síntese — input = all sources context, output = report
  const synthesisInputTokens = preset.maxSources * 1500 + 1000;
  const synthesisOutputTokens = 16000; // Estimativa para cálculo de custo — sem limite real no runtime
  stages.push({
    stage: 'synthesis',
    modelId: preset.synthesisModel,
    estimatedInputTokens: synthesisInputTokens,
    estimatedOutputTokens: synthesisOutputTokens,
    estimatedCostUSD: calculateCost(
      preset.synthesisModel,
      synthesisInputTokens,
      synthesisOutputTokens
    ),
  });

  // Custo de busca
  const searchCostUSD = estimateSearchCost(preset.subQueries);

  // Total
  const llmCostUSD = stages.reduce((sum, s) => sum + s.estimatedCostUSD, 0);
  const totalCostUSD = llmCostUSD + searchCostUSD;

  return {
    depth,
    stages,
    searchCostUSD,
    totalCostUSD,
    breakdown: {
      llmCostUSD,
      searchCostUSD,
    },
  };
}

export function formatCostUSD(cost: number): string {
  if (cost < 0.01) return `<$0.01`;
  return `$${cost.toFixed(2)}`;
}
