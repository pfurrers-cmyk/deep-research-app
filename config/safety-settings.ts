// config/safety-settings.ts — Configurações de segurança permissivas por provedor
// Usa EXCLUSIVAMENTE parâmetros documentados nas APIs oficiais de cada provedor.
// Nenhum jailbreak, prompt injection ou técnica adversarial.
//
// Referências:
// - Google AI: https://ai.google.dev/gemini-api/docs/safety-settings
// - AI SDK Google: providerOptions.google.safetySettings (BLOCK_NONE / OFF)
// - Anthropic: Não expõe safety toggles via API — moderação server-side
// - OpenAI: Não expõe safety toggles via API — content policy server-side
// - xAI/Grok: Sem documentação de safety toggles via API
// - Meta/Llama: Sem toggles via API (safety baked into model weights)
// - DeepSeek: Sem toggles via API
// - Mistral: Sem toggles via API (safe_prompt default false, opt-in)

// ============================================================
// TIPOS
// ============================================================

export interface GoogleSafetySettings {
  safetySettings: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface ProviderSafetyOptions {
  google?: GoogleSafetySettings;
  // Anthropic, OpenAI, etc. — sem parâmetros de safety settings documentados
  // Caso surjam novos, adicionar aqui
}

// ============================================================
// CATEGORIAS GOOGLE
// ============================================================

const GOOGLE_HARM_CATEGORIES = [
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_CIVIC_INTEGRITY',
] as const;

// ============================================================
// PRESETS
// ============================================================

/**
 * Google: BLOCK_NONE para todas as categorias.
 * Documentação oficial: https://ai.google.dev/gemini-api/docs/safety-settings
 * BLOCK_NONE = "Content will not be blocked"
 * OFF = "Turn off the safety filter" (disponível em modelos mais recentes)
 */
export const GOOGLE_SAFETY_PERMISSIVE: GoogleSafetySettings = {
  safetySettings: GOOGLE_HARM_CATEGORIES.map((category) => ({
    category,
    threshold: 'BLOCK_NONE',
  })),
};

/**
 * Google: OFF para todas as categorias (máximo permissivo, modelos Gemini 2.5+).
 */
export const GOOGLE_SAFETY_OFF: GoogleSafetySettings = {
  safetySettings: GOOGLE_HARM_CATEGORIES.map((category) => ({
    category,
    threshold: 'OFF',
  })),
};

/**
 * Google: Nível padrão (sem override — usa defaults do provedor).
 */
export const GOOGLE_SAFETY_DEFAULT: GoogleSafetySettings = {
  safetySettings: [],
};

// ============================================================
// HELPER: Resolver providerOptions baseado no modelo
// ============================================================

/**
 * Retorna as providerOptions adequadas para o modelo, aplicando as
 * configurações de segurança mais permissivas documentadas.
 *
 * Para Google: aplica BLOCK_NONE em todas as categorias.
 * Para demais provedores: retorna objeto vazio (sem opções de safety disponíveis).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSafetyProviderOptions(modelId: string): Record<string, any> {
  const provider = modelId.split('/')[0]?.toLowerCase() ?? '';

  switch (provider) {
    case 'google':
      return {
        google: { ...GOOGLE_SAFETY_PERMISSIVE },
      };

    // Anthropic, OpenAI, Meta, xAI, DeepSeek, Mistral, Cohere, etc.
    // Não expõem parâmetros de safety settings via API documentada.
    // A moderação é aplicada server-side pelo provedor.
    default:
      return {};
  }
}

// ============================================================
// DOCUMENTAÇÃO DE STATUS POR PROVEDOR
// ============================================================

export const PROVIDER_SAFETY_STATUS = {
  google: {
    hasApiToggle: true,
    parameter: 'providerOptions.google.safetySettings',
    options: ['BLOCK_NONE', 'OFF', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE'],
    appliedSetting: 'BLOCK_NONE',
    notes: 'BLOCK_NONE desativa filtros para todas as categorias. OFF disponível em modelos 2.5+.',
  },
  anthropic: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'Moderação embutida server-side. Sem parâmetro de API para desativar.',
  },
  openai: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'Content policy server-side. Sem parâmetro de API para desativar.',
  },
  meta: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'Safety baked into model weights. Sem toggle via API.',
  },
  xai: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'Grok é relativamente permissivo por padrão. Sem toggle documentado.',
  },
  deepseek: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'Moderação mínima por padrão. Sem toggle via API.',
  },
  mistral: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'safe_prompt=false é o padrão. Sem necessidade de ação.',
  },
  cohere: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'Moderação server-side. Sem toggle via API.',
  },
  perplexity: {
    hasApiToggle: false,
    parameter: null,
    options: [],
    appliedSetting: null,
    notes: 'Search-focused. Moderação server-side.',
  },
} as const;
