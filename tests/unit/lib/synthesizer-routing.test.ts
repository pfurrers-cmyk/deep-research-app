// tests/unit/lib/synthesizer-routing.test.ts
// Versão B (pós-correção): Verifica que o routing TCC funciona via proSettings
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (devem vir ANTES do import do módulo testado) ──

const { mockSynthesizeTcc } = vi.hoisted(() => ({
  mockSynthesizeTcc: vi.fn(async () => '# INTRODUÇÃO\nConteúdo TCC mock'),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    textStream: (async function* () { yield 'mock report text'; })(),
    finishReason: Promise.resolve('stop'),
  })),
}));

vi.mock('@ai-sdk/gateway', () => ({
  gateway: vi.fn((id: string) => ({ modelId: id })),
}));

vi.mock('@/lib/ai/model-router', () => ({
  selectModel: vi.fn(() => ({
    modelId: 'openai/gpt-4.1-mini',
    fallbackChain: [],
    estimatedInputTokens: 1000,
    estimatedOutputTokens: 2000,
  })),
}));

vi.mock('@/lib/ai/prompts/synthesis', () => ({
  buildSynthesisPrompt: vi.fn(() => ({
    system: 'mock system prompt',
    prompt: 'mock user prompt',
  })),
}));

vi.mock('@/lib/research/section-synthesizer', () => ({
  shouldUseMultiSection: vi.fn(() => false),
  synthesizeBySection: vi.fn(async () => 'multi-section report'),
}));

// Mock TCC synthesizer com spy (usa mockSynthesizeTcc do vi.hoisted)
vi.mock('@/lib/research/tcc-synthesizer', () => ({
  synthesizeTcc: mockSynthesizeTcc,
}));

vi.mock('@/config/safety-settings', () => ({
  getSafetyProviderOptions: vi.fn(() => ({})),
}));

vi.mock('@/lib/utils/debug-logger', () => ({
  debug: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Import do módulo testado (APÓS os mocks) ──
import { synthesizeReport } from '@/lib/research/synthesizer';
import type { AppConfig, DepthPreset } from '@/config/defaults';
import type { EvaluatedSource } from '@/lib/research/types';

// ── Fixtures ──
const mockConfig = {
  resilience: { timeoutPerStageMs: { synthesis: 60000 } },
} as unknown as AppConfig;

const mockSources: EvaluatedSource[] = [{
  url: 'https://example.com/article',
  title: 'Artigo de Teste',
  snippet: 'Conteúdo relevante para teste',
  content: 'Conteúdo completo do artigo de teste',
  source: 'example.com',
  subQueryId: 'sq-1',
  author: 'Autor Teste',
  publishedDate: '2024-01-01',
  relevanceScore: 0.8,
  recencyScore: 0.7,
  authorityScore: 0.9,
  weightedScore: 0.8,
  credibilityScore: 0.85,
  credibilityTier: 'high',
  flagged: false,
  kept: true,
}];

const depth: DepthPreset = 'normal';

// ── Testes ──

// ── Marcadores semânticos ABNT vs Standard ──
const ABNT_MARKERS = [
  /INTRODUÇÃO/i,
  /REFERENCIAL TEÓRICO/i,
  /METODOLOGIA/i,
  /RESULTADOS/i,
  /CONCLUSÃO/i,
  /REFERÊNCIAS/i,
];

const STANDARD_MARKERS = [
  /resumo executivo/i,
  /key findings/i,
  /executive summary/i,
  /achados principais/i,
];

describe('Synthesizer Routing — Versão B (pós-correção)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DEVE chamar synthesizeTcc quando proSettings.researchMode === "tcc"', async () => {
    await synthesizeReport(
      'impacto da IA na educação superior brasileira',
      mockSources,
      depth,
      mockConfig,
      undefined,  // onTextDelta
      undefined,  // attachments
      undefined,  // onSectionProgress
      { researchMode: 'tcc' },  // proSettings
      { titulo: 'TCC Teste', autor: 'Autor Teste', instituicao: 'USP', curso: 'Direito', orientador: 'Prof. X' },  // tccSettings
    );

    expect(mockSynthesizeTcc).toHaveBeenCalledTimes(1);
    expect(mockSynthesizeTcc).toHaveBeenCalledWith(
      'impacto da IA na educação superior brasileira',
      mockSources,
      depth,
      mockConfig,
      undefined,  // onTextDelta
      undefined,  // onSectionProgress
      undefined,  // attachments
      { titulo: 'TCC Teste', autor: 'Autor Teste', instituicao: 'USP', curso: 'Direito', orientador: 'Prof. X' },  // tccSettings
    );
  });

  it('NÃO deve chamar synthesizeTcc quando proSettings é undefined', async () => {
    await synthesizeReport(
      'pesquisa genérica sobre economia',
      mockSources,
      depth,
      mockConfig,
    );

    expect(mockSynthesizeTcc).not.toHaveBeenCalled();
  });

  it('NÃO deve chamar synthesizeTcc quando researchMode === "standard"', async () => {
    await synthesizeReport(
      'análise de mercado financeiro',
      mockSources,
      depth,
      mockConfig,
      undefined,  // onTextDelta
      undefined,  // attachments
      undefined,  // onSectionProgress
      { researchMode: 'standard' },  // proSettings explícito
    );

    expect(mockSynthesizeTcc).not.toHaveBeenCalled();
  });

  it('Conteúdo TCC mock contém marcadores ABNT', async () => {
    const result = await synthesizeReport(
      'impacto da IA na educação superior brasileira',
      mockSources,
      depth,
      mockConfig,
      undefined,
      undefined,
      undefined,
      { researchMode: 'tcc' },
      { titulo: 'TCC Teste' },
    );

    // O mock retorna "# INTRODUÇÃO\nConteúdo TCC mock"
    // Verificar que pelo menos o marcador INTRODUÇÃO está presente
    expect(result).toMatch(ABNT_MARKERS[0]); // INTRODUÇÃO

    // Verificar que marcadores standard NÃO estão presentes
    for (const marker of STANDARD_MARKERS) {
      expect(result).not.toMatch(marker);
    }
  });

  it('Conteúdo standard NÃO contém marcadores ABNT exclusivos', async () => {
    const result = await synthesizeReport(
      'pesquisa genérica',
      mockSources,
      depth,
      mockConfig,
    );

    // O mock standard retorna "mock report text"
    // Verificar que NÃO contém marcadores ABNT
    expect(result).not.toMatch(/REFERENCIAL TEÓRICO/i);
    expect(result).not.toMatch(/METODOLOGIA/i);
  });
});
