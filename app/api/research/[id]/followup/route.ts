// app/api/research/[id]/followup/route.ts — Follow-up conversations
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { APP_CONFIG } from '@/config/defaults';

export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { question, reportContext, sourcesContext, model } = body as {
      question: string;
      reportContext: string;
      sourcesContext?: string;
      model?: string;
    };

    if (!question?.trim()) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    const modelId = model || APP_CONFIG.followUp.model;

    const systemPrompt = `Você é um assistente de pesquisa. O usuário já recebeu um relatório de pesquisa e agora faz perguntas de follow-up.

## CONTEXTO DO RELATÓRIO:
${reportContext?.slice(0, APP_CONFIG.followUp.maxContextTokens * 3) ?? 'Não disponível'}

${sourcesContext ? `## FONTES DISPONÍVEIS:\n${sourcesContext.slice(0, 5000)}` : ''}

## REGRAS:
1. Responda com base no relatório e fontes fornecidas.
2. Se a informação não estiver no contexto, diga isso claramente.
3. Use citações [N] quando referenciando fontes do relatório.
4. Responda no mesmo idioma da pergunta.
5. Seja conciso mas completo.`;

    const result = streamText({
      model: gateway(modelId),
      system: systemPrompt,
      prompt: question,
      maxOutputTokens: 4000,
      abortSignal: AbortSignal.timeout(60_000),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Follow-up API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process follow-up' },
      { status: 500 }
    );
  }
}
