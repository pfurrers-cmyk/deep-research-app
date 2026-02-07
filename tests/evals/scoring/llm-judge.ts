// tests/evals/scoring/llm-judge.ts — LLM-as-Judge scorer via AI Gateway
import { gateway } from '@ai-sdk/gateway'
import { generateText } from 'ai'

interface Judgment {
  score: number
  rationale: string
}

/**
 * LLM-as-Judge scorer genérico.
 * Usa o Vercel AI Gateway para avaliar outputs de LLM.
 */
export async function llmJudge({
  criteria,
  input,
  output,
  expected,
}: {
  criteria: string
  input: string
  output: string
  expected?: string
}): Promise<Judgment> {
  try {
    const result = await generateText({
      model: gateway('openai/gpt-4.1-mini'),
      prompt: `You are an expert evaluator. Score the following output on a scale of 0 to 1.

CRITERIA: ${criteria}
INPUT: ${input}
OUTPUT: ${output}
${expected ? `EXPECTED: ${expected}` : ''}

Respond with ONLY a JSON object: { "score": <0-1>, "rationale": "<explanation>" }
No other text.`,
    })

    const parsed = JSON.parse(result.text) as Judgment
    return {
      score: Math.max(0, Math.min(1, parsed.score)),
      rationale: parsed.rationale || 'No rationale provided',
    }
  } catch (err) {
    console.error('LLM Judge failed:', err)
    return { score: 0, rationale: `Judge error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function scoreDecompositionQuality(input: string, output: string): Promise<Judgment> {
  return llmJudge({
    criteria: `Evaluate the quality of query decomposition. The sub-queries should be:
    1. Comprehensive (cover different aspects of the main query)
    2. Non-overlapping (each sub-query addresses a unique angle)
    3. Searchable (practical for web/academic search engines)
    4. Relevant (directly connected to the original query)`,
    input,
    output,
  })
}

export async function scoreSynthesisQuality(input: string, output: string, sources: string): Promise<Judgment> {
  return llmJudge({
    criteria: `Evaluate the quality of the research synthesis. The report should:
    1. Be well-structured with clear sections
    2. Accurately represent the source material
    3. Provide balanced perspectives
    4. Include proper citations
    5. Draw meaningful conclusions`,
    input: `Query: ${input}\nSources: ${sources}`,
    output,
  })
}
