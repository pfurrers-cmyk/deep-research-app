// app/api/generate/route.ts — Image & Video generation API via AI Gateway
import { gateway } from '@ai-sdk/gateway';
import { generateImage, experimental_generateVideo } from 'ai';

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
      return Response.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

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

    return Response.json({
      type: 'image',
      imageUrl: dataUrl,
      model: imageModelId,
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Falha na geração' },
      { status: 500 }
    );
  }
}
