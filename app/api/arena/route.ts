// app/api/arena/route.ts — Arena: parallel execution of multiple configs
import { executePipeline } from '@/lib/research/pipeline';
import { createGenericSSEStream } from '@/lib/utils/streaming';
import type { DepthPreset } from '@/config/defaults';

export const maxDuration = 300;

interface ArenaConfig {
  id: string;
  label: string;
  depth: string;
  decompositionModel: string;
  evaluationModel: string;
  synthesisModel: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, configs } = body as {
      query: string;
      configs: ArenaConfig[];
    };

    if (!query?.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!configs?.length || configs.length > 3) {
      return Response.json({ error: 'Provide 1-3 configurations' }, { status: 400 });
    }

    const { stream, writer } = createGenericSSEStream();

    // Run all configs in parallel
    (async () => {
      const startTime = Date.now();
      const results: Array<{
        configId: string;
        label: string;
        reportText: string;
        durationMs: number;
        sourcesKept: number;
        modelsUsed: string[];
        costUSD: number;
        error?: string;
      }> = [];

      writer.writeEvent({
        type: 'arena-start',
        data: { query, configCount: configs.length },
      });

      // Execute each config as a separate pipeline, collecting results
      const promises = configs.map(async (config) => {
        const configStartTime = Date.now();

        const customModelMap: Record<string, string> = {};
        if (config.decompositionModel !== 'auto') {
          customModelMap.decomposition = config.decompositionModel;
        }
        if (config.evaluationModel !== 'auto') {
          customModelMap.evaluation = config.evaluationModel;
        }
        if (config.synthesisModel !== 'auto') {
          customModelMap.synthesis = config.synthesisModel;
        }

        try {
          const { stream: pipelineStream } = executePipeline({
            query,
            depth: (config.depth || 'normal') as DepthPreset,
            modelPreference: Object.keys(customModelMap).length > 0 ? 'custom' : 'auto',
            domainPreset: null,
            customModelMap: Object.keys(customModelMap).length > 0 ? customModelMap : undefined,
          });

          // Read the pipeline stream to collect results
          const reader = pipelineStream.getReader();
          const decoder = new TextDecoder();
          let reportText = '';
          let sourcesKept = 0;
          let modelsUsed: string[] = [];
          let costUSD = 0;
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const event = JSON.parse(data);

                // Forward stage events with config id
                if (event.type === 'stage') {
                  writer.writeEvent({
                    type: 'arena-stage',
                    data: { configId: config.id, ...event },
                  });
                }

                if (event.type === 'text-delta') {
                  reportText += event.text;
                }

                if (event.type === 'evaluation') {
                  sourcesKept = event.data.kept;
                }

                if (event.type === 'metadata') {
                  modelsUsed = event.data.modelsUsed;
                }

                if (event.type === 'cost') {
                  costUSD = event.data.costUSD;
                }
              } catch {
                // skip malformed
              }
            }
          }

          return {
            configId: config.id,
            label: config.label,
            reportText,
            durationMs: Date.now() - configStartTime,
            sourcesKept,
            modelsUsed,
            costUSD,
          };
        } catch (error) {
          return {
            configId: config.id,
            label: config.label,
            reportText: '',
            durationMs: Date.now() - configStartTime,
            sourcesKept: 0,
            modelsUsed: [] as string[],
            costUSD: 0,
            error: error instanceof Error ? error.message : 'Pipeline failed',
          };
        }
      });

      const settled = await Promise.allSettled(promises);
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }

      // Generate comparative report
      const totalDuration = Date.now() - startTime;
      const comparison = {
        query,
        totalDurationMs: totalDuration,
        results: results.map((r) => ({
          configId: r.configId,
          label: r.label,
          durationMs: r.durationMs,
          sourcesKept: r.sourcesKept,
          modelsUsed: r.modelsUsed,
          costUSD: r.costUSD,
          reportLength: r.reportText.length,
          error: r.error,
        })),
        winner: results
          .filter((r) => !r.error)
          .sort((a, b) => b.reportText.length - a.reportText.length)[0]?.configId ?? null,
      };

      writer.writeEvent({
        type: 'arena-results',
        data: {
          comparison,
          reports: results.map((r) => ({
            configId: r.configId,
            label: r.label,
            reportText: r.reportText,
            error: r.error,
          })),
        },
      });

      writer.writeEvent({ type: 'arena-complete', data: comparison });
      writer.close();
    })().catch((error) => {
      console.error('Arena fatal error:', error);
      writer.writeEvent({
        type: 'error',
        error: { code: 'ARENA_FATAL', message: String(error), recoverable: false },
      });
      writer.close();
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Arena API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
