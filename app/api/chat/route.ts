// app/api/chat/route.ts — Streaming chat API via Vercel AI Gateway
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { getChatModels } from '@/config/models';
import type { ChatRequest } from '@/lib/chat/types';
import { getSafetyProviderOptions } from '@/config/safety-settings';

const CHAT_SYSTEM_PROMPT = `Você é um assistente de IA avançado, versátil e prestativo. Responda sempre no idioma em que o usuário escrever.

Regras:
- Seja preciso, completo e direto.
- Use Markdown para formatar respostas (títulos, listas, negrito, código).
- Quando gerar código com mais de 15 linhas, documentos longos, HTML completo, componentes React, JSON estruturado ou tabelas, envolva-os em tags <artifact>:
  <artifact type="code" language="python" title="Título descritivo">
  ...conteúdo...
  </artifact>
  Tipos válidos: code, markdown, html, react, json, text.
- Nunca invente URLs ou fontes. Se não souber algo, diga explicitamente.
- Seja conciso quando a pergunta for simples; seja detalhado quando for complexa.
- Pode fazer cálculos, análises, resumos, produzir tarefas, gerar código, explicar conceitos, etc.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { messages, model, systemPrompt, attachmentContext } = body;

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!model) {
      return Response.json({ error: 'Model is required' }, { status: 400 });
    }

    // Validate model exists in chat models
    const chatModels = getChatModels();
    const modelExists = chatModels.some((m) => m.id === model);
    if (!modelExists) {
      return Response.json(
        { error: `Model "${model}" is not available for chat` },
        { status: 400 }
      );
    }

    // Build system prompt
    let system = systemPrompt || CHAT_SYSTEM_PROMPT;
    if (attachmentContext) {
      system += `\n\n--- CONTEXTO DE ARQUIVOS ANEXADOS ---\n${attachmentContext}`;
    }

    // Build messages array for AI SDK
    const aiMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const result = streamText({
      model: gateway(model),
      system,
      messages: aiMessages,
      abortSignal: request.signal,
      providerOptions: getSafetyProviderOptions(model) as never,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
