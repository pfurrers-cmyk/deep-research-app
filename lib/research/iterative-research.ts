// lib/research/iterative-research.ts — Ultra mode: Iterative Refinement + Verification
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModel } from '@/lib/ai/model-router';
import { chunkArray } from '@/lib/utils/array-utils';
import {
  ENRICH_SYSTEM_PROMPT,
  VERIFICATION_SYSTEM_PROMPT,
  formatEnrichment,
  formatVerification,
} from '@/lib/ai/prompts/pipeline-prompts';
import { runMapReduceResearch, type MapReduceOptions } from '@/lib/research/map-reduce';
import { createCostTracker } from '@/lib/ai/cost-estimator';
import { debug } from '@/lib/utils/debug-logger';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type { EvaluatedSource } from '@/lib/research/types';
import type { SSEWriter } from '@/lib/utils/streaming';
import { getSafetyProviderOptions } from '@/config/safety-settings';

export interface IterativeResearchOptions {
  query: string;
  sources: EvaluatedSource[];
  batchSize: number;
  depth: DepthPreset;
  config: AppConfig;
  writer: SSEWriter;
  costTracker: ReturnType<typeof createCostTracker>;
  modelPreference: 'auto' | 'economy' | 'premium' | 'custom';
  customModelMap?: Partial<Record<string, string>>;
  onTextDelta?: (delta: string) => void;
}

function emitStage(
  writer: SSEWriter,
  stage: string,
  status: 'running' | 'completed' | 'error',
  progress: number,
  config: AppConfig,
) {
  const message =
    (config.strings.stages as Record<string, string>)[stage] ?? stage;
  writer.writeEvent({ type: 'stage', stage, status, progress, message });
}

/**
 * Run Iterative Research pipeline (Ultra mode).
 * 1. Map-Reduce with ~60% of sources → partial report
 * 2. Enrichment rounds with remaining sources
 * 3. Mandatory cross-verification
 */
export async function runIterativeResearch(
  opts: IterativeResearchOptions,
): Promise<{ reportText: string; modelsUsed: string[] }> {
  const {
    query,
    sources,
    batchSize,
    depth,
    config,
    writer,
    costTracker,
    modelPreference,
    customModelMap,
    onTextDelta,
  } = opts;

  const allModelsUsed: string[] = [];

  // ─── STEP 1: Map-Reduce with ~60% of sources ───
  const firstRoundCount = Math.ceil(sources.length * 0.6);
  const firstRoundSources = sources.slice(0, firstRoundCount);
  const remainingSources = sources.slice(firstRoundCount);

  debug.info('Iterative', `Fase 1: Map-Reduce com ${firstRoundSources.length}/${sources.length} fontes`);

  const mrOpts: MapReduceOptions = {
    query,
    sources: firstRoundSources,
    batchSize,
    depth,
    config,
    writer,
    costTracker,
    modelPreference,
    customModelMap,
    // Don't stream text delta during Map-Reduce — we'll stream after verification
  };

  const { reportText: partialReport, summaries, modelsUsed: mrModels } =
    await runMapReduceResearch(mrOpts);
  allModelsUsed.push(...mrModels);

  // ─── STEP 2: Enrichment rounds with remaining sources ───
  if (remainingSources.length > 0) {
    emitStage(writer, 'enrich', 'running', 0.86, config);

    const enrichModel = selectModel(
      'enrich',
      modelPreference,
      depth,
      config,
      customModelMap as Record<string, string> | undefined,
    );
    allModelsUsed.push(enrichModel.modelId);

    const enrichBatches = chunkArray(remainingSources, batchSize);
    let enrichedReport = partialReport;

    for (let i = 0; i < enrichBatches.length; i++) {
      const batch = enrichBatches[i];
      debug.info('Iterative', `Enriquecimento: batch ${i + 1}/${enrichBatches.length} (${batch.length} fontes)`);

      writer.writeEvent({
        type: 'stage',
        stage: 'enrich',
        status: 'running',
        progress: 0.86 + (i / enrichBatches.length) * 0.06,
        message: `Enriquecimento: ${i + 1}/${enrichBatches.length}...`,
      });

      try {
        const prompt = formatEnrichment(enrichedReport, batch, query);

        const { text } = await generateText({
          model: gateway(enrichModel.modelId),
          system: ENRICH_SYSTEM_PROMPT,
          prompt,
          abortSignal: AbortSignal.timeout(config.resilience.timeoutPerStageMs.synthesis * 1.5),
          providerOptions: getSafetyProviderOptions(enrichModel.modelId) as never,
        });

        enrichedReport = text;

        costTracker.addEntry(
          'enrich',
          enrichModel.modelId,
          enrichModel.estimatedInputTokens,
          enrichModel.estimatedOutputTokens,
        );

        debug.info('Iterative', `Enriquecimento batch ${i + 1} concluído: ${text.length} chars`);
      } catch (error) {
        debug.error('Iterative', `Enriquecimento batch ${i + 1} falhou: ${error instanceof Error ? error.message : String(error)}`);
        // Keep the current enriched report, skip this batch
      }
    }

    emitStage(writer, 'enrich', 'completed', 0.92, config);

    // ─── STEP 3: Mandatory cross-verification ───
    emitStage(writer, 'verify', 'running', 0.92, config);
    writer.writeEvent({
      type: 'stage',
      stage: 'verify',
      status: 'running',
      progress: 0.92,
      message: 'Verificação cruzada obrigatória...',
    });

    const verifyModel = selectModel(
      'verify',
      modelPreference,
      depth,
      config,
      customModelMap as Record<string, string> | undefined,
    );
    allModelsUsed.push(verifyModel.modelId);

    try {
      const verifyPrompt = formatVerification(enrichedReport, summaries);

      const { text: verifiedReport } = await generateText({
        model: gateway(verifyModel.modelId),
        system: VERIFICATION_SYSTEM_PROMPT,
        prompt: verifyPrompt,
        abortSignal: AbortSignal.timeout(config.resilience.timeoutPerStageMs.synthesis * 2),
        providerOptions: getSafetyProviderOptions(verifyModel.modelId) as never,
      });

      costTracker.addEntry(
        'verify',
        verifyModel.modelId,
        verifyModel.estimatedInputTokens,
        verifyModel.estimatedOutputTokens,
      );

      // Stream verified report
      if (onTextDelta) {
        onTextDelta(verifiedReport);
      }

      debug.info('Iterative', `Verificação concluída: ${verifiedReport.length} chars`);
      emitStage(writer, 'verify', 'completed', 0.98, config);

      return { reportText: verifiedReport, modelsUsed: allModelsUsed };
    } catch (error) {
      debug.error('Iterative', `Verificação falhou: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: use enriched report without verification
      if (onTextDelta) {
        onTextDelta(enrichedReport);
      }
      emitStage(writer, 'verify', 'error', 0.98, config);
      return { reportText: enrichedReport, modelsUsed: allModelsUsed };
    }
  } else {
    // No remaining sources — just stream partial report
    if (onTextDelta) {
      onTextDelta(partialReport);
    }
    return { reportText: partialReport, modelsUsed: allModelsUsed };
  }
}
