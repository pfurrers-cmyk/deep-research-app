// lib/research/evaluator.ts — Avaliação de relevância e ranking de fontes
import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModel } from '@/lib/ai/model-router';
import {
  evaluationSchema,
  buildEvaluationPrompt,
} from '@/lib/ai/prompts/relevance-evaluation';
import type { AppConfig } from '@/config/defaults';
import type { SearchResult, EvaluatedSource } from '@/lib/research/types';
import { getSafetyProviderOptions } from '@/config/safety-settings';

function getCredibilityTier(
  url: string,
  config: AppConfig
): { score: number; tier: 'high' | 'medium' | 'low' } {
  const { domainTiers } = config.sourceCredibility;

  for (const suffix of domainTiers.high) {
    if (url.includes(suffix)) return { score: 0.9, tier: 'high' };
  }
  for (const suffix of domainTiers.medium) {
    if (url.includes(suffix)) return { score: 0.65, tier: 'medium' };
  }
  return { score: 0.4, tier: 'low' };
}

function applyCredibilityBonuses(
  source: SearchResult,
  baseScore: number,
  config: AppConfig
): number {
  const { bonuses } = config.sourceCredibility;
  let score = baseScore;

  if (source.author) {
    score += bonuses.hasIdentifiableAuthor;
  }
  if (source.publishedDate) {
    score += bonuses.publishedDatePresent;
    const pubDate = new Date(source.publishedDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (pubDate > oneYearAgo) {
      score += bonuses.recentPublication;
    }
  }

  return Math.min(score, 1.0);
}

export async function evaluateSources(
  query: string,
  sources: SearchResult[],
  config: AppConfig
): Promise<EvaluatedSource[]> {
  const { evaluation } = config.pipeline;

  if (sources.length === 0) return [];

  const modelSelection = selectModel('evaluation', 'auto', 'normal', config);

  const batchSize = evaluation.evaluationBatchSize;
  const batches: SearchResult[][] = [];
  for (let i = 0; i < sources.length; i += batchSize) {
    batches.push(sources.slice(i, i + batchSize));
  }

  const allEvaluations: Array<{
    url: string;
    rationale: string;
    relevanceScore: number;
    recencyScore: number;
    authorityScore: number;
    biasScore: number;
    sourceTier: 'primary' | 'secondary' | 'tertiary';
    contradicts?: string;
  }> = [];

  for (const batch of batches) {
    try {
      const { system, prompt } = buildEvaluationPrompt(query, batch, config);

      const { object } = await generateObject({
        model: gateway(modelSelection.modelId),
        schema: evaluationSchema,
        system,
        prompt,
        providerOptions: getSafetyProviderOptions(modelSelection.modelId) as never,
      });

      if (object.diversityWarning) {
        console.warn('[Evaluator] Diversity warning:', object.diversityWarning);
      }

      allEvaluations.push(
        ...object.evaluations.map((e) => ({
          url: e.url,
          rationale: e.rationale,
          relevanceScore: e.relevanceScore,
          recencyScore: e.recencyScore,
          authorityScore: e.authorityScore,
          biasScore: e.biasScore,
          sourceTier: e.sourceTier,
          contradicts: e.contradicts ?? undefined,
        }))
      );
    } catch (error) {
      console.error('Evaluation batch failed, using default scores:', error);
      for (const source of batch) {
        allEvaluations.push({
          url: source.url,
          rationale: 'Fallback — avaliação automática falhou',
          relevanceScore: 0.5,
          recencyScore: 0.5,
          authorityScore: 0.5,
          biasScore: 0.5,
          sourceTier: 'secondary',
        });
      }
    }
  }

  const evaluationMap = new Map(allEvaluations.map((e) => [e.url, e]));

  const evaluated: EvaluatedSource[] = sources.map((source) => {
    const eval_ = evaluationMap.get(source.url) ?? {
      rationale: 'Sem avaliação',
      relevanceScore: 0.5,
      recencyScore: 0.5,
      authorityScore: 0.5,
      biasScore: 0.5,
      sourceTier: 'secondary' as const,
      contradicts: undefined as string | undefined,
    };

    const credibility = getCredibilityTier(source.url, config);
    const credibilityScore = applyCredibilityBonuses(
      source,
      credibility.score,
      config
    );

    // Composite weighted score now includes bias
    const biasWeight = evaluation.weightBias;
    const adjustedRelevanceWeight = evaluation.weightRelevance - biasWeight / 3;
    const adjustedRecencyWeight = evaluation.weightRecency - biasWeight / 3;
    const adjustedAuthorityWeight = evaluation.weightAuthority - biasWeight / 3;

    const weightedScore =
      eval_.relevanceScore * adjustedRelevanceWeight +
      eval_.recencyScore * adjustedRecencyWeight +
      eval_.authorityScore * adjustedAuthorityWeight +
      (eval_.biasScore ?? 0.5) * biasWeight;

    return {
      ...source,
      relevanceScore: eval_.relevanceScore,
      recencyScore: eval_.recencyScore,
      authorityScore: eval_.authorityScore,
      biasScore: eval_.biasScore,
      weightedScore,
      credibilityScore,
      credibilityTier: credibility.tier,
      sourceTier: eval_.sourceTier,
      rationale: eval_.rationale,
      contradicts: eval_.contradicts,
      flagged: credibilityScore < config.sourceCredibility.flagBelowThreshold,
      kept: eval_.relevanceScore >= evaluation.relevanceThreshold,
    };
  });

  return evaluated
    .filter((s) => s.kept)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, evaluation.maxSourcesToKeep);
}
