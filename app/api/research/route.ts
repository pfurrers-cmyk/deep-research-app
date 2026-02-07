// app/api/research/route.ts — Pipeline de pesquisa com streaming SSE

import { executePipeline } from '@/lib/research/pipeline';
import { createSSEResponse } from '@/lib/utils/streaming';
import type { ResearchRequest } from '@/lib/research/types';
import type { DepthPreset } from '@/config/defaults';

export const maxDuration = 300; // Vercel Fluid Compute

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const request: ResearchRequest = {
      query: body.query ?? '',
      depth: (body.depth ?? 'normal') as DepthPreset,
      modelPreference: body.modelPreference ?? 'auto',
      domainPreset: body.domainPreset ?? null,
      templateId: body.templateId,
      configOverrides: body.configOverrides,
      customModelMap: body.customModelMap,
    };

    if (!request.query.trim()) {
      return Response.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const { stream } = executePipeline(request);

    return createSSEResponse(stream);
  } catch (error) {
    console.error('Research API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
