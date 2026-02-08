// app/api/research/route.ts — Pipeline de pesquisa com streaming SSE

import { executePipeline } from '@/lib/research/pipeline';
import { createSSEResponse } from '@/lib/utils/streaming';
import { debug } from '@/lib/utils/debug-logger';
import type { ResearchRequest } from '@/lib/research/types';
import type { DepthPreset } from '@/config/defaults';

export const maxDuration = 300; // Vercel Fluid Compute

export async function POST(req: Request) {
  try {
    const body = await req.json();

    debug.info('API:Research', 'REQUEST RECEBIDO no servidor', {
      hasQuery: !!body.query,
      depth: body.depth,
      domainPreset: body.domainPreset,
      modelPreference: body.modelPreference,
      hasProSettings: !!body.proSettings,
      hasTccSettings: !!body.tccSettings,
      proResearchMode: body.proSettings?.researchMode ?? '(não enviado)',
      proCitationFormat: body.proSettings?.citationFormat ?? '(não enviado)',
      proWritingStyle: body.proSettings?.writingStyle ?? '(não enviado)',
      tccTitulo: body.tccSettings?.titulo ?? '(não enviado)',
      tccNivel: body.tccSettings?.nivelAcademico ?? '(não enviado)',
      hasAttachments: !!(body.attachments?.length),
      bodyKeys: Object.keys(body),
    });

    const request: ResearchRequest = {
      query: body.query ?? '',
      depth: (body.depth ?? 'normal') as DepthPreset,
      modelPreference: body.modelPreference ?? 'auto',
      domainPreset: body.domainPreset ?? null,
      templateId: body.templateId,
      configOverrides: body.configOverrides,
      customModelMap: body.customModelMap,
      sourceConfig: body.sourceConfig,
      attachments: body.attachments,
      proSettings: body.proSettings,
      tccSettings: body.tccSettings,
    };

    if (!request.query.trim()) {
      debug.warn('API:Research', 'Query vazia recebida');
      return Response.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    debug.info('API:Research', `Nova pesquisa montada: "${request.query.slice(0, 80)}"`, {
      depth: request.depth,
      model: request.modelPreference,
      researchMode: request.proSettings?.researchMode ?? 'N/A (sem proSettings)',
    });
    const { stream } = executePipeline(request);

    return createSSEResponse(stream);
  } catch (error) {
    debug.error('Research', `Erro na API de pesquisa: ${error instanceof Error ? error.message : String(error)}`);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
