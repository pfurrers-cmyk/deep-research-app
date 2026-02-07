// tests/helpers/fixtures.ts — Test data factories matching the actual project types
import type { SearchResult, EvaluatedSource, SubQuery, ResearchMetadata, CostBreakdown } from '@/lib/research/types'
import type { UserPreferences } from '@/lib/config/settings-store'

export function createMockSubQuery(overrides: Partial<SubQuery> = {}): SubQuery {
  return {
    id: 'sq_0',
    text: 'Impacto da IA na educação brasileira',
    textEn: 'Impact of AI on Brazilian education',
    justification: 'Test justification',
    language: 'pt',
    priority: 'high',
    angle: 'conceptual',
    searchTerms: ['AI education impact'],
    searchTermsPt: ['IA educação impacto'],
    expectedSourceType: 'academic',
    status: 'completed',
    resultCount: 5,
    ...overrides,
  }
}

export function createMockSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    url: 'https://example.com/research',
    title: 'Test Research Result',
    snippet: 'This is a test snippet for research results.',
    content: 'Full content of the test research result for analysis.',
    source: 'https://example.com',
    publishedDate: '2025-06-15',
    author: 'Test Author',
    language: 'pt',
    subQueryId: 'sq_0',
    ...overrides,
  }
}

export function createMockEvaluatedSource(overrides: Partial<EvaluatedSource> = {}): EvaluatedSource {
  return {
    ...createMockSearchResult(),
    relevanceScore: 0.8,
    recencyScore: 0.7,
    authorityScore: 0.75,
    biasScore: 0.6,
    weightedScore: 0.75,
    credibilityScore: 0.8,
    credibilityTier: 'high',
    sourceTier: 'secondary',
    rationale: 'Mock evaluation rationale',
    flagged: false,
    kept: true,
    ...overrides,
  }
}

export function createMockMetadata(overrides: Partial<ResearchMetadata> = {}): ResearchMetadata {
  return {
    id: 'r_test_123',
    query: 'Test query',
    title: 'Test Research',
    depth: 'normal',
    domainPreset: null,
    modelPreference: 'auto',
    totalSources: 10,
    totalSourcesKept: 7,
    totalSourcesFiltered: 3,
    durationMs: 15000,
    modelsUsed: ['openai/gpt-4.1-mini'],
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    pipelineVersion: '1.0.0',
    ...overrides,
  }
}

export function createMockCostBreakdown(overrides: Partial<CostBreakdown> = {}): CostBreakdown {
  return {
    entries: [],
    totalCostUSD: 0.05,
    byStage: { decomposition: 0.01, evaluation: 0.02, synthesis: 0.02 },
    byModel: { 'openai/gpt-4.1-mini': 0.05 },
    ...overrides,
  }
}

export function createMockPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    defaultDepth: 'normal',
    modelPreference: 'auto',
    outputLanguage: 'pt-BR',
    stageModels: { decomposition: 'auto', evaluation: 'auto', synthesis: 'auto' },
    customPrompts: { decomposition: '', evaluation: '', synthesis: '' },
    sourceConfig: { mode: 'auto', fetchMin: 5, fetchMax: 50, keepMin: 3, keepMax: 20 },
    pro: {
      writingStyle: 'academic',
      detailLevel: 'standard',
      reasoningLanguage: 'auto',
      citationFormat: 'inline_numbered',
      evaluationFramework: 'craap',
      researchMode: 'standard',
      enabledSections: ['executive_summary', 'context', 'key_findings', 'analysis', 'conclusion', 'sources'],
      sectionOrder: ['executive_summary', 'context', 'key_findings', 'analysis', 'conclusion', 'sources'],
      advancedFilters: { recency: null, sourceTypes: [], languages: ['pt', 'en'], allowlist: [], blocklist: [] },
      exportFormat: 'markdown',
    },
    tcc: {
      titulo: '',
      autor: '',
      instituicao: '',
      curso: '',
      orientador: '',
      cidade: '',
      ano: new Date().getFullYear().toString(),
      minFontes: 15,
      enabledSections: ['capa', 'folha_rosto', 'resumo', 'abstract', 'sumario', 'introducao', 'referencial_teorico', 'metodologia', 'resultados', 'conclusao', 'referencias'],
    },
    defaultChatModel: 'openai/gpt-4.1-mini',
    chatSystemPrompt: '',
    defaultTheme: 'dark',
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}
