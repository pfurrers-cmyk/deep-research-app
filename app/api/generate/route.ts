// app/api/generate/route.ts — Image & Video generation API via AI Gateway
import { gateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage, experimental_generateVideo } from 'ai';
import { debug } from '@/lib/utils/debug-logger';

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model, size, mode } = body as {
      prompt: string;
      model: string;
      size?: string;
      mode?: 'image' | 'video';
    };

    if (!prompt?.trim()) {
      debug.warn('Generate', 'Prompt vazio recebido');
      return Response.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const startTime = Date.now();
    debug.info('Generate', `Iniciando geração: mode=${mode || 'image'}, model=${model}`, { prompt: prompt.slice(0, 100), size });

    // ============================================================
    // VIDEO GENERATION
    // ============================================================
    if (mode === 'video') {
      const videoModelId = model || 'google/veo-3.1-generate-001';
      const result = await experimental_generateVideo({
        model: gateway.video(videoModelId),
        prompt,
      });

      const video = result.video;
      const mediaType = video.mediaType || 'video/mp4';
      const bytes = video.uint8Array;

      debug.timed('Generate', `Vídeo gerado: ${videoModelId} (${bytes.length} bytes)`, startTime);
      return new Response(Buffer.from(bytes), {
        headers: {
          'Content-Type': mediaType,
          'X-Generate-Type': 'video',
          'X-Generate-Model': videoModelId,
        },
      });
    }

    // ============================================================
    // IMAGE GENERATION
    // ============================================================
    const imageModelId = model || 'bfl/flux-pro-1.1';
    // Map size string to aspectRatio for image-only models
    const aspectRatio = sizeToAspectRatio(size) as `${number}:${number}`;
    const result = await generateImage({
      model: gateway.image(imageModelId),
      prompt,
      aspectRatio,
    });

    const image = result.image;
    const mediaType = image.mediaType || 'image/png';
    const bytes = image.uint8Array;

    if (!bytes || bytes.length === 0) {
      debug.error('Generate', `Imagem vazia retornada pelo modelo ${imageModelId}`);
      return Response.json(
        { error: `Modelo ${imageModelId} retornou imagem vazia` },
        { status: 502 }
      );
    }

    debug.timed('Generate', `Imagem gerada: ${imageModelId} (${bytes.length} bytes, ${mediaType})`, startTime);
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': mediaType,
        'X-Generate-Type': 'image',
        'X-Generate-Model': imageModelId,
      },
    });
  } catch (rawError: unknown) {
    // The Gateway SDK can throw non-Error values (including Promises).
    // Resolve any thrown Promise before extracting error info.
    let error: unknown = rawError;
    if (error instanceof Promise) {
      try { error = await error; } catch (e) { error = e; }
    }

    let errMsg = 'Falha na geração';
    let statusCode = 500;
    const errDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
      errMsg = error.message;
      errDetails.name = error.name;
      errDetails.stack = error.stack?.split('\n').slice(0, 3).join(' | ');

      // Gateway-specific error types have .type and .statusCode
      const gErr = error as unknown as Record<string, unknown>;
      if (gErr.type) errDetails.type = gErr.type;
      if (gErr.statusCode) statusCode = gErr.statusCode as number;
      if (gErr.response) errDetails.response = String(gErr.response).slice(0, 500);
      if (gErr.cause) errDetails.cause = String(gErr.cause).slice(0, 500);
    } else if (error && typeof error === 'object') {
      // Handle non-Error objects (e.g. gateway response objects)
      const obj = error as Record<string, unknown>;
      errMsg = String(obj.message ?? obj.error ?? JSON.stringify(error).slice(0, 300));
      if (obj.statusCode) statusCode = Number(obj.statusCode);
      if (obj.type) errDetails.type = obj.type;
      errDetails.rawType = typeof rawError === 'object' && rawError instanceof Promise
        ? 'Promise (resolved)' : typeof rawError;
    } else {
      errMsg = String(error);
    }

    // NEVER return a success status code for errors — Gateway SDK sometimes has statusCode: 200 on errors
    if (statusCode < 400) statusCode = 500;

    // Translate cryptic Gateway SDK errors into user-friendly messages
    errMsg = humanizeGatewayError(errMsg, errDetails);

    debug.error('Generate', `Erro na geração [${statusCode}]: ${errMsg}`, errDetails);
    return Response.json(
      { error: errMsg, details: errDetails },
      { status: statusCode }
    );
  }
}

// Map size string (e.g. "1024x1024") to aspectRatio (e.g. "1:1")
function sizeToAspectRatio(size?: string): string | undefined {
  if (!size) return '1:1';
  const map: Record<string, string> = {
    '1024x1024': '1:1',
    '1792x1024': '16:9',
    '1024x1792': '9:16',
    '1536x1024': '3:2',
    '1024x1536': '2:3',
    '1280x720': '16:9',
    '720x1280': '9:16',
  };
  return map[size] ?? '1:1';
}

// Map cryptic Gateway SDK errors to user-friendly messages
function humanizeGatewayError(msg: string, details: Record<string, unknown>): string {
  const cause = String(details.cause ?? '');
  const name = String(details.name ?? '');

  // GatewayResponseError with Invalid JSON — upstream provider returned non-JSON error
  if (name === 'GatewayResponseError' || msg.includes('Invalid error response format')) {
    return 'O provedor do modelo retornou um erro inesperado. Tente novamente ou escolha outro modelo.';
  }

  // API call errors — network/timeout issues
  if (cause.includes('AI_APICallError') || msg.includes('AI_APICallError')) {
    if (cause.includes('Invalid JSON') || msg.includes('Invalid JSON')) {
      return 'O provedor do modelo retornou uma resposta inválida. Tente novamente ou escolha outro modelo.';
    }
    return 'Falha na comunicação com o provedor do modelo. Verifique sua conexão e tente novamente.';
  }

  // Rate limiting
  if (msg.includes('rate limit') || msg.includes('429')) {
    return 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
  }

  // Timeout
  if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('ECONNRESET')) {
    return 'A geração excedeu o tempo limite. Tente novamente com um prompt mais simples.';
  }

  // Model not found
  if (msg.includes('not found') || msg.includes('404')) {
    return 'Modelo não encontrado no Gateway. Verifique se o modelo está disponível.';
  }

  return msg;
}
