// lib/ai/prompts/relevance-evaluation.ts — Prompt + schema para avaliação de fontes
import { z } from 'zod';
import type { AppConfig } from '@/config/defaults';
import type { SearchResult } from '@/lib/research/types';

export const evaluationSchema = z.object({
  evaluations: z.array(
    z.object({
      url: z.string().describe('URL da fonte avaliada'),
      relevanceScore: z
        .number()
        .min(0)
        .max(1)
        .describe('Score de relevância da fonte em relação à query (0-1)'),
      recencyScore: z
        .number()
        .min(0)
        .max(1)
        .describe('Score de recência — quão recente é a informação (0-1)'),
      authorityScore: z
        .number()
        .min(0)
        .max(1)
        .describe('Score de autoridade do domínio/fonte (0-1)'),
    })
  ),
});

export type EvaluationResult = z.infer<typeof evaluationSchema>;

export function buildEvaluationPrompt(
  query: string,
  sources: SearchResult[],
  config: AppConfig
) {
  const { evaluation } = config.pipeline;

  const system = `Você é um avaliador especializado em fontes de pesquisa. Sua tarefa é avaliar a relevância, recência e autoridade de cada fonte em relação à query de pesquisa original.

Critérios de avaliação:
- **relevanceScore** (0-1): Quão diretamente a fonte responde à query. 1.0 = perfeitamente relevante, 0.0 = irrelevante.
- **recencyScore** (0-1): Quão recente é a informação. 1.0 = muito recente/atualizado, 0.0 = desatualizado.
- **authorityScore** (0-1): Quão confiável é a fonte. Considere:
  - Domínios governamentais (.gov, .jus.br) e acadêmicos (.edu) = alta autoridade
  - Organizações reconhecidas (.org, nature.com, arxiv.org) = média-alta
  - Blogs pessoais, fóruns = baixa autoridade

Threshold de relevância: ${evaluation.relevanceThreshold} — fontes abaixo disso serão descartadas.
Máximo de fontes a manter: ${evaluation.maxSourcesToKeep}

Avalie TODAS as fontes fornecidas. Seja rigoroso mas justo.`;

  const sourcesText = sources
    .map(
      (s, i) =>
        `[${i + 1}] URL: ${s.url}\nTítulo: ${s.title}\nSnippet: ${s.snippet?.slice(0, 500) ?? 'N/A'}`
    )
    .join('\n\n');

  const prompt = `Query original: "${query}"

Avalie as seguintes ${sources.length} fontes:

${sourcesText}`;

  return { system, prompt };
}
