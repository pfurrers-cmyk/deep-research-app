// app/api/recommend/route.ts — AI-powered model recommendation endpoint
import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { MODEL_RECOMMENDATIONS, PRICING, TIER_LABELS } from '@/config/model-recommendations';
import { debug } from '@/lib/utils/debug-logger';
import { getSafetyProviderOptions } from '@/config/safety-settings';

export const maxDuration = 30;

const recommendationSchema = z.object({
  analysis: z.string().describe('Breve análise do prompt do usuário (complexidade, tipo de pesquisa, necessidades)'),
  recommendations: z.object({
    economy: z.object({
      reasoning: z.string().describe('Justificativa para a escolha econômica'),
      estimatedTimeSeconds: z.number().describe('Tempo estimado em segundos'),
    }),
    costBenefit: z.object({
      reasoning: z.string().describe('Justificativa para o custo-benefício'),
      estimatedTimeSeconds: z.number().describe('Tempo estimado em segundos'),
    }),
    maxPerformance: z.object({
      reasoning: z.string().describe('Justificativa para máxima performance'),
      estimatedTimeSeconds: z.number().describe('Tempo estimado em segundos'),
    }),
  }),
});

function estimateCost(
  tier: 'economy' | 'costBenefit' | 'maxPerformance',
  promptLength: number,
  depth: string
): { costUSD: number; breakdown: Record<string, number> } {
  const depthMultipliers: Record<string, number> = {
    rapida: 0.5, normal: 1.0, profunda: 2.0, exaustiva: 4.0,
  };
  const mult = depthMultipliers[depth] ?? 1.0;

  // Estimate tokens per stage based on prompt length and depth
  const estInputTokens = Math.max(500, promptLength * 2) * mult;
  const estOutputTokens = {
    decomposition: 800 * mult,
    evaluation: 1500 * mult,
    synthesis: 3000 * mult,
  };

  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const [stage, rec] of Object.entries(MODEL_RECOMMENDATIONS)) {
    const modelId = rec[tier];
    const pricing = PRICING[modelId] ?? { input: 0.50, output: 2.00 };
    const inputCost = (estInputTokens / 1_000_000) * pricing.input;
    const outputCost = ((estOutputTokens[stage as keyof typeof estOutputTokens] ?? 1000) / 1_000_000) * pricing.output;
    breakdown[stage] = inputCost + outputCost;
    total += inputCost + outputCost;
  }

  // Add search cost estimate
  breakdown.search = 0.005 * mult;
  total += breakdown.search;

  return { costUSD: total, breakdown };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, depth, domain } = body as {
      prompt: string;
      depth: string;
      domain?: string;
    };

    if (!prompt?.trim()) {
      return Response.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    // Get AI analysis of the prompt
    const { object } = await generateObject({
      model: gateway('google/gemini-2.5-flash'),
      schema: recommendationSchema,
      providerOptions: getSafetyProviderOptions('google/gemini-2.5-flash') as never,
      system: `Você é um consultor de configuração de IA para pesquisas acadêmicas/profissionais. Analise o prompt do usuário e forneça recomendações para 3 perfis de configuração de modelos de IA.

Modelos disponíveis por perfil:
- Econômico: ${Object.values(MODEL_RECOMMENDATIONS).map((r) => r.economy).join(', ')}
- Custo×Benefício: ${Object.values(MODEL_RECOMMENDATIONS).map((r) => r.costBenefit).join(', ')}
- Máxima Performance: ${Object.values(MODEL_RECOMMENDATIONS).map((r) => r.maxPerformance).join(', ')}

Profundidade selecionada: ${depth}
${domain ? `Domínio: ${domain}` : ''}`,
      prompt: `Analise este prompt de pesquisa e justifique as recomendações para cada perfil:\n\n"${prompt.slice(0, 500)}"`,
    });

    // Calculate costs for each tier
    const tiers = (['economy', 'costBenefit', 'maxPerformance'] as const).map((tier) => {
      const cost = estimateCost(tier, prompt.length, depth);
      const models = Object.entries(MODEL_RECOMMENDATIONS).reduce((acc, [stage, rec]) => {
        acc[stage] = rec[tier];
        return acc;
      }, {} as Record<string, string>);

      return {
        tier,
        ...TIER_LABELS[tier],
        models,
        costEstimate: cost,
        reasoning: object.recommendations[tier].reasoning,
        estimatedTimeSeconds: object.recommendations[tier].estimatedTimeSeconds,
      };
    });

    debug.info('Recommend', `Recomendação gerada para: "${prompt.slice(0, 60)}..." depth=${depth}`);

    return Response.json({
      analysis: object.analysis,
      tiers,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    debug.error('Recommend', `Erro na recomendação: ${msg}`);
    return Response.json({ error: msg }, { status: 500 });
  }
}
