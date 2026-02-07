// lib/research/map-reduce.ts — Extended mode: Map-Reduce processing for large source sets
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModel } from '@/lib/ai/model-router';
import { chunkArray } from '@/lib/utils/array-utils';
import {
  MAP_SYSTEM_PROMPT,
  REDUCE_SYSTEM_PROMPT,
  formatBatchForMap,
  formatSummariesForReduce,
} from '@/lib/ai/prompts/pipeline-prompts';
import { createCostTracker } from '@/lib/ai/cost-estimator';
import { debug } from '@/lib/utils/debug-logger';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type { EvaluatedSource } from '@/lib/research/types';
import type { SSEWriter } from '@/lib/utils/streaming';

export interface MapReduceOptions {
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
 * Run Map-Reduce research pipeline.
 * MAP: Split sources into batches, process each in parallel to produce summaries.
 * REDUCE: Combine all summaries into a single coherent report.
 */
export async function runMapReduceResearch(
  opts: MapReduceOptions,
): Promise<{ reportText: string; summaries: string[]; modelsUsed: string[] }> {
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

  const modelsUsed: string[] = [];

  // ─── MAP PHASE ───
  const batches = chunkArray(sources, batchSize);
  debug.info('MapReduce', `MAP: ${sources.length} fontes → ${batches.length} batches de ~${batchSize}`);

  const mapModel = selectModel(
    'mapBatch',
    modelPreference,
    depth,
    config,
    customModelMap as Record<string, string> | undefined,
  );
  modelsUsed.push(mapModel.modelId);

  const summaries: string[] = [];
  const mapPromises = batches.map(async (batch, i) => {
    emitStage(writer, `map-batch`, 'running', 0.55 + (i / batches.length) * 0.15, config);
    writer.writeEvent({
      type: 'stage',
      stage: 'map-batch',
      status: 'running',
      progress: 0.55 + (i / batches.length) * 0.15,
      message: `MAP: Batch ${i + 1}/${batches.length}...`,
    });

    const prompt = formatBatchForMap(batch, i, batches.length, query);

    try {
      const { text } = await generateText({
        model: gateway(mapModel.modelId),
        system: MAP_SYSTEM_PROMPT,
        prompt,
        abortSignal: AbortSignal.timeout(config.resilience.timeoutPerStageMs.synthesis),
      });

      costTracker.addEntry(
        'mapBatch',
        mapModel.modelId,
        mapModel.estimatedInputTokens,
        mapModel.estimatedOutputTokens,
      );

      debug.info('MapReduce', `MAP batch ${i + 1}/${batches.length} concluído: ${text.length} chars`);
      return text;
    } catch (error) {
      debug.error('MapReduce', `MAP batch ${i + 1} falhou: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: use raw content snippets
      return batch
        .map((s, j) => `### Fonte ${i * batchSize + j + 1}: ${s.title}\n${s.snippet?.slice(0, 500) ?? 'Sem conteúdo'}`)
        .join('\n\n');
    }
  });

  // Run MAP batches in parallel
  const mapResults = await Promise.all(mapPromises);
  summaries.push(...mapResults);

  emitStage(writer, 'map-batch', 'completed', 0.72, config);

  // ─── REDUCE PHASE ───
  emitStage(writer, 'reduce', 'running', 0.73, config);
  writer.writeEvent({
    type: 'stage',
    stage: 'reduce',
    status: 'running',
    progress: 0.73,
    message: 'REDUCE: Sintetizando resumos...',
  });

  const reduceModel = selectModel(
    'reduce',
    modelPreference,
    depth,
    config,
    customModelMap as Record<string, string> | undefined,
  );
  modelsUsed.push(reduceModel.modelId);

  const reducePrompt = formatSummariesForReduce(summaries, query, sources.length);
  let reportText = '';

  try {
    const { text } = await generateText({
      model: gateway(reduceModel.modelId),
      system: REDUCE_SYSTEM_PROMPT,
      prompt: reducePrompt,
      abortSignal: AbortSignal.timeout(config.resilience.timeoutPerStageMs.synthesis * 1.5),
    });

    reportText = text;

    costTracker.addEntry(
      'reduce',
      reduceModel.modelId,
      reduceModel.estimatedInputTokens,
      reduceModel.estimatedOutputTokens,
    );

    // Stream the reduce output
    if (onTextDelta) {
      onTextDelta(reportText);
    }

    debug.info('MapReduce', `REDUCE concluído: ${reportText.length} chars`);
  } catch (error) {
    debug.error('MapReduce', `REDUCE falhou: ${error instanceof Error ? error.message : String(error)}`);
    // Fallback: concatenate summaries
    reportText = summaries.join('\n\n---\n\n');
    if (onTextDelta) {
      onTextDelta(reportText);
    }
  }

  emitStage(writer, 'reduce', 'completed', 0.85, config);

  return { reportText, summaries, modelsUsed };
}
