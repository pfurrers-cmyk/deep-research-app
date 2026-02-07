// lib/ai/prompts/query-decomposition.ts — Prompt + schema para decomposição de query
import { z } from 'zod';
import type { AppConfig } from '@/config/defaults';

export const decompositionSchema = z.object({
  subQueries: z.array(
    z.object({
      text: z.string().describe('A sub-query de busca'),
      justification: z.string().describe('Por que esta sub-query é relevante'),
      language: z.string().describe('Idioma da sub-query (pt ou en)'),
    })
  ),
});

export type DecompositionResult = z.infer<typeof decompositionSchema>;

export function buildDecompositionPrompt(
  query: string,
  config: AppConfig
) {
  const { decomposition } = config.pipeline;
  const languages = decomposition.defaultLanguages.join(', ');

  const system = `Você é um especialista em decomposição de queries de pesquisa. Sua tarefa é transformar uma pergunta complexa do usuário em múltiplas sub-queries complementares que, juntas, permitirão uma pesquisa abrangente sobre o tema.

Regras:
- Gere entre ${decomposition.minSubQueries} e ${decomposition.maxSubQueries} sub-queries (target: ${decomposition.defaultSubQueries})
- Cada sub-query deve atacar um ângulo diferente do tema (conceitual, histórico, comparativo, prático, crítico, etc.)
- Idiomas permitidos para as sub-queries: ${languages}
- Priorize sub-queries em português para temas brasileiros/jurídicos e inglês para temas técnicos/científicos
- Evite redundância — cada sub-query deve trazer informação nova
${decomposition.includeJustification ? '- Inclua uma breve justificativa de por que cada sub-query é relevante' : ''}
- As sub-queries devem ser formuladas como perguntas ou termos de busca eficazes`;

  const prompt = `Decomponha a seguinte query de pesquisa em sub-queries complementares:

"${query}"

Gere exatamente ${decomposition.defaultSubQueries} sub-queries que cobrem diferentes ângulos do tema.`;

  return { system, prompt };
}
