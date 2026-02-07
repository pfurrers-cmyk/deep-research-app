// ═══════════════════════════════════════════════════════════════
// AUTO-GENERATED — Limites de fontes por modelo (Base / Extended / Ultra)
// Margem de segurança: 15% | Gerado em: 07/02/2026 17:07
// ═══════════════════════════════════════════════════════════════

export interface SourceModeLimits {
  maxSearch: number;
  maxSelect: number;
}

export interface ModelSourceLimits {
  base: SourceModeLimits;
  extended: SourceModeLimits;
  ultra?: SourceModeLimits;
  contextK: number;
}

export type ProcessingMode = 'base' | 'extended' | 'ultra';

export const MODEL_SOURCE_LIMITS: Record<string, ModelSourceLimits> = {
  // 🟢 Ultra (≥1000K)
  "xai/grok-4-fast-non-reasoning": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 2000 },
  "xai/grok-4-fast-reasoning": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 2000 },
  "xai/grok-4.1-fast-non-reasoning": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 2000 },
  "xai/grok-4.1-fast-reasoning": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 2000 },
  "google/gemini-2.0-flash": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1049 },
  "google/gemini-2.0-flash-lite": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1049 },
  "google/gemini-2.5-flash-lite": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1049 },
  "google/gemini-2.5-flash-lite-preview-09-2025": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1049 },
  "google/gemini-2.5-pro": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1049 },
  "openai/gpt-4.1": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, contextK: 1048 },
  "openai/gpt-4.1-mini": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1048 },
  "openai/gpt-4.1-nano": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1048 },
  "alibaba/qwen3-coder-plus": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "amazon/nova-2-lite": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "anthropic/claude-opus-4.6": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "anthropic/claude-sonnet-4": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "anthropic/claude-sonnet-4.5": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "google/gemini-2.5-flash": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "google/gemini-2.5-flash-preview-09-2025": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "google/gemini-3-flash": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  "google/gemini-3-pro-preview": { base: { maxSearch: 150, maxSelect: 60 }, extended: { maxSearch: 350, maxSelect: 140 }, ultra: { maxSearch: 500, maxSelect: 200 }, contextK: 1000 },
  // 🔵 Muito Alto (400K–999K)
  "meta/llama-4-maverick": { base: { maxSearch: 108, maxSelect: 43 }, extended: { maxSearch: 270, maxSelect: 108 }, ultra: { maxSearch: 432, maxSelect: 172 }, contextK: 524 },
  "openai/gpt-5": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5-codex": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5-mini": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5-nano": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5-pro": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5.1-codex": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5.1-codex-max": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5.1-codex-mini": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5.1-thinking": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5.2": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5.2-codex": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  "openai/gpt-5.2-pro": { base: { maxSearch: 81, maxSelect: 32 }, extended: { maxSearch: 202, maxSelect: 80 }, ultra: { maxSearch: 324, maxSelect: 129 }, contextK: 400 },
  // 🟣 Alto (200K–399K)
  "amazon/nova-lite": { base: { maxSearch: 60, maxSelect: 24 }, extended: { maxSearch: 150, maxSelect: 60 }, ultra: { maxSearch: 240, maxSelect: 96 }, contextK: 300 },
  "amazon/nova-pro": { base: { maxSearch: 60, maxSelect: 24 }, extended: { maxSearch: 150, maxSelect: 60 }, ultra: { maxSearch: 240, maxSelect: 96 }, contextK: 300 },
  "alibaba/qwen3-235b-a22b-thinking": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "alibaba/qwen3-coder": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "alibaba/qwen3-coder-30b-a3b": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "alibaba/qwen3-max": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, contextK: 262 },
  "alibaba/qwen3-max-preview": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "alibaba/qwen3-next-80b-a3b-instruct": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "alibaba/qwen3-vl-instruct": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "moonshotai/kimi-k2-0905": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "moonshotai/kimi-k2-thinking": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "moonshotai/kimi-k2-thinking-turbo": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "moonshotai/kimi-k2.5": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "nvidia/nemotron-3-nano-30b-a3b": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "xiaomi/mimo-v2-flash": { base: { maxSearch: 52, maxSelect: 20 }, extended: { maxSearch: 130, maxSelect: 52 }, ultra: { maxSearch: 208, maxSelect: 83 }, contextK: 262 },
  "alibaba/qwen3-coder-next": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "alibaba/qwen3-max-thinking": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, contextK: 256 },
  "alibaba/qwen3-vl-thinking": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "bytedance/seed-1.6": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "bytedance/seed-1.8": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "cohere/command-a": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "kwaipilot/kat-coder-pro-v1": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "mistral/devstral-2": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "mistral/devstral-small-2": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "mistral/ministral-14b": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "mistral/mistral-large-3": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "moonshotai/kimi-k2-turbo": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "xai/grok-4": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "xai/grok-code-fast-1": { base: { maxSearch: 51, maxSelect: 20 }, extended: { maxSearch: 127, maxSelect: 50 }, ultra: { maxSearch: 204, maxSelect: 81 }, contextK: 256 },
  "minimax/minimax-m2": { base: { maxSearch: 40, maxSelect: 16 }, extended: { maxSearch: 100, maxSelect: 40 }, ultra: { maxSearch: 160, maxSelect: 64 }, contextK: 205 },
  "minimax/minimax-m2.1": { base: { maxSearch: 40, maxSelect: 16 }, extended: { maxSearch: 100, maxSelect: 40 }, ultra: { maxSearch: 160, maxSelect: 64 }, contextK: 205 },
  "minimax/minimax-m2.1-lightning": { base: { maxSearch: 40, maxSelect: 16 }, extended: { maxSearch: 100, maxSelect: 40 }, ultra: { maxSearch: 160, maxSelect: 64 }, contextK: 205 },
  "zai/glm-4.6": { base: { maxSearch: 40, maxSelect: 16 }, extended: { maxSearch: 100, maxSelect: 40 }, ultra: { maxSearch: 160, maxSelect: 64 }, contextK: 205 },
  "zai/glm-4.7": { base: { maxSearch: 40, maxSelect: 16 }, extended: { maxSearch: 100, maxSelect: 40 }, ultra: { maxSearch: 160, maxSelect: 64 }, contextK: 205 },
  "anthropic/claude-3-haiku": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "anthropic/claude-3-opus": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, contextK: 200 },
  "anthropic/claude-3.5-haiku": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "anthropic/claude-3.5-sonnet": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "anthropic/claude-3.5-sonnet-20240620": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "anthropic/claude-3.7-sonnet": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "anthropic/claude-haiku-4.5": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "anthropic/claude-opus-4": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, contextK: 200 },
  "anthropic/claude-opus-4.1": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, contextK: 200 },
  "anthropic/claude-opus-4.5": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "openai/codex-mini": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "openai/o1": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "openai/o3": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "openai/o3-deep-research": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "openai/o3-mini": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "openai/o3-pro": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "openai/o4-mini": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "perplexity/sonar-pro": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "zai/glm-4.7-flash": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, ultra: { maxSearch: 156, maxSelect: 62 }, contextK: 200 },
  "zai/glm-4.7-flashx": { base: { maxSearch: 39, maxSelect: 15 }, extended: { maxSearch: 97, maxSelect: 38 }, contextK: 200 },
  // 🟡 Médio (128K–199K)
  "deepseek/deepseek-r1": { base: { maxSearch: 31, maxSelect: 12 }, extended: { maxSearch: 77, maxSelect: 30 }, ultra: { maxSearch: 124, maxSelect: 49 }, contextK: 164 },
  "deepseek/deepseek-v3": { base: { maxSearch: 31, maxSelect: 12 }, extended: { maxSearch: 77, maxSelect: 30 }, ultra: { maxSearch: 124, maxSelect: 49 }, contextK: 164 },
  "deepseek/deepseek-v3.1": { base: { maxSearch: 31, maxSelect: 12 }, extended: { maxSearch: 77, maxSelect: 30 }, ultra: { maxSearch: 124, maxSelect: 49 }, contextK: 164 },
  "deepseek/deepseek-v3.2": { base: { maxSearch: 31, maxSelect: 12 }, extended: { maxSearch: 77, maxSelect: 30 }, contextK: 164 },
  "deepseek/deepseek-v3.2-exp": { base: { maxSearch: 31, maxSelect: 12 }, extended: { maxSearch: 77, maxSelect: 30 }, contextK: 164 },
  "alibaba/qwen-3-235b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, contextK: 131 },
  "alibaba/qwen-3-32b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "alibaba/qwen3-next-80b-a3b-thinking": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "arcee-ai/trinity-large-preview": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, contextK: 131 },
  "arcee-ai/trinity-mini": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "deepseek/deepseek-v3.1-terminus": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, contextK: 131 },
  "meta/llama-3.1-70b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, contextK: 131 },
  "meta/llama-3.1-8b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "meta/llama-4-scout": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "mistral/mistral-nemo": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "moonshotai/kimi-k2": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "nvidia/nemotron-nano-12b-v2-vl": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "nvidia/nemotron-nano-9b-v2": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "openai/gpt-oss-120b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "openai/gpt-oss-20b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "openai/gpt-oss-safeguard-20b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "prime-intellect/intellect-3": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "xai/grok-3": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "xai/grok-3-fast": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "xai/grok-3-mini": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "xai/grok-3-mini-fast": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "zai/glm-4.5": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 131 },
  "amazon/nova-micro": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "deepseek/deepseek-v3.2-thinking": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, contextK: 128 },
  "meituan/longcat-flash-chat": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "meituan/longcat-flash-thinking": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "meta/llama-3.2-11b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "meta/llama-3.2-1b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "meta/llama-3.2-3b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "meta/llama-3.2-90b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "meta/llama-3.3-70b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/codestral": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/devstral-small": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/magistral-medium": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/magistral-small": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/ministral-3b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/ministral-8b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/mistral-medium": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/pixtral-12b": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "mistral/pixtral-large": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "openai/gpt-4-turbo": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, contextK: 128 },
  "openai/gpt-4o": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "openai/gpt-4o-mini": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "openai/gpt-4o-mini-search-preview": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "openai/gpt-5-chat": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "openai/gpt-5.1-instant": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "openai/gpt-5.2-chat": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "vercel/v0-1.0-md": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "vercel/v0-1.5-md": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "zai/glm-4.5-air": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "zai/glm-4.6v": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  "zai/glm-4.6v-flash": { base: { maxSearch: 24, maxSelect: 9 }, extended: { maxSearch: 60, maxSelect: 24 }, ultra: { maxSearch: 96, maxSelect: 38 }, contextK: 128 },
  // 🟠 Moderado (64K–127K)
  "perplexity/sonar": { base: { maxSearch: 23, maxSelect: 9 }, extended: { maxSearch: 57, maxSelect: 22 }, contextK: 127 },
  "perplexity/sonar-reasoning": { base: { maxSearch: 23, maxSelect: 9 }, extended: { maxSearch: 57, maxSelect: 22 }, contextK: 127 },
  "perplexity/sonar-reasoning-pro": { base: { maxSearch: 23, maxSelect: 9 }, extended: { maxSearch: 57, maxSelect: 22 }, contextK: 127 },
  "morph/morph-v3-fast": { base: { maxSearch: 14, maxSelect: 5 }, extended: { maxSearch: 35, maxSelect: 14 }, contextK: 82 },
  "morph/morph-v3-large": { base: { maxSearch: 14, maxSelect: 5 }, extended: { maxSearch: 35, maxSelect: 14 }, contextK: 82 },
  "alibaba/qwen-3-14b": { base: { maxSearch: 10, maxSelect: 4 }, extended: { maxSearch: 25, maxSelect: 10 }, contextK: 66 },
  "alibaba/qwen-3-30b": { base: { maxSearch: 10, maxSelect: 4 }, extended: { maxSearch: 25, maxSelect: 10 }, contextK: 66 },
  "mistral/mixtral-8x22b-instruct": { base: { maxSearch: 10, maxSelect: 4 }, extended: { maxSearch: 25, maxSelect: 10 }, contextK: 66 },
  // 🔴 Básico (<64K)
  "meituan/longcat-flash-thinking-2601": { base: { maxSearch: 3, maxSelect: 2 }, extended: { maxSearch: 7, maxSelect: 2 }, contextK: 33 },
  "xai/grok-2-vision": { base: { maxSearch: 3, maxSelect: 2 }, extended: { maxSearch: 7, maxSelect: 2 }, contextK: 33 },
  "inception/mercury-coder-small": { base: { maxSearch: 3, maxSelect: 2 }, extended: { maxSearch: 7, maxSelect: 2 }, contextK: 32 },
  "mistral/mistral-small": { base: { maxSearch: 3, maxSelect: 2 }, extended: { maxSearch: 7, maxSelect: 2 }, contextK: 32 },
  "zai/glm-4.5v": { base: { maxSearch: 3, maxSelect: 2 }, extended: { maxSearch: 7, maxSelect: 2 }, contextK: 32 },
  "openai/gpt-3.5-turbo": { base: { maxSearch: 3, maxSelect: 2 }, extended: { maxSearch: 3, maxSelect: 2 }, contextK: 16 },
  "openai/gpt-3.5-turbo-instruct": { base: { maxSearch: 3, maxSelect: 2 }, extended: { maxSearch: 3, maxSelect: 2 }, contextK: 8 },
};

export const DEFAULT_SOURCE_LIMITS: ModelSourceLimits = {
  base: { maxSearch: 10, maxSelect: 4 },
  extended: { maxSearch: 25, maxSelect: 10 },
  contextK: 128,
};

/**
 * Determina o modo de processamento com base nas fontes configuradas vs limites do modelo.
 * REGRA: fontes <= base → 'base' | fontes <= extended → 'extended' | fontes <= ultra → 'ultra'
 */
export function resolveProcessingMode(
  modelId: string,
  userSearchCount: number,
  userSelectCount: number,
): {
  mode: ProcessingMode;
  effectiveSearchCount: number;
  effectiveSelectCount: number;
  limits: ModelSourceLimits;
  clamped: boolean;
} {
  const limits = MODEL_SOURCE_LIMITS[modelId] ?? DEFAULT_SOURCE_LIMITS;

  if (userSearchCount <= limits.base.maxSearch) {
    return {
      mode: 'base',
      effectiveSearchCount: userSearchCount,
      effectiveSelectCount: Math.min(userSelectCount, limits.base.maxSelect),
      limits,
      clamped: false,
    };
  }

  if (userSearchCount <= limits.extended.maxSearch) {
    return {
      mode: 'extended',
      effectiveSearchCount: userSearchCount,
      effectiveSelectCount: Math.min(userSelectCount, limits.extended.maxSelect),
      limits,
      clamped: false,
    };
  }

  if (limits.ultra && userSearchCount <= limits.ultra.maxSearch) {
    return {
      mode: 'ultra',
      effectiveSearchCount: userSearchCount,
      effectiveSelectCount: Math.min(userSelectCount, limits.ultra.maxSelect),
      limits,
      clamped: false,
    };
  }

  const maxAvailable = limits.ultra ?? limits.extended;
  return {
    mode: limits.ultra ? 'ultra' : 'extended',
    effectiveSearchCount: maxAvailable.maxSearch,
    effectiveSelectCount: Math.min(userSelectCount, maxAvailable.maxSelect),
    limits,
    clamped: true,
  };
}

/** Tamanho ideal de batch MAP (~60% do base, mín 3) */
export function getMapBatchSize(modelId: string): number {
  const limits = MODEL_SOURCE_LIMITS[modelId] ?? DEFAULT_SOURCE_LIMITS;
  return Math.max(3, Math.floor(limits.base.maxSelect * 0.6));
}

/** Estimativas de overhead por modo */
export function getModeOverhead(mode: ProcessingMode): {
  costMultiplier: number;
  latencyMultiplier: number;
  label: string;
  labelShort: string;
  description: string;
  color: string;
} {
  switch (mode) {
    case 'base':
      return {
        costMultiplier: 1,
        latencyMultiplier: 1,
        label: 'Direto (Single-Pass)',
        labelShort: 'Direto',
        description: 'Todas as fontes processadas em uma única chamada.',
        color: 'green',
      };
    case 'extended':
      return {
        costMultiplier: 2.5,
        latencyMultiplier: 3,
        label: 'Map-Reduce',
        labelShort: 'Map-Reduce',
        description: 'Fontes processadas em batches paralelos, depois combinadas.',
        color: 'blue',
      };
    case 'ultra':
      return {
        costMultiplier: 5,
        latencyMultiplier: 6,
        label: 'Iterativo + Verificação',
        labelShort: 'Iterativo',
        description: 'Map-Reduce + enriquecimento iterativo + verificação cruzada.',
        color: 'yellow',
      };
  }
}

/** Returns the absolute maximum sources a model supports across all modes */
export function getAbsoluteMaxSources(modelId: string): { maxSearch: number; maxSelect: number } {
  const limits = MODEL_SOURCE_LIMITS[modelId] ?? DEFAULT_SOURCE_LIMITS;
  const max = limits.ultra ?? limits.extended;
  return { maxSearch: max.maxSearch, maxSelect: max.maxSelect };
}
