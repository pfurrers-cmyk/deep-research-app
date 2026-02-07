// tests/helpers/ai-mocks.ts — Mock factories for AI SDK 6 testing
import { MockLanguageModelV3 } from 'ai/test'
import { simulateReadableStream } from 'ai'

// Helper: build usage object matching LanguageModelV3Usage (all optional fields included)
function makeUsage(input: number, output: number) {
  return {
    inputTokens: { total: input, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: output, text: undefined, reasoning: undefined },
  } as any
}

// ==============================
// MOCK PARA generateText / generateObject
// ==============================
export function createMockTextModel(response: string) {
  return new MockLanguageModelV3({
    doGenerate: async () => ({
      content: [{ type: 'text', text: response }],
      finishReason: { unified: 'stop', raw: undefined },
      usage: makeUsage(10, 20),
      warnings: [],
    }),
  } as any)
}

// ==============================
// MOCK PARA streamText
// ==============================
export function createMockStreamModel(chunks: string[]) {
  return new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: 0,
        chunkDelayInMs: 5,
        chunks: [
          ...chunks.map((text, i) => [
            { type: 'text-start', id: `text-${i}` },
            { type: 'text-delta', id: `text-${i}`, delta: text },
            { type: 'text-end', id: `text-${i}` },
          ]).flat(),
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            usage: makeUsage(10, 50),
          },
        ],
      }),
    }),
  } as any)
}

// ==============================
// MOCK PARA generateObject (structured output)
// ==============================
export function createMockObjectModel<T>(object: T) {
  return new MockLanguageModelV3({
    doGenerate: async () => ({
      content: [{ type: 'text', text: JSON.stringify(object) }],
      finishReason: { unified: 'stop', raw: undefined },
      usage: makeUsage(15, 30),
      warnings: [],
    }),
  } as any)
}

// ==============================
// MOCK PARA DECOMPOSITION (sub-queries)
// ==============================
export function createDecompositionMock(subQueries: string[]) {
  return createMockObjectModel({
    reasoning: 'Test reasoning',
    complexity: 'moderate',
    subQueries: subQueries.map((q, i) => ({
      text: q,
      textEn: q,
      justification: `Testing rationale for: ${q}`,
      language: 'pt',
      priority: i === 0 ? 'high' : 'medium',
      angle: 'conceptual',
      searchTerms: [q.split(' ').slice(0, 3).join(' ')],
      searchTermsPt: [q],
      expectedSourceType: 'academic',
    })),
  })
}

// ==============================
// MOCK PARA EVALUATION (CRAAP scoring)
// ==============================
export function createEvaluationMock(urls: string[], score = 0.7) {
  return createMockObjectModel({
    diversityWarning: null,
    evaluations: urls.map((url) => ({
      url,
      rationale: `Mock evaluation for ${url}`,
      relevanceScore: score,
      recencyScore: score,
      authorityScore: score,
      biasScore: score,
      sourceTier: 'secondary' as const,
      contradicts: undefined,
    })),
  })
}

// ==============================
// MOCK PARA SYNTHESIS (streaming report)
// ==============================
export function createSynthesisMock(reportSections: string[]) {
  return createMockStreamModel(reportSections)
}
