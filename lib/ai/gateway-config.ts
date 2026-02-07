// lib/ai/gateway-config.ts — Configuração centralizada do AI Gateway
// Ponto único de acesso ao gateway. Todas as chamadas LLM passam por aqui.

import { gateway } from '@ai-sdk/gateway';
import { APP_CONFIG } from '@/config/defaults';

export { gateway };

export function getModel(modelId: string) {
  return gateway(modelId);
}

export function getSearchTool(
  provider: 'perplexity' | 'parallel',
  configOverrides?: {
    perplexity?: Partial<typeof APP_CONFIG.pipeline.search.perplexity>;
    parallel?: Partial<typeof APP_CONFIG.pipeline.search.parallel>;
  }
) {
  const searchConfig = APP_CONFIG.pipeline.search;

  if (provider === 'perplexity') {
    const perplexityConfig = {
      ...searchConfig.perplexity,
      ...configOverrides?.perplexity,
    };
    return gateway.tools.perplexitySearch({
      maxResults: perplexityConfig.maxResults,
      maxTokensPerPage: perplexityConfig.maxTokensPerPage,
      maxTokens: perplexityConfig.maxTokens,
      country: perplexityConfig.country,
      ...(perplexityConfig.searchRecencyFilter && {
        searchRecencyFilter: perplexityConfig.searchRecencyFilter,
      }),
    });
  }

  const parallelConfig = {
    ...searchConfig.parallel,
    ...configOverrides?.parallel,
  };
  return gateway.tools.parallelSearch({
    mode: parallelConfig.mode,
    maxResults: parallelConfig.maxResults,
    excerpts: {
      maxCharsPerResult: parallelConfig.maxCharsPerResult,
    },
    ...(parallelConfig.maxAgeSeconds && {
      fetchPolicy: {
        maxAgeSeconds: parallelConfig.maxAgeSeconds,
      },
    }),
  });
}

export function validateGatewayConfig(): { valid: boolean; error?: string } {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const isVercelProd = process.env.VERCEL === '1';

  if (!isVercelProd && !apiKey) {
    return {
      valid: false,
      error:
        'AI_GATEWAY_API_KEY não configurada. Adicione em .env.local para desenvolvimento local.',
    };
  }

  return { valid: true };
}
