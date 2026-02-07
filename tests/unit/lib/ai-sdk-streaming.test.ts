// tests/unit/lib/ai-sdk-streaming.test.ts — Testes de streaming com mocks do AI SDK
import { describe, it, expect } from 'vitest'
import { streamText, generateText } from 'ai'
import { createMockStreamModel, createMockTextModel, createMockObjectModel } from '../../helpers/ai-mocks'

describe('AI SDK Mock: streamText', () => {
  it('faz streaming de chunks de texto corretamente', async () => {
    const model = createMockStreamModel([
      '## Relatório\n\n',
      'Baseado na análise...\n',
      '### Conclusão\n\n',
      'Os resultados sugerem...',
    ])

    const result = streamText({
      model,
      prompt: 'Sintetize os resultados de pesquisa...',
    })

    const chunks: string[] = []
    for await (const chunk of result.textStream) {
      chunks.push(chunk)
    }

    expect(chunks.length).toBeGreaterThan(0)
    const fullText = chunks.join('')
    expect(fullText).toContain('Relatório')
    expect(fullText).toContain('Conclusão')
  })

  it('acumula texto completo ao consumir stream', async () => {
    const model = createMockStreamModel(['Chunk 1', 'Chunk 2'])

    const result = streamText({ model, prompt: 'test' })

    let accumulated = ''
    for await (const chunk of result.textStream) {
      accumulated += chunk
    }

    expect(accumulated).toContain('Chunk 1')
    expect(accumulated).toContain('Chunk 2')
  })
})

describe('AI SDK Mock: generateText', () => {
  it('gera texto completo de uma vez', async () => {
    const model = createMockTextModel('Resposta completa do modelo para a query.')

    const result = await generateText({
      model,
      prompt: 'Qual é o impacto da IA?',
    })

    expect(result.text).toBe('Resposta completa do modelo para a query.')
  })
})

describe('AI SDK Mock: generateObject (structured)', () => {
  it('gera objeto estruturado via mock', async () => {
    const expectedObj = {
      subQueries: [
        { query: 'Sub-query 1', rationale: 'Test 1' },
        { query: 'Sub-query 2', rationale: 'Test 2' },
      ],
    }
    const model = createMockObjectModel(expectedObj)

    const result = await generateText({
      model,
      prompt: 'Decompose: How is AI affecting jobs globally?',
    })

    const parsed = JSON.parse(result.text)
    expect(parsed.subQueries).toHaveLength(2)
    expect(parsed.subQueries[0].query).toBe('Sub-query 1')
  })
})
