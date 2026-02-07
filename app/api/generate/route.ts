// app/api/generate/route.ts — Image & Video generation API via AI Gateway
import { gateway } from '@ai-sdk/gateway';
import { generateImage, experimental_generateVideo } from 'ai';
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
      const base64 = video.base64;
      const dataUrl = `data:video/mp4;base64,${base64}`;

      debug.timed('Generate', `Vídeo gerado com sucesso: ${videoModelId}`, startTime);
      return Response.json({
        type: 'video',
        videoUrl: dataUrl,
        model: videoModelId,
      });
    }

    // ============================================================
    // IMAGE GENERATION
    // ============================================================
    const imageModelId = model || 'bfl/flux-pro-1.1';
    const result = await generateImage({
      model: gateway.image(imageModelId),
      prompt,
      size: (size || '1024x1024') as `${number}x${number}`,
    });

    const base64 = result.image.base64;
    const dataUrl = `data:image/png;base64,${base64}`;

    debug.timed('Generate', `Imagem gerada com sucesso: ${imageModelId}`, startTime);
    return Response.json({
      type: 'image',
      imageUrl: dataUrl,
      model: imageModelId,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Falha na geração';
    debug.error('Generate', `Erro na geração: ${errMsg}`, { error: String(error) });
    return Response.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
