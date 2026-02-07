// app/api/research/[id]/review/route.ts — AI-powered post-generation review (double-check)
import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { debug } from '@/lib/utils/debug-logger';

export const maxDuration = 60;

const reviewSchema = z.object({
  overallScore: z.number().min(0).max(10).describe('Nota geral do relatório (0-10)'),
  issues: z.array(z.object({
    type: z.enum(['contamination', 'hallucination', 'missing_citation', 'factual_error', 'irrelevant_content', 'bias', 'contradiction_missed', 'style']),
    severity: z.enum(['critical', 'major', 'minor']),
    location: z.string().describe('Trecho ou seção onde o problema ocorre'),
    description: z.string().describe('Descrição do problema encontrado'),
    suggestion: z.string().describe('Sugestão de correção'),
  })),
  strengths: z.array(z.string()).describe('Pontos fortes do relatório'),
  summary: z.string().describe('Resumo da revisão em 2-3 frases'),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reportText, query, citations } = body as {
      reportText: string;
      query: string;
      citations?: Array<{ index: number; title: string; url: string; domain: string }>;
    };

    if (!reportText?.trim()) {
      return Response.json({ error: 'Relatório vazio' }, { status: 400 });
    }

    const citationsText = citations
      ?.map((c) => `[${c.index}] ${c.title} (${c.domain}) — ${c.url}`)
      .join('\n') ?? '';

    const { object } = await generateObject({
      model: gateway('google/gemini-2.5-flash'),
      schema: reviewSchema,
      system: `Você é um revisor acadêmico rigoroso. Sua tarefa é revisar um relatório de pesquisa gerado por IA e identificar problemas de qualidade.

## TIPOS DE PROBLEMAS A DETECTAR:
1. **contamination** — Dados, estatísticas ou informações que NÃO são relevantes ao tema pesquisado (ex: dados financeiros em pesquisa médica, info de sidebar/ads de páginas web)
2. **hallucination** — Afirmações não suportadas por nenhuma das fontes citadas
3. **missing_citation** — Afirmações factuais sem citação [N]
4. **factual_error** — Erros factuais verificáveis
5. **irrelevant_content** — Seções ou parágrafos que fogem do escopo da pergunta
6. **bias** — Viés não declarado ou apresentação tendenciosa
7. **contradiction_missed** — Contradições entre fontes que não foram apontadas
8. **style** — Problemas de estilo (lista sequencial de fontes, falta de síntese cruzada)

## SEVERIDADE:
- **critical** — Compromete a confiabilidade do relatório (hallucination, contamination grave)
- **major** — Prejudica a qualidade mas não invalida (missing citations, factual errors)
- **minor** — Melhorias de qualidade (style, minor bias)

## IMPORTANTE:
- Verifique se TODAS as citações [N] referenciam fontes que realmente existem na lista fornecida
- Verifique se dados/estatísticas citados são plausíveis para o tema
- Identifique conteúdo que claramente veio de "ruído" nas fontes web (sidebars, artigos relacionados, etc.)
- Seja específico nas localizações e sugestões de correção`,
      prompt: `PERGUNTA DE PESQUISA: "${query}"

FONTES DISPONÍVEIS:
${citationsText}

RELATÓRIO PARA REVISÃO:
${reportText.slice(0, 15000)}

Revise este relatório identificando todos os problemas de qualidade.`,
    });

    debug.info('Review', `Revisão concluída para pesquisa ${id}: ${object.issues.length} problemas, nota ${object.overallScore}/10`);

    return Response.json(object);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    debug.error('Review', `Erro na revisão: ${msg}`);
    return Response.json({ error: msg }, { status: 500 });
  }
}
