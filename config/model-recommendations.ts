// config/model-recommendations.ts — Recomendações de modelos por etapa do pipeline
// Baseado em benchmarks, pricing e capabilities dos modelos do AI Gateway (fev/2026)

export interface StageRecommendation {
  costBenefit: string;
  economy: string;
  maxPerformance: string;
}

export const MODEL_RECOMMENDATIONS: Record<string, StageRecommendation> = {
  decomposition: {
    costBenefit: 'openai/gpt-4.1-mini',        // $0.40/$1.60 — rápido, preciso em structured output
    economy: 'openai/gpt-4.1-nano',             // $0.10/$0.40 — suficiente para decomposição simples
    maxPerformance: 'openai/gpt-4.1',           // $2.00/$8.00 — máxima qualidade de decomposição
  },
  evaluation: {
    costBenefit: 'google/gemini-2.5-flash',     // $0.30/$2.50 — excelente em análise, 557 TPS
    economy: 'google/gemini-2.5-flash-lite',    // $0.10/$0.40 — avaliação básica funcional
    maxPerformance: 'google/gemini-2.5-pro',    // $1.25/$10.00 — análise mais profunda
  },
  synthesis: {
    costBenefit: 'google/gemini-2.5-flash',     // $0.30/$2.50 — ótimo para síntese longa, 1M ctx
    economy: 'openai/gpt-4.1-mini',             // $0.40/$1.60 — boa qualidade, custo moderado
    maxPerformance: 'openai/gpt-5.2',           // $1.75/$14.00 — máxima qualidade de escrita
  },
};

// Custo estimado por 1000 tokens de entrada/saída para cálculo rápido
export const PRICING: Record<string, { input: number; output: number }> = {
  'openai/gpt-4.1-nano': { input: 0.10, output: 0.40 },
  'openai/gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'openai/gpt-4.1': { input: 2.00, output: 8.00 },
  'openai/gpt-5.2': { input: 1.75, output: 14.00 },
  'openai/gpt-5-nano': { input: 0.05, output: 0.40 },
  'openai/gpt-5-mini': { input: 0.25, output: 2.00 },
  'openai/gpt-5': { input: 1.25, output: 10.00 },
  'google/gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },
  'google/gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'google/gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'google/gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'google/gemini-3-flash': { input: 0.50, output: 3.00 },
  'google/gemini-3-pro-preview': { input: 2.00, output: 12.00 },
  'anthropic/claude-sonnet-4': { input: 3.00, output: 15.00 },
  'anthropic/claude-haiku-3.5': { input: 0.80, output: 4.00 },
  'xai/grok-4.1-fast-non-reasoning': { input: 0.20, output: 0.50 },
};

export type RecommendationTier = 'costBenefit' | 'economy' | 'maxPerformance';

export const TIER_LABELS: Record<RecommendationTier, { label: string; icon: string; description: string }> = {
  economy: {
    label: 'Econômico',
    icon: '💰',
    description: 'Custo mínimo com qualidade aceitável',
  },
  costBenefit: {
    label: 'Custo × Benefício',
    icon: '⚖️',
    description: 'Ponto ideal — zero desperdício de capacidade',
  },
  maxPerformance: {
    label: 'Máxima Performance',
    icon: '🚀',
    description: 'Melhor configuração possível em qualidade',
  },
};
