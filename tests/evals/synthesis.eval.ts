// tests/evals/synthesis.eval.ts — LLM Eval: qualidade de síntese de relatórios
import { describe, it, expect } from 'vitest'
import { gateway } from '@ai-sdk/gateway'
import { streamText } from 'ai'
import { scoreSynthesisQuality } from './scoring/llm-judge'

describe.concurrent('LLM Eval: Report Synthesis', () => {
  it('gera report de qualidade para query complexa', async () => {
    const query = 'Impact of AI on global labor markets'
    const mockSources = `
    Source 1: World Economic Forum reports 85 million jobs displaced by 2025
    Source 2: McKinsey estimates 400 million workers affected globally
    Source 3: MIT study shows AI creates new job categories
    Source 4: ILO report on developing nations and automation risks
    `

    const result = streamText({
      model: gateway('openai/gpt-4.1-mini'),
      prompt: `Synthesize a research report about: ${query}
      Based on these sources: ${mockSources}
      Include proper citations, balanced analysis, and clear sections with headings.
      Write at least 500 words.`,
    })

    let fullReport = ''
    for await (const chunk of result.textStream) {
      fullReport += chunk
    }

    // Structural checks
    expect(fullReport.length).toBeGreaterThan(300)
    expect(fullReport).toMatch(/##|###/)

    // LLM-as-Judge
    const judgment = await scoreSynthesisQuality(query, fullReport, mockSources)
    console.log(`[EVAL] Synthesis quality: score=${judgment.score}`)
    console.log(`       Rationale: ${judgment.rationale}`)
    expect(judgment.score).toBeGreaterThan(0.6)
  })

  it('sintetiza em português quando solicitado', async () => {
    const query = 'Impacto da inteligência artificial no mercado de trabalho brasileiro'

    const result = streamText({
      model: gateway('openai/gpt-4.1-mini'),
      prompt: `Sintetize um relatório de pesquisa em PORTUGUÊS sobre: ${query}
      Inclua seções com títulos (##), análise equilibrada e pelo menos 300 palavras.`,
    })

    let fullReport = ''
    for await (const chunk of result.textStream) {
      fullReport += chunk
    }

    expect(fullReport.length).toBeGreaterThan(200)
    // Should contain Portuguese words
    expect(fullReport).toMatch(/resultados|análise|conclus|impacto/i)
  })
})
