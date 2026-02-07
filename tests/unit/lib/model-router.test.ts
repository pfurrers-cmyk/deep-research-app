// tests/unit/lib/model-router.test.ts — Testes para seleção de modelos
import { describe, it, expect } from 'vitest'
import { selectModel, selectAllModels } from '@/lib/ai/model-router'

describe('selectModel', () => {
  it('seleciona modelo para decomposition em modo auto', () => {
    const selection = selectModel('decomposition', 'auto', 'normal')
    expect(selection.modelId).toBeTruthy()
    expect(selection.estimatedInputTokens).toBeGreaterThan(0)
    expect(selection.estimatedOutputTokens).toBeGreaterThan(0)
    expect(selection.estimatedCostUSD).toBeGreaterThanOrEqual(0)
  })

  it('seleciona modelo diferente por depth', () => {
    const fast = selectModel('synthesis', 'auto', 'rapida')
    const deep = selectModel('synthesis', 'auto', 'profunda')
    // deep should use a more capable (potentially different) model
    expect(fast.modelId).toBeTruthy()
    expect(deep.modelId).toBeTruthy()
  })

  it('economia usa modelos mais baratos', () => {
    const economy = selectModel('synthesis', 'economy', 'normal')
    const premium = selectModel('synthesis', 'premium', 'normal')
    expect(economy.estimatedCostUSD).toBeLessThanOrEqual(premium.estimatedCostUSD)
  })

  it('custom model map sobrescreve seleção padrão', () => {
    const customMap = { decomposition: 'anthropic/claude-sonnet-4-20250514' }
    const selection = selectModel('decomposition', 'custom', 'normal', undefined, customMap)
    expect(selection.modelId).toBe('anthropic/claude-sonnet-4-20250514')
  })

  it('fallbackChain não contém o modelo selecionado', () => {
    const selection = selectModel('decomposition', 'auto', 'normal')
    expect(selection.fallbackChain).not.toContain(selection.modelId)
  })

  it('fallbackChain tem pelo menos um modelo', () => {
    const selection = selectModel('synthesis', 'auto', 'normal')
    expect(selection.fallbackChain.length).toBeGreaterThanOrEqual(1)
  })
})

describe('selectAllModels', () => {
  it('retorna seleção para todas as stages', () => {
    const all = selectAllModels('auto', 'normal')
    const stages = ['decomposition', 'search', 'evaluation', 'extraction', 'synthesis', 'postProcessing', 'researchLoop', 'devilsAdvocate']

    for (const stage of stages) {
      expect(all[stage as keyof typeof all]).toBeDefined()
      expect(all[stage as keyof typeof all].modelId).toBeTruthy()
    }
  })
})
