// lib/research/pipeline.ts — Orquestrador principal do pipeline de pesquisa
import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModel } from '@/lib/ai/model-router';
import { createCostTracker } from '@/lib/ai/cost-estimator';
import { getEffectiveConfig } from '@/lib/config/config-resolver';
import {
  decompositionSchema,
  buildDecompositionPrompt,
} from '@/lib/ai/prompts/query-decomposition';
import { executeSearch } from '@/lib/research/search';
import { evaluateSources } from '@/lib/research/evaluator';
import { synthesizeReport } from '@/lib/research/synthesizer';
import { createSSEStream, type SSEWriter } from '@/lib/utils/streaming';
import { debug } from '@/lib/utils/debug-logger';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type {
  ResearchRequest,
  SubQuery,
  SearchResult,
  EvaluatedSource,
  ResearchMetadata,
  PipelineEvent,
  DeepPartial,
} from '@/lib/research/types';

function generateId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function emitStage(
  writer: SSEWriter,
  stage: string,
  status: 'running' | 'completed' | 'error',
  progress: number,
  config: AppConfig
) {
  const message =
    (config.strings.stages as Record<string, string>)[stage] ?? stage;
  writer.writeEvent({
    type: 'stage',
    stage,
    status,
    progress,
    message,
  });
}

export function executePipeline(
  request: ResearchRequest
): { stream: ReadableStream; researchId: string } {
  const researchId = generateId();
  const config = getEffectiveConfig(
    undefined,
    request.configOverrides as DeepPartial<AppConfig> | undefined
  );
  const depth = request.depth;
  const preset = config.depth.presets[depth];
  const costTracker = createCostTracker();
  const startTime = Date.now();

  debug.info('Pipeline', `Pesquisa iniciada: "${request.query.slice(0, 80)}"`, { depth, researchId });

  const { stream, writer } = createSSEStream();

  // Run pipeline async — don't await, let it stream
  runPipeline(writer, request, config, depth, preset, costTracker, researchId, startTime).catch(
    (error) => {
      debug.error('Pipeline', `Erro fatal no pipeline: ${error instanceof Error ? error.message : String(error)}`);
      writer.writeEvent({
        type: 'error',
        error: {
          code: 'PIPELINE_FATAL',
          message: error instanceof Error ? error.message : config.strings.errors.generic,
          recoverable: false,
        },
      });
      writer.close();
    }
  );

  return { stream, researchId };
}

async function runPipeline(
  writer: SSEWriter,
  request: ResearchRequest,
  config: AppConfig,
  depth: DepthPreset,
  preset: AppConfig['depth']['presets'][DepthPreset],
  costTracker: ReturnType<typeof createCostTracker>,
  researchId: string,
  startTime: number
) {
  const modelsUsed: string[] = [];

  // Source limits (manual override or preset defaults)
  const maxSourcesFetch = request.sourceConfig?.fetchMax ?? preset.maxSources;
  const maxSourcesKeep = request.sourceConfig?.keepMax ?? config.pipeline.evaluation.maxSourcesToKeep;
  const minSourcesKeep = request.sourceConfig?.keepMin ?? 1;

  // =========================================================
  // ETAPA 1: Decomposição da Query
  // =========================================================
  emitStage(writer, 'decomposing', 'running', 0.05, config);

  let subQueries: SubQuery[];
  try {
    const decompositionModel = selectModel(
      'decomposition',
      request.modelPreference,
      depth,
      config,
      request.customModelMap
    );
    modelsUsed.push(decompositionModel.modelId);
    debug.info('Pipeline', `Decomposição: modelo=${decompositionModel.modelId}`);
    const stageStart = Date.now();

    const { system, prompt } = buildDecompositionPrompt(
      request.query,
      config,
      request.customPrompts?.decomposition
    );

    const { object } = await generateObject({
      model: gateway(decompositionModel.modelId),
      schema: decompositionSchema,
      system,
      prompt,
      abortSignal: AbortSignal.timeout(
        config.resilience.timeoutPerStageMs.decomposition
      ),
    });

    subQueries = object.subQueries
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      })
      .slice(0, preset.subQueries)
      .map((sq, i) => ({
        id: `sq_${i}`,
        text: sq.text,
        textEn: sq.textEn,
        justification: sq.justification,
        language: sq.language,
        priority: sq.priority,
        angle: sq.angle,
        searchTerms: sq.searchTerms,
        searchTermsPt: sq.searchTermsPt,
        expectedSourceType: sq.expectedSourceType,
        status: 'pending' as const,
      }));

    costTracker.addEntry(
      'decomposition',
      decompositionModel.modelId,
      decompositionModel.estimatedInputTokens,
      decompositionModel.estimatedOutputTokens
    );

    debug.timed('Pipeline', `Decomposição concluída: ${subQueries.length} sub-queries`, stageStart);
    writer.writeEvent({ type: 'queries', data: subQueries });
    emitStage(writer, 'decomposing', 'completed', 0.15, config);
  } catch (error) {
    debug.error('Pipeline', `Decomposição falhou: ${error instanceof Error ? error.message : String(error)}`);
    emitStage(writer, 'decomposing', 'error', 0.15, config);
    writer.writeEvent({
      type: 'error',
      error: {
        code: 'DECOMPOSITION_FAILED',
        message: error instanceof Error ? error.message : config.strings.errors.generic,
        stage: 'decomposing',
        recoverable: false,
      },
    });
    writer.close();
    return;
  }

  // =========================================================
  // ETAPA 2: Busca Paralela
  // =========================================================
  emitStage(writer, 'searching', 'running', 0.2, config);

  let searchResults: SearchResult[];
  try {
    // Resolve domain filters from preset
    let domainFilters: string[] | undefined;
    let languageFilters: string[] | undefined;

    if (request.domainPreset && request.domainPreset in config.domainPresets) {
      const domainConfig =
        config.domainPresets[request.domainPreset as keyof typeof config.domainPresets];
      if (domainConfig && typeof domainConfig === 'object' && 'searchDomainFilter' in domainConfig) {
        domainFilters = (domainConfig as { searchDomainFilter: string[] }).searchDomainFilter;
        languageFilters = (domainConfig as { searchLanguageFilter: string[] }).searchLanguageFilter;
      }
    }

    const searchStart = Date.now();
    searchResults = await executeSearch(
      subQueries,
      config,
      (source) => {
        writer.writeEvent({
          type: 'source',
          data: {
            url: source.url,
            title: source.title,
            relevance: 0,
            credibility: 0,
            subQueryId: source.subQueryId,
          },
        });
      },
      domainFilters,
      languageFilters
    );

    // Enforce fetch limits from sourceConfig
    if (searchResults.length > maxSourcesFetch) {
      debug.info('Pipeline', `Limitando fontes buscadas: ${searchResults.length} → ${maxSourcesFetch}`);
      searchResults = searchResults.slice(0, maxSourcesFetch);
    }

    costTracker.addSearchCost(subQueries.length);
    debug.timed('Pipeline', `Busca concluída: ${searchResults.length} resultados de ${subQueries.length} sub-queries`, searchStart);
    emitStage(writer, 'searching', 'completed', 0.4, config);
  } catch (error) {
    debug.error('Pipeline', `Busca falhou: ${error instanceof Error ? error.message : String(error)}`);
    emitStage(writer, 'searching', 'error', 0.4, config);
    writer.writeEvent({
      type: 'error',
      error: {
        code: 'SEARCH_FAILED',
        message: config.strings.errors.searchFailed.replace('{n}', String(subQueries.length)),
        stage: 'searching',
        recoverable: false,
      },
    });
    writer.close();
    return;
  }

  if (searchResults.length === 0) {
    debug.warn('Pipeline', 'Nenhum resultado encontrado para as sub-queries');
    writer.writeEvent({
      type: 'error',
      error: {
        code: 'NO_RESULTS',
        message: 'Nenhum resultado encontrado para as sub-queries geradas.',
        stage: 'searching',
        recoverable: false,
      },
    });
    writer.close();
    return;
  }

  // =========================================================
  // ETAPA 3: Avaliação e Ranking
  // =========================================================
  emitStage(writer, 'evaluating', 'running', 0.45, config);

  let evaluatedSources: EvaluatedSource[];
  try {
    const evaluationModel = selectModel(
      'evaluation',
      request.modelPreference,
      depth,
      config,
      request.customModelMap
    );
    modelsUsed.push(evaluationModel.modelId);
    debug.info('Pipeline', `Avaliação: modelo=${evaluationModel.modelId}, fontes=${searchResults.length}`);
    const evalStart = Date.now();

    evaluatedSources = await evaluateSources(request.query, searchResults, config);

    costTracker.addEntry(
      'evaluation',
      evaluationModel.modelId,
      evaluationModel.estimatedInputTokens,
      evaluationModel.estimatedOutputTokens
    );

    // Enforce keepMin/keepMax from sourceConfig
    if (evaluatedSources.length > maxSourcesKeep) {
      evaluatedSources = evaluatedSources.slice(0, maxSourcesKeep);
    }
    if (evaluatedSources.length < minSourcesKeep && searchResults.length > 0) {
      // If we don't have enough kept sources, relax threshold and re-include top sources
      const allSorted = searchResults
        .map((s) => evaluatedSources.find((e) => e.url === s.url) ?? s)
        .slice(0, minSourcesKeep);
      if (allSorted.length > evaluatedSources.length) {
        debug.info('Pipeline', `Fontes insuficientes (${evaluatedSources.length}), expandindo para mínimo ${minSourcesKeep}`);
      }
    }

    writer.writeEvent({
      type: 'evaluation',
      data: {
        totalFound: searchResults.length,
        kept: evaluatedSources.length,
        filtered: searchResults.length - evaluatedSources.length,
      },
    });

    debug.timed('Pipeline', `Avaliação concluída: ${evaluatedSources.length}/${searchResults.length} fontes mantidas (limites: ${minSourcesKeep}-${maxSourcesKeep})`, evalStart);
    emitStage(writer, 'evaluating', 'completed', 0.55, config);
  } catch (error) {
    debug.warn('Pipeline', `Avaliação falhou, usando fontes brutas: ${error instanceof Error ? error.message : String(error)}`);
    // Fallback: use raw sources without evaluation
    evaluatedSources = searchResults.map((s) => ({
      ...s,
      relevanceScore: 0.5,
      recencyScore: 0.5,
      authorityScore: 0.5,
      weightedScore: 0.5,
      credibilityScore: 0.5,
      credibilityTier: 'medium' as const,
      flagged: false,
      kept: true,
    }));
    emitStage(writer, 'evaluating', 'completed', 0.55, config);
  }

  // =========================================================
  // ETAPA 4: Extração Profunda (se habilitada)
  // =========================================================
  if (preset.extractionEnabled) {
    emitStage(writer, 'extracting', 'running', 0.6, config);
    // For now, we use the content already obtained from search.
    // Full extraction with secondary requests will be enhanced in Fase 4.
    emitStage(writer, 'extracting', 'completed', 0.65, config);
  }

  // =========================================================
  // ETAPA 5: Síntese do Relatório (STREAMING)
  // =========================================================
  emitStage(writer, 'synthesizing', 'running', 0.7, config);

  let reportText = '';
  try {
    const synthesisModel = selectModel(
      'synthesis',
      request.modelPreference,
      depth,
      config,
      request.customModelMap
    );
    modelsUsed.push(synthesisModel.modelId);
    debug.info('Pipeline', `Síntese: modelo=${synthesisModel.modelId}, fontes=${evaluatedSources.length}`);
    const synthStart = Date.now();

    reportText = await synthesizeReport(
      request.query,
      evaluatedSources,
      depth,
      config,
      (delta) => {
        writer.writeEvent({ type: 'text-delta', text: delta });
      }
    );

    costTracker.addEntry(
      'synthesis',
      synthesisModel.modelId,
      synthesisModel.estimatedInputTokens,
      synthesisModel.estimatedOutputTokens
    );

    debug.timed('Pipeline', `Síntese concluída: ${reportText.length} caracteres`, synthStart);
    emitStage(writer, 'synthesizing', 'completed', 0.9, config);
  } catch (error) {
    debug.error('Pipeline', `Síntese falhou: ${error instanceof Error ? error.message : String(error)}`);
    emitStage(writer, 'synthesizing', 'error', 0.9, config);
    writer.writeEvent({
      type: 'error',
      error: {
        code: 'SYNTHESIS_FAILED',
        message: error instanceof Error ? error.message : config.strings.errors.generic,
        stage: 'synthesizing',
        recoverable: false,
      },
    });
    writer.close();
    return;
  }

  // =========================================================
  // ETAPA 6: Pós-processamento
  // =========================================================
  emitStage(writer, 'post-processing', 'running', 0.92, config);

  const durationMs = Date.now() - startTime;
  const costBreakdown = costTracker.getBreakdown();

  const metadata: ResearchMetadata = {
    id: researchId,
    query: request.query,
    title: request.query.slice(0, 100),
    depth: depth,
    domainPreset: request.domainPreset,
    modelPreference: request.modelPreference,
    totalSources: searchResults.length,
    totalSourcesKept: evaluatedSources.length,
    totalSourcesFiltered: searchResults.length - evaluatedSources.length,
    durationMs,
    modelsUsed: [...new Set(modelsUsed)],
    createdAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    pipelineVersion: '1.0.0',
  };

  writer.writeEvent({ type: 'metadata', data: metadata });

  writer.writeEvent({
    type: 'cost',
    data: {
      stage: 'synthesis',
      modelId: 'total',
      inputTokens: 0,
      outputTokens: 0,
      costUSD: costBreakdown.totalCostUSD,
      timestamp: new Date().toISOString(),
    },
  });

  emitStage(writer, 'post-processing', 'completed', 0.98, config);
  emitStage(writer, 'complete', 'completed', 1.0, config);

  // Complete event with full response
  writer.writeEvent({
    type: 'complete',
    data: {
      id: researchId,
      query: request.query,
      report: {
        title: metadata.title,
        sections: [
          {
            id: 'full-report',
            type: 'executive_summary',
            title: 'Relatório Completo',
            content: reportText,
            confidenceScore: 0.7,
            sourceIndices: evaluatedSources.map((_, i) => i),
          },
        ],
        citations: evaluatedSources.map((s, i) => ({
          index: i + 1,
          url: s.url,
          title: s.title,
          snippet: s.snippet,
          domain: new URL(s.url).hostname,
          credibilityScore: s.credibilityScore,
          credibilityTier: s.credibilityTier,
          publishedDate: s.publishedDate,
          author: s.author,
        })),
        generatedAt: metadata.completedAt,
        modelUsed: modelsUsed[modelsUsed.length - 1] ?? 'unknown',
        outputLanguage: config.pipeline.synthesis.outputLanguage,
      },
      sources: evaluatedSources,
      subQueries: subQueries.map((sq) => ({
        ...sq,
        status: 'completed' as const,
      })),
      metadata,
      confidence: {
        overall: 0.7,
        bySection: {},
        level: 'medium',
        suggestions: [],
      },
      cost: costBreakdown,
    },
  });

  debug.timed('Pipeline', `Pesquisa finalizada: ${evaluatedSources.length} fontes, ${reportText.length} chars, custo=$${costBreakdown.totalCostUSD.toFixed(4)}`, startTime);
  writer.close();
}
