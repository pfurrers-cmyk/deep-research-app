// app/api/generate/route.ts — Image generation API
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model, size } = body as {
      prompt: string;
      model: string;
      size?: string;
    };

    if (!prompt?.trim()) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const modelId = model || 'openai/gpt-image-1';

    // For image generation models, we use generateText with the image generation tool
    // The AI Gateway handles routing to the correct provider
    const result = await generateText({
      model: gateway(modelId),
      prompt: `Generate an image based on this description: ${prompt}`,
      providerOptions: {
        openai: {
          size: size || '1024x1024',
          quality: 'high',
        },
      },
    });

    // The response format depends on the provider
    // For now return the text response; actual image URL extraction
    // depends on the specific model's response format
    return Response.json({
      imageUrl: null,
      text: result.text,
      model: modelId,
      note: 'Image generation via AI Gateway. Some models may return image URLs in the text response. Direct image generation API support varies by provider configuration.',
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
