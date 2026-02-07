// config/models.ts — Catálogo COMPLETO de modelos do Vercel AI Gateway
// Extraído do CSV oficial (fev/2026). Exclui apenas embeddings (sem geração de texto).
// Inclui seção de modelos de geração de imagem/vídeo.

export type ModelTier = 'flagship' | 'workhorse' | 'budget' | 'reasoning' | 'code' | 'search' | 'embedding' | 'image' | 'video';

export type ModelCapability = 'text' | 'image-input' | 'image-gen' | 'video-gen' | 'embedding' | 'reasoning' | 'code' | 'search';

export interface ModelDefinition {
  id: string;
  provider: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  streaming: boolean;
  latency: string;
  tps: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  tier: ModelTier;
  capabilities: ModelCapability[];
}

// Helper to build entries concisely
function m(
  id: string, ctx: number, out: number, lat: string, tps: string,
  inP: number, outP: number, tier: ModelTier, caps: ModelCapability[]
): ModelDefinition {
  const [provider] = id.split('/');
  const name = id.split('/')[1]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { id, provider, name, contextWindow: ctx, maxOutput: out, streaming: true, latency: lat, tps, inputPricePer1M: inP, outputPricePer1M: outP, tier, capabilities: caps };
}

export const MODELS: ModelDefinition[] = [
  // ================================================================
  // xAI
  // ================================================================
  m('xai/grok-4.1-fast-non-reasoning', 2_000_000, 30_000, '0.8s', '92', 0.20, 0.50, 'budget', ['text']),
  m('xai/grok-4.1-fast-reasoning', 2_000_000, 30_000, '5.6s', '146', 0.20, 0.50, 'reasoning', ['text', 'reasoning']),
  m('xai/grok-4-fast-non-reasoning', 2_000_000, 256_000, '0.6s', '114', 0.20, 0.50, 'budget', ['text']),
  m('xai/grok-4-fast-reasoning', 2_000_000, 256_000, '2.4s', '274', 0.20, 0.50, 'reasoning', ['text', 'reasoning']),
  m('xai/grok-4', 256_000, 256_000, '3.6s', '75', 3.00, 15.00, 'flagship', ['text']),
  m('xai/grok-code-fast-1', 256_000, 256_000, '0.3s', '169', 0.20, 1.50, 'code', ['text', 'code']),
  m('xai/grok-3', 131_000, 131_000, '0.7s', '72', 3.00, 15.00, 'flagship', ['text']),
  m('xai/grok-3-mini', 131_000, 131_000, '0.4s', '143', 0.30, 0.50, 'reasoning', ['text', 'reasoning']),
  m('xai/grok-3-fast', 131_000, 131_000, '0.3s', '77', 5.00, 25.00, 'flagship', ['text']),
  m('xai/grok-3-mini-fast', 131_000, 131_000, '0.3s', '149', 0.60, 4.00, 'reasoning', ['text', 'reasoning']),
  m('xai/grok-2-vision', 33_000, 33_000, '0.6s', '101', 2.00, 10.00, 'workhorse', ['text', 'image-input']),

  // ================================================================
  // Google
  // ================================================================
  m('google/gemini-2.5-flash-lite', 1_049_000, 66_000, '0.3s', '262', 0.10, 0.40, 'budget', ['text']),
  m('google/gemini-2.5-pro', 1_049_000, 66_000, '2.0s', '175', 1.25, 10.00, 'flagship', ['text', 'image-input']),
  m('google/gemini-2.0-flash-lite', 1_049_000, 8_000, '0.3s', '146', 0.07, 0.30, 'budget', ['text']),
  m('google/gemini-2.0-flash', 1_049_000, 8_000, '0.3s', '146', 0.10, 0.40, 'workhorse', ['text', 'image-input']),
  m('google/gemini-2.5-flash-lite-preview-09-2025', 1_049_000, 66_000, '0.3s', '314', 0.10, 0.40, 'budget', ['text']),
  m('google/gemini-3-flash', 1_000_000, 65_000, '0.8s', '162', 0.50, 3.00, 'workhorse', ['text', 'image-input']),
  m('google/gemini-3-pro-preview', 1_000_000, 64_000, '3.8s', '117', 2.00, 12.00, 'flagship', ['text', 'image-input']),
  m('google/gemini-2.5-flash', 1_000_000, 66_000, '0.4s', '557', 0.30, 2.50, 'workhorse', ['text', 'image-input']),
  m('google/gemini-2.5-flash-preview-09-2025', 1_000_000, 66_000, '0.4s', '208', 0.30, 2.50, 'workhorse', ['text']),

  // ================================================================
  // OpenAI
  // ================================================================
  m('openai/gpt-4.1-mini', 1_048_000, 33_000, '0.6s', '66', 0.40, 1.60, 'workhorse', ['text', 'image-input']),
  m('openai/gpt-4.1', 1_048_000, 33_000, '0.7s', '44', 2.00, 8.00, 'flagship', ['text', 'image-input']),
  m('openai/gpt-4.1-nano', 1_048_000, 33_000, '0.5s', '57', 0.10, 0.40, 'budget', ['text']),
  m('openai/gpt-5.2', 400_000, 128_000, '0.8s', '62', 1.75, 14.00, 'flagship', ['text', 'image-input']),
  m('openai/gpt-5.2-codex', 400_000, 128_000, '3.2s', '152', 1.75, 14.00, 'code', ['text', 'code']),
  m('openai/gpt-5-nano', 400_000, 128_000, '6.2s', '425', 0.05, 0.40, 'budget', ['text']),
  m('openai/gpt-5-mini', 400_000, 128_000, '6.6s', '329', 0.25, 2.00, 'workhorse', ['text']),
  m('openai/gpt-5', 400_000, 128_000, '5.0s', '522', 1.25, 10.00, 'flagship', ['text', 'image-input']),
  m('openai/gpt-5.1-thinking', 400_000, 128_000, '0.9s', '140', 1.25, 10.00, 'reasoning', ['text', 'reasoning']),
  m('openai/gpt-5-codex', 400_000, 128_000, '0.7s', '133', 1.25, 10.00, 'code', ['text', 'code']),
  m('openai/gpt-5.1-codex', 400_000, 128_000, '0.5s', '66', 1.25, 10.00, 'code', ['text', 'code']),
  m('openai/gpt-5.1-codex-max', 400_000, 128_000, '5.1s', '103', 1.25, 10.00, 'code', ['text', 'code']),
  m('openai/gpt-5.1-codex-mini', 400_000, 128_000, '0.9s', '120', 0.25, 2.00, 'code', ['text', 'code']),
  m('openai/gpt-5.2-pro', 400_000, 128_000, '15.4s', '—', 21.00, 168.00, 'flagship', ['text', 'reasoning']),
  m('openai/gpt-5-pro', 400_000, 272_000, '—', '—', 15.00, 120.00, 'flagship', ['text', 'reasoning']),
  m('openai/o4-mini', 200_000, 100_000, '2.2s', '232', 1.10, 4.40, 'reasoning', ['text', 'reasoning']),
  m('openai/o3', 200_000, 100_000, '4.1s', '93', 2.00, 8.00, 'reasoning', ['text', 'reasoning']),
  m('openai/o3-mini', 200_000, 100_000, '2.2s', '—', 1.10, 4.40, 'reasoning', ['text', 'reasoning']),
  m('openai/o3-pro', 200_000, 100_000, '53.1s', '—', 20.00, 80.00, 'reasoning', ['text', 'reasoning']),
  m('openai/o3-deep-research', 200_000, 100_000, '—', '—', 10.00, 40.00, 'reasoning', ['text', 'reasoning', 'search']),
  m('openai/codex-mini', 200_000, 100_000, '2.5s', '309', 1.50, 6.00, 'code', ['text', 'code']),
  m('openai/o1', 200_000, 100_000, '2.3s', '—', 15.00, 60.00, 'reasoning', ['text', 'reasoning']),
  m('openai/gpt-oss-120b', 131_000, 131_000, '0.1s', '471', 0.10, 0.50, 'budget', ['text']),
  m('openai/gpt-oss-safeguard-20b', 131_000, 66_000, '0.1s', '—', 0.07, 0.30, 'budget', ['text']),
  m('openai/gpt-oss-20b', 131_000, 128_000, '0.1s', '223', 0.07, 0.30, 'budget', ['text']),
  m('openai/gpt-5-chat', 128_000, 16_000, '0.5s', '114', 1.25, 10.00, 'flagship', ['text']),
  m('openai/gpt-5.1-instant', 128_000, 16_000, '0.7s', '98', 1.25, 10.00, 'flagship', ['text']),
  m('openai/gpt-4o-mini', 128_000, 16_000, '0.6s', '59', 0.15, 0.60, 'budget', ['text', 'image-input']),
  m('openai/gpt-4o', 128_000, 16_000, '0.6s', '52', 2.50, 10.00, 'workhorse', ['text', 'image-input']),
  m('openai/gpt-5.2-chat', 128_000, 16_000, '0.5s', '80', 1.75, 14.00, 'flagship', ['text']),
  m('openai/gpt-4o-mini-search-preview', 128_000, 16_000, '1.5s', '108', 0.15, 0.60, 'search', ['text', 'search']),
  m('openai/gpt-4-turbo', 128_000, 4_000, '1.0s', '25', 10.00, 30.00, 'workhorse', ['text', 'image-input']),

  // ================================================================
  // Anthropic
  // ================================================================
  m('anthropic/claude-sonnet-4.5', 1_000_000, 64_000, '0.8s', '70', 3.00, 15.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-sonnet-4', 1_000_000, 64_000, '1.1s', '78', 3.00, 15.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-opus-4.6', 1_000_000, 128_000, '2.1s', '66', 5.00, 25.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-haiku-4.5', 200_000, 64_000, '0.4s', '111', 1.00, 5.00, 'workhorse', ['text', 'image-input']),
  m('anthropic/claude-3.7-sonnet', 200_000, 64_000, '0.4s', '55', 3.00, 15.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-opus-4.5', 200_000, 64_000, '1.4s', '55', 5.00, 25.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-opus-4', 200_000, 32_000, '1.2s', '43', 15.00, 75.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-opus-4.1', 200_000, 32_000, '1.4s', '47', 15.00, 75.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-3.5-haiku', 200_000, 8_000, '0.5s', '54', 0.80, 4.00, 'workhorse', ['text']),
  m('anthropic/claude-3.5-sonnet', 200_000, 8_000, '0.7s', '65', 3.00, 15.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-3.5-sonnet-20240620', 200_000, 8_000, '0.6s', '84', 3.00, 15.00, 'flagship', ['text', 'image-input']),
  m('anthropic/claude-3-haiku', 200_000, 4_000, '0.4s', '139', 0.25, 1.25, 'budget', ['text']),
  m('anthropic/claude-3-opus', 200_000, 8_000, '0.8s', '21', 15.00, 75.00, 'flagship', ['text', 'image-input']),

  // ================================================================
  // DeepSeek
  // ================================================================
  m('deepseek/deepseek-v3.2', 164_000, 66_000, '1.0s', '33', 0.27, 0.40, 'workhorse', ['text']),
  m('deepseek/deepseek-v3.2-exp', 164_000, 164_000, '0.8s', '36', 0.27, 0.40, 'workhorse', ['text']),
  m('deepseek/deepseek-v3', 164_000, 164_000, '1.0s', '101', 0.28, 0.77, 'workhorse', ['text']),
  m('deepseek/deepseek-r1', 164_000, 16_000, '0.3s', '160', 0.50, 2.15, 'reasoning', ['text', 'reasoning']),
  m('deepseek/deepseek-v3.1', 164_000, 164_000, '0.1s', '271', 0.30, 1.00, 'workhorse', ['text']),
  m('deepseek/deepseek-v3.1-terminus', 131_000, 66_000, '1.3s', '34', 0.27, 1.00, 'workhorse', ['text']),
  m('deepseek/deepseek-v3.2-thinking', 128_000, 64_000, '1.7s', '32', 0.28, 0.42, 'reasoning', ['text', 'reasoning']),

  // ================================================================
  // Alibaba / Qwen
  // ================================================================
  m('alibaba/qwen3-coder-plus', 1_000_000, 66_000, '2.0s', '54', 1.00, 5.00, 'code', ['text', 'code']),
  m('alibaba/qwen3-max', 262_000, 66_000, '1.2s', '44', 0.84, 3.38, 'workhorse', ['text']),
  m('alibaba/qwen3-coder', 262_000, 67_000, '0.3s', '100', 0.38, 1.53, 'code', ['text', 'code']),
  m('alibaba/qwen3-next-80b-a3b-instruct', 262_000, 66_000, '0.4s', '136', 0.09, 1.10, 'budget', ['text']),
  m('alibaba/qwen3-coder-30b-a3b', 262_000, 33_000, '0.4s', '76', 0.07, 0.27, 'code', ['text', 'code']),
  m('alibaba/qwen3-vl-instruct', 262_000, 262_000, '0.2s', '51', 0.20, 0.88, 'workhorse', ['text', 'image-input']),
  m('alibaba/qwen3-max-preview', 262_000, 33_000, '1.9s', '56', 1.20, 6.00, 'workhorse', ['text']),
  m('alibaba/qwen3-235b-a22b-thinking', 262_000, 262_000, '0.5s', '65', 0.30, 2.90, 'reasoning', ['text', 'reasoning']),
  m('alibaba/qwen3-vl-thinking', 256_000, 256_000, '0.3s', '78', 0.22, 0.88, 'reasoning', ['text', 'image-input', 'reasoning']),
  m('alibaba/qwen3-coder-next', 256_000, 256_000, '0.3s', '142', 0.50, 1.20, 'code', ['text', 'code']),
  m('alibaba/qwen3-max-thinking', 256_000, 66_000, '1.9s', '31', 1.20, 6.00, 'reasoning', ['text', 'reasoning']),
  m('alibaba/qwen-3-235b', 131_000, 33_000, '0.7s', '42', 0.07, 0.46, 'workhorse', ['text']),
  m('alibaba/qwen-3-32b', 131_000, 41_000, '0.1s', '308', 0.10, 0.30, 'budget', ['text']),
  m('alibaba/qwen3-next-80b-a3b-thinking', 131_000, 66_000, '1.0s', '315', 0.15, 1.50, 'reasoning', ['text', 'reasoning']),
  m('alibaba/qwen-3-14b', 66_000, 66_000, '0.8s', '36', 0.27, 0.40, 'budget', ['text']),
  m('alibaba/qwen-3-30b', 66_000, 66_000, '1.0s', '101', 0.28, 0.77, 'workhorse', ['text']),

  // ================================================================
  // Amazon
  // ================================================================
  m('amazon/nova-2-lite', 1_000_000, 1_000_000, '0.4s', '182', 0.30, 2.50, 'workhorse', ['text']),
  m('amazon/nova-lite', 300_000, 8_000, '0.3s', '—', 0.06, 0.24, 'budget', ['text']),
  m('amazon/nova-pro', 300_000, 8_000, '0.7s', '90', 0.80, 3.20, 'workhorse', ['text']),
  m('amazon/nova-micro', 128_000, 8_000, '0.3s', '—', 0.04, 0.14, 'budget', ['text']),

  // ================================================================
  // Meta / Llama
  // ================================================================
  m('meta/llama-4-maverick', 524_000, 8_000, '0.3s', '102', 0.15, 0.60, 'workhorse', ['text']),
  m('meta/llama-4-scout', 131_000, 8_000, '0.2s', '211', 0.08, 0.30, 'budget', ['text']),
  m('meta/llama-3.3-70b', 128_000, 33_000, '0.2s', '359', 0.59, 0.72, 'workhorse', ['text']),
  m('meta/llama-3.1-8b', 131_000, 131_000, '0.1s', '89', 0.02, 0.05, 'budget', ['text']),
  m('meta/llama-3.1-70b', 131_000, 16_000, '0.3s', '32', 0.40, 0.40, 'workhorse', ['text']),
  m('meta/llama-3.2-3b', 128_000, 8_000, '0.3s', '53', 0.15, 0.15, 'budget', ['text']),
  m('meta/llama-3.2-11b', 128_000, 8_000, '0.2s', '163', 0.16, 0.16, 'budget', ['text', 'image-input']),
  m('meta/llama-3.2-1b', 128_000, 8_000, '0.2s', '89', 0.10, 0.10, 'budget', ['text']),
  m('meta/llama-3.2-90b', 128_000, 8_000, '0.3s', '63', 0.72, 0.72, 'workhorse', ['text', 'image-input']),

  // ================================================================
  // Mistral
  // ================================================================
  m('mistral/devstral-2', 256_000, 256_000, '6.1s', '64', 0, 0, 'code', ['text', 'code']),
  m('mistral/devstral-small-2', 256_000, 256_000, '0.5s', '185', 0, 0, 'code', ['text', 'code']),
  m('mistral/mistral-large-3', 256_000, 256_000, '0.4s', '64', 0.50, 1.50, 'workhorse', ['text']),
  m('mistral/ministral-14b', 256_000, 256_000, '0.2s', '141', 0.20, 0.20, 'budget', ['text']),
  m('mistral/mistral-nemo', 131_000, 131_000, '0.3s', '51', 0.02, 0.04, 'budget', ['text']),
  m('mistral/codestral', 128_000, 4_000, '0.2s', '345', 0.30, 0.90, 'code', ['text', 'code']),
  m('mistral/pixtral-12b', 128_000, 4_000, '0.2s', '137', 0.15, 0.15, 'budget', ['text', 'image-input']),
  m('mistral/ministral-8b', 128_000, 4_000, '0.3s', '55', 0.10, 0.10, 'budget', ['text']),
  m('mistral/pixtral-large', 128_000, 4_000, '0.3s', '66', 2.00, 6.00, 'workhorse', ['text', 'image-input']),
  m('mistral/ministral-3b', 128_000, 4_000, '0.2s', '—', 0.04, 0.04, 'budget', ['text']),
  m('mistral/mistral-medium', 128_000, 64_000, '0.3s', '87', 0.40, 2.00, 'workhorse', ['text']),
  m('mistral/magistral-medium', 128_000, 64_000, '0.3s', '53', 2.00, 5.00, 'reasoning', ['text', 'reasoning']),
  m('mistral/magistral-small', 128_000, 64_000, '0.3s', '133', 0.50, 1.50, 'reasoning', ['text', 'reasoning']),
  m('mistral/devstral-small', 128_000, 64_000, '0.3s', '—', 0.10, 0.30, 'code', ['text', 'code']),
  m('mistral/mistral-small', 32_000, 4_000, '0.2s', '89', 0.10, 0.30, 'budget', ['text']),
  m('mistral/mixtral-8x22b-instruct', 66_000, 66_000, '1.0s', '33', 0.27, 0.40, 'workhorse', ['text']),

  // ================================================================
  // MoonshotAI / Kimi
  // ================================================================
  m('moonshotai/kimi-k2.5', 262_000, 262_000, '0.3s', '156', 0.50, 2.80, 'workhorse', ['text']),
  m('moonshotai/kimi-k2-0905', 262_000, 128_000, '0.3s', '340', 0.60, 2.50, 'workhorse', ['text']),
  m('moonshotai/kimi-k2-thinking', 262_000, 262_000, '0.6s', '183', 0.47, 2.00, 'reasoning', ['text', 'reasoning']),
  m('moonshotai/kimi-k2-thinking-turbo', 262_000, 262_000, '1.1s', '80', 1.15, 8.00, 'reasoning', ['text', 'reasoning']),
  m('moonshotai/kimi-k2-turbo', 256_000, 16_000, '2.7s', '71', 2.40, 10.00, 'workhorse', ['text']),
  m('moonshotai/kimi-k2', 131_000, 131_000, '0.6s', '59', 0.50, 2.00, 'workhorse', ['text']),

  // ================================================================
  // ByteDance / Seed
  // ================================================================
  m('bytedance/seed-1.8', 256_000, 64_000, '1.5s', '81', 0.25, 2.00, 'workhorse', ['text']),
  m('bytedance/seed-1.6', 256_000, 32_000, '1.3s', '60', 0.25, 2.00, 'workhorse', ['text']),

  // ================================================================
  // MiniMax
  // ================================================================
  m('minimax/minimax-m2', 205_000, 205_000, '1.1s', '81', 0.30, 1.20, 'workhorse', ['text']),
  m('minimax/minimax-m2.1', 205_000, 200_000, '2.1s', '171', 0.28, 1.20, 'workhorse', ['text']),
  m('minimax/minimax-m2.1-lightning', 205_000, 131_000, '2.0s', '73', 0.30, 2.40, 'workhorse', ['text']),

  // ================================================================
  // ZAI / GLM
  // ================================================================
  m('zai/glm-4.7', 205_000, 131_000, '0.8s', '478', 0.43, 1.75, 'workhorse', ['text']),
  m('zai/glm-4.6', 205_000, 203_000, '0.4s', '136', 0.45, 1.80, 'workhorse', ['text']),
  m('zai/glm-4.7-flash', 200_000, 131_000, '2.6s', '54', 0, 0, 'budget', ['text']),
  m('zai/glm-4.7-flashx', 200_000, 128_000, '2.7s', '46', 0.06, 0.40, 'budget', ['text']),
  m('zai/glm-4.5', 131_000, 131_000, '2.1s', '76', 0.60, 2.20, 'workhorse', ['text']),
  m('zai/glm-4.6v-flash', 128_000, 24_000, '1.8s', '138', 0, 0, 'budget', ['text', 'image-input']),
  m('zai/glm-4.6v', 128_000, 24_000, '2.7s', '88', 0.30, 0.90, 'workhorse', ['text', 'image-input']),
  m('zai/glm-4.5-air', 128_000, 96_000, '2.5s', '70', 0.20, 1.10, 'budget', ['text']),
  m('zai/glm-4.5v', 32_000, 16_000, '0.5s', '—', 0.25, 1.00, 'workhorse', ['text', 'image-input']),

  // ================================================================
  // Perplexity (search-augmented)
  // ================================================================
  m('perplexity/sonar-pro', 200_000, 8_000, '1.2s', '100', 3.00, 15.00, 'search', ['text', 'search']),
  m('perplexity/sonar', 127_000, 8_000, '1.5s', '103', 1.00, 1.00, 'search', ['text', 'search']),
  m('perplexity/sonar-reasoning-pro', 127_000, 8_000, '1.4s', '98', 2.00, 8.00, 'search', ['text', 'search', 'reasoning']),
  m('perplexity/sonar-reasoning', 127_000, 8_000, '—', '—', 1.00, 5.00, 'search', ['text', 'search', 'reasoning']),

  // ================================================================
  // Cohere
  // ================================================================
  m('cohere/command-a', 256_000, 8_000, '0.2s', '58', 2.50, 10.00, 'workhorse', ['text']),

  // ================================================================
  // NVIDIA
  // ================================================================
  m('nvidia/nemotron-3-nano-30b-a3b', 262_000, 262_000, '0.2s', '—', 0.06, 0.24, 'budget', ['text']),
  m('nvidia/nemotron-nano-12b-v2-vl', 131_000, 131_000, '0.3s', '182', 0.20, 0.60, 'budget', ['text', 'image-input']),
  m('nvidia/nemotron-nano-9b-v2', 131_000, 131_000, '0.3s', '152', 0.04, 0.16, 'budget', ['text']),

  // ================================================================
  // Xiaomi
  // ================================================================
  m('xiaomi/mimo-v2-flash', 262_000, 32_000, '0.7s', '158', 0.09, 0.29, 'budget', ['text', 'image-input']),

  // ================================================================
  // KwaiPilot
  // ================================================================
  m('kwaipilot/kat-coder-pro-v1', 256_000, 32_000, '2.8s', '61', 0.03, 1.20, 'code', ['text', 'code']),

  // ================================================================
  // Inception
  // ================================================================
  m('inception/mercury-coder-small', 32_000, 16_000, '0.5s', '—', 0.25, 1.00, 'code', ['text', 'code']),

  // ================================================================
  // Arcee AI
  // ================================================================
  m('arcee-ai/trinity-mini', 131_000, 131_000, '0.5s', '216', 0.04, 0.15, 'budget', ['text']),
  m('arcee-ai/trinity-large-preview', 131_000, 131_000, '1.7s', '28', 0.25, 1.00, 'workhorse', ['text']),

  // ================================================================
  // Prime Intellect
  // ================================================================
  m('prime-intellect/intellect-3', 131_000, 131_000, '0.4s', '116', 0.20, 1.10, 'workhorse', ['text']),

  // ================================================================
  // Morph
  // ================================================================
  m('morph/morph-v3-fast', 82_000, 16_000, '0.3s', '—', 0.80, 1.20, 'workhorse', ['text']),
  m('morph/morph-v3-large', 82_000, 16_000, '0.3s', '—', 0.90, 1.90, 'workhorse', ['text']),

  // ================================================================
  // Meituan
  // ================================================================
  m('meituan/longcat-flash-chat', 128_000, 100_000, '3.6s', '111', 0, 0, 'workhorse', ['text']),
  m('meituan/longcat-flash-thinking', 128_000, 8_000, '—', '—', 0.15, 1.50, 'reasoning', ['text', 'reasoning']),
  m('meituan/longcat-flash-thinking-2601', 33_000, 33_000, '3.4s', '159', 0, 0, 'reasoning', ['text', 'reasoning']),

  // ================================================================
  // Vercel
  // ================================================================
  m('vercel/v0-1.5-md', 128_000, 33_000, '3.8s', '58', 3.00, 15.00, 'code', ['text', 'code']),
  m('vercel/v0-1.0-md', 128_000, 32_000, '4.2s', '55', 3.00, 15.00, 'code', ['text', 'code']),

  // ================================================================
  // OpenAI legacy
  // ================================================================
  m('openai/gpt-3.5-turbo', 16_000, 4_000, '0.4s', '—', 0.50, 1.50, 'budget', ['text']),
  m('openai/gpt-3.5-turbo-instruct', 8_000, 4_000, '—', '—', 1.50, 2.00, 'budget', ['text']),

  // ================================================================
  // EMBEDDINGS (não streaming, para referência)
  // ================================================================
  { id: 'openai/text-embedding-3-small', provider: 'openai', name: 'Text Embedding 3 Small', contextWindow: 8_192, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.02, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'openai/text-embedding-3-large', provider: 'openai', name: 'Text Embedding 3 Large', contextWindow: 8_192, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.13, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'mistral/mistral-embed', provider: 'mistral', name: 'Mistral Embed', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.10, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'google/gemini-embedding-001', provider: 'google', name: 'Gemini Embedding 001', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.15, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'google/text-multilingual-embedding-002', provider: 'google', name: 'Text Multilingual Embedding', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.03, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'google/text-embedding-005', provider: 'google', name: 'Text Embedding 005', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.03, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'voyage/voyage-code-3', provider: 'voyage', name: 'Voyage Code 3', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.18, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'voyage/voyage-3-large', provider: 'voyage', name: 'Voyage 3 Large', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.18, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'voyage/voyage-3.5', provider: 'voyage', name: 'Voyage 3.5', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.06, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'voyage/voyage-3.5-lite', provider: 'voyage', name: 'Voyage 3.5 Lite', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.02, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'voyage/voyage-code-2', provider: 'voyage', name: 'Voyage Code 2', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.12, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'voyage/voyage-finance-2', provider: 'voyage', name: 'Voyage Finance 2', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.12, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'voyage/voyage-law-2', provider: 'voyage', name: 'Voyage Law 2', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.12, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'amazon/titan-embed-text-v2', provider: 'amazon', name: 'Titan Embed Text V2', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.02, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'cohere/embed-v4.0', provider: 'cohere', name: 'Embed V4.0', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.12, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'mistral/codestral-embed', provider: 'mistral', name: 'Codestral Embed', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.15, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'alibaba/qwen3-embedding-8b', provider: 'alibaba', name: 'Qwen3 Embedding 8B', contextWindow: 33_000, maxOutput: 33_000, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.05, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'alibaba/qwen3-embedding-0.6b', provider: 'alibaba', name: 'Qwen3 Embedding 0.6B', contextWindow: 33_000, maxOutput: 33_000, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.01, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'alibaba/qwen3-embedding-4b', provider: 'alibaba', name: 'Qwen3 Embedding 4B', contextWindow: 33_000, maxOutput: 33_000, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.02, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },
  { id: 'openai/text-embedding-ada-002', provider: 'openai', name: 'Text Embedding Ada 002', contextWindow: 0, maxOutput: 0, streaming: false, latency: '—', tps: '—', inputPricePer1M: 0.10, outputPricePer1M: 0, tier: 'embedding', capabilities: ['embedding'] },

  // ================================================================
  // GERAÇÃO DE IMAGEM (IDs reais do AI Gateway — gateway.image())
  // ================================================================
  { id: 'bfl/flux-pro-1.1', provider: 'bfl', name: 'FLUX Pro 1.1', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~5s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'bfl/flux-pro-1.1-ultra', provider: 'bfl', name: 'FLUX Pro 1.1 Ultra', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~8s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'bfl/flux-kontext-pro', provider: 'bfl', name: 'FLUX Kontext Pro', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~5s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'bfl/flux-kontext-max', provider: 'bfl', name: 'FLUX Kontext Max', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~8s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'google/imagen-4.0-generate-001', provider: 'google', name: 'Imagen 4.0', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~8s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'google/imagen-4.0-ultra-generate-001', provider: 'google', name: 'Imagen 4.0 Ultra', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~12s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'bfl/flux-2-pro', provider: 'bfl', name: 'FLUX 2 Pro', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~6s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'bfl/flux-2-flex', provider: 'bfl', name: 'FLUX 2 Flex', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~5s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },
  { id: 'recraft/recraft-v3', provider: 'recraft', name: 'Recraft V3', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~5s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'image', capabilities: ['image-gen'] },

  // ================================================================
  // GERAÇÃO DE VÍDEO (IDs reais do AI Gateway — gateway.video())
  // ================================================================
  { id: 'google/veo-3.1-generate-001', provider: 'google', name: 'Veo 3.1', contextWindow: 0, maxOutput: 0, streaming: false, latency: '~30s', tps: '—', inputPricePer1M: 0, outputPricePer1M: 0, tier: 'video', capabilities: ['video-gen'] },
];

// ============================================================
// HELPERS
// ============================================================

const modelsMap = new Map<string, ModelDefinition>(
  MODELS.map((m) => [m.id, m])
);

export function getModelById(id: string): ModelDefinition | undefined {
  return modelsMap.get(id);
}

export function getModelsByTier(tier: ModelTier): ModelDefinition[] {
  return MODELS.filter((m) => m.tier === tier);
}

export function getModelsByProvider(provider: string): ModelDefinition[] {
  return MODELS.filter((m) => m.provider === provider);
}

export function getStreamingModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.streaming);
}

export function getTextModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes('text'));
}

export function getImageModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes('image-gen'));
}

export function getVideoModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes('video-gen'));
}

export function getReasoningModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes('reasoning'));
}

export function getCodeModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes('code'));
}

export function getSearchModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes('search'));
}

export function getEmbeddingModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes('embedding'));
}

export function getChatModels(): ModelDefinition[] {
  return MODELS.filter(
    (m) =>
      m.capabilities.includes('text') &&
      !m.capabilities.includes('embedding') &&
      !m.capabilities.includes('image-gen') &&
      !m.capabilities.includes('video-gen')
  );
}

export function getAllProviders(): string[] {
  return [...new Set(MODELS.map((m) => m.provider))].sort();
}

export function getAllTiers(): ModelTier[] {
  return [...new Set(MODELS.map((m) => m.tier))];
}
