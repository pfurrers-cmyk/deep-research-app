// app/api/library/organize/route.ts — AI-powered library organization
import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { debug } from '@/lib/utils/debug-logger';

export const maxDuration = 30;

const organizationSchema = z.object({
  categories: z.array(z.object({
    name: z.string().describe('Nome da categoria em português'),
    icon: z.string().describe('Emoji representativo da categoria'),
    researchIds: z.array(z.string()).describe('IDs das pesquisas nesta categoria'),
    criteria: z.string().describe('Critério usado para agrupar'),
  })),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, criterion } = body as {
      items: Array<{ id: string; title: string; query: string; tags: string[]; depth: string; createdAt: string }>;
      criterion: string;
    };

    if (!items?.length) {
      return Response.json({ error: 'Nenhum item para organizar' }, { status: 400 });
    }

    const itemsSummary = items.map((item) =>
      `- ID: ${item.id} | Título: "${item.title}" | Query: "${item.query}" | Depth: ${item.depth} | Tags: [${item.tags.join(', ')}] | Data: ${item.createdAt}`
    ).join('\n');

    const criterionMap: Record<string, string> = {
      tema: 'Agrupe por tema/assunto principal das pesquisas',
      data: 'Agrupe cronologicamente (por semana/mês/período)',
      profundidade: 'Agrupe pela profundidade da pesquisa (rápida, normal, profunda, exaustiva)',
      dominio: 'Agrupe pelo domínio/área de conhecimento',
      custo: 'Agrupe por faixa de custo (baixo, médio, alto)',
      confianca: 'Agrupe pelo nível de confiança dos resultados',
      custom: criterion,
    };

    const criterionPrompt = criterionMap[criterion] ?? criterionMap.tema;

    const { object } = await generateObject({
      model: gateway('google/gemini-2.5-flash'),
      schema: organizationSchema,
      system: `Você é um assistente de organização de biblioteca de pesquisas. Organize as pesquisas em categorias claras e úteis. Cada pesquisa deve pertencer a exatamente uma categoria. Use nomes curtos e descritivos para as categorias. Forneça um emoji relevante para cada categoria.`,
      prompt: `Critério de organização: ${criterionPrompt}\n\nPesquisas para organizar:\n${itemsSummary}\n\nOrganize estas ${items.length} pesquisas em categorias relevantes.`,
    });

    debug.info('Library', `Organização por IA: ${object.categories.length} categorias criadas com critério "${criterion}"`);

    return Response.json(object);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    debug.error('Library', `Erro na organização por IA: ${msg}`);
    return Response.json({ error: msg }, { status: 500 });
  }
}
