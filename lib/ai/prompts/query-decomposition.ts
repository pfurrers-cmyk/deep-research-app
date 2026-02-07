// lib/ai/prompts/query-decomposition.ts — Prompt + schema para decomposição de query
// Optimized based on: OpenAI 4-agent pipeline, Salesforce EDR adaptive decomposition,
// LangChain Open Deep Research, MiLQ bilingual benchmark, Plan-and-Solve prompting.
import { z } from 'zod';
import type { AppConfig } from '@/config/defaults';

export const decompositionSchema = z.object({
  reasoning: z.string().describe(
    'Chain-of-thought: analise a complexidade da query, identifique os eixos temáticos, justifique a estratégia de decomposição escolhida e o mix de idiomas. 2-4 frases.'
  ),
  complexity: z.enum(['simple', 'moderate', 'complex']).describe(
    'Classificação de complexidade: simple = fato único/definição, moderate = múltiplos aspectos, complex = multidisciplinar/controverso/temporal'
  ),
  subQueries: z.array(
    z.object({
      text: z.string().describe('A sub-query formulada como pergunta ou termo de busca eficaz'),
      textEn: z.string().describe('A mesma sub-query traduzida para inglês (para busca no corpus técnico/acadêmico global)'),
      justification: z.string().describe('Por que esta sub-query é necessária e que lacuna de conhecimento ela preenche'),
      language: z.enum(['pt', 'en', 'hybrid']).describe('Idioma primário: pt para temas regionais/jurídicos, en para técnicos/científicos, hybrid para termos técnicos em contexto pt'),
      priority: z.enum(['high', 'medium', 'low']).describe('Prioridade: high = essencial para responder a query, medium = enriquece a análise, low = contexto complementar'),
      angle: z.enum(['conceptual', 'historical', 'comparative', 'practical', 'critical', 'quantitative', 'regulatory']).describe(
        'Ângulo de investigação que esta sub-query cobre'
      ),
      searchTerms: z.array(z.string()).describe('3-5 termos de busca otimizados em inglês para maximizar resultados'),
      searchTermsPt: z.array(z.string()).describe('2-3 termos de busca em português para fontes regionais'),
      expectedSourceType: z.enum(['academic', 'news', 'official', 'technical', 'opinion']).describe(
        'Tipo de fonte que esta sub-query deve capturar prioritariamente'
      ),
    })
  ),
});

export type DecompositionResult = z.infer<typeof decompositionSchema>;

export function buildDecompositionPrompt(
  query: string,
  config: AppConfig,
  customPrompt?: string
) {
  const { decomposition } = config.pipeline;

  // Allow full custom prompt override from settings
  if (customPrompt?.trim()) {
    return {
      system: customPrompt,
      prompt: `Decomponha a seguinte query de pesquisa:\n\n"${query}"`,
    };
  }

  const system = `Você é um estrategista de pesquisa sênior especializado em decomposição de queries complexas para deep research automatizado. Sua tarefa é transformar uma pergunta do usuário em um conjunto de sub-queries complementares que, executadas em paralelo, produzirão cobertura máxima do tema.

## PROCESSO (siga na ordem):
1. **ANALISE** a query: identifique o tema central, eixos temáticos, complexidade, e possíveis vieses
2. **CLASSIFIQUE** a complexidade (simple/moderate/complex)
3. **PLANEJE** a estratégia de decomposição antes de gerar as sub-queries
4. **GERE** entre ${decomposition.minSubQueries} e ${decomposition.maxSubQueries} sub-queries (alvo: ${decomposition.defaultSubQueries})

## REGRAS DE DECOMPOSIÇÃO:
- Cada sub-query deve atacar um **ângulo diferente**: conceitual, histórico, comparativo, prático, crítico, quantitativo, regulatório
- **ZERO redundância** — se duas sub-queries retornariam os mesmos resultados, elimine uma
- Priorize 1-2 sub-queries como "high" (essenciais), 2-3 como "medium", restantes como "low"
- Ao menos uma sub-query deve buscar **dados quantitativos** (estatísticas, benchmarks, números)
- Ao menos uma sub-query deve buscar **perspectivas críticas ou limitações** do tema

## ESTRATÉGIA BILÍNGUE (CRUCIAL para qualidade):
- Buscas em **inglês** capturam o corpus técnico/acadêmico global (maior e mais rico)
- Buscas em **português** capturam fontes regionais, jurídicas, governamentais brasileiras
- Para cada sub-query, gere TANTO a versão pt quanto a versão en
- **searchTerms** (en): 3-5 termos otimizados para motores de busca em inglês
- **searchTermsPt**: 2-3 termos para busca em português
- Queries **hybrid**: embutam termos técnicos em inglês dentro de estrutura pt (ex: "impacto do machine learning na saúde pública brasileira")

## TIPO DE FONTE ESPERADA:
- **academic**: papers, surveys, meta-análises (para sub-queries conceituais/quantitativas)
- **news**: notícias recentes, análises jornalísticas (para sub-queries temporais/comparativas)
- **official**: documentos governamentais, legislação, relatórios oficiais (para temas regulatórios)
- **technical**: documentação, tutoriais, benchmarks (para temas técnicos/práticos)
- **opinion**: blogs de especialistas, editoriais, análises de mercado (para perspectivas diversas)

## EXEMPLO DE BOA DECOMPOSIÇÃO:
Query: "Como a IA generativa está transformando o mercado de trabalho em tecnologia?"
→ Complexidade: complex
→ Sub-queries:
  1. [high/conceptual/academic] "What are the main categories of generative AI impact on tech employment 2024-2026?"
  2. [high/quantitative/news] "Generative AI job displacement statistics technology sector 2025"
  3. [medium/practical/technical] "Which tech roles are most augmented vs replaced by generative AI tools?"
  4. [medium/comparative/academic] "Comparison of AI automation impact across different technology sectors"
  5. [medium/critical/opinion] "Criticism and limitations of AI job displacement predictions"
  6. [low/regulatory/official] "Government policies AI workforce transition technology workers 2025"

## O QUE NUNCA FAZER:
- ❌ Gerar sub-queries genéricas que retornam resultados vagos
- ❌ Repetir a query original com pequenas variações
- ❌ Ignorar ângulos críticos/contrários ao consenso
- ❌ Gerar todas as sub-queries no mesmo idioma
- ❌ Esquecer termos de busca otimizados`;

  const prompt = `Decomponha a seguinte query de pesquisa em sub-queries complementares e estratégicas:

"${query}"

Primeiro raciocine sobre a complexidade e estratégia no campo "reasoning", depois gere as sub-queries.`;

  return { system, prompt };
}
