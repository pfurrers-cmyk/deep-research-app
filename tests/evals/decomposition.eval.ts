// tests/evals/decomposition.eval.ts — LLM Eval: qualidade de decomposição de queries
import { describe, it, expect } from 'vitest'
import { gateway } from '@ai-sdk/gateway'
import { generateText } from 'ai'
import { scoreDecompositionQuality } from './scoring/llm-judge'

const DECOMPOSITION_CASES = [
  {
    query: 'How is artificial intelligence impacting global healthcare systems?',
    minSubQueries: 3,
    maxSubQueries: 7,
  },
  {
    query: 'What are the environmental consequences of cryptocurrency mining?',
    minSubQueries: 3,
    maxSubQueries: 7,
  },
  {
    query: 'Como a IA está transformando a educação no Brasil?',
    minSubQueries: 3,
    maxSubQueries: 7,
  },
]

describe.concurrent('LLM Eval: Query Decomposition', () => {
  for (const testCase of DECOMPOSITION_CASES) {
    it(`decomposes: "${testCase.query.slice(0, 50)}..."`, async () => {
      const result = await generateText({
        model: gateway('openai/gpt-4.1-mini'),
        prompt: `Decompose this research query into ${testCase.minSubQueries}-${testCase.maxSubQueries} focused sub-queries.
Return ONLY a JSON object: { "subQueries": [{ "query": "...", "rationale": "...", "searchType": "web|academic|news" }] }

Query: "${testCase.query}"`,
      })

      let parsed: { subQueries: Array<{ query: string; rationale: string; searchType: string }> }
      try {
        parsed = JSON.parse(result.text)
      } catch {
        // Try extracting JSON from markdown code block
        const jsonMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)```/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result.text)
      }

      // Structural assertions
      expect(parsed.subQueries.length).toBeGreaterThanOrEqual(testCase.minSubQueries)
      expect(parsed.subQueries.length).toBeLessThanOrEqual(testCase.maxSubQueries)

      // LLM-as-Judge scoring
      const judgment = await scoreDecompositionQuality(
        testCase.query,
        JSON.stringify(parsed.subQueries)
      )

      console.log(`[EVAL] Decomposition "${testCase.query.slice(0, 30)}...": score=${judgment.score}`)
      console.log(`       Rationale: ${judgment.rationale}`)

      expect(judgment.score).toBeGreaterThan(0.6)
    })
  }
})
