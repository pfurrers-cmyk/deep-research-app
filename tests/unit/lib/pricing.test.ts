// tests/unit/lib/pricing.test.ts — Testes para cálculo de custos
import { describe, it, expect } from 'vitest'
import { calculateCost, estimateSearchCost, formatCostUSD, SEARCH_COST_PER_REQUEST } from '@/config/pricing'

describe('calculateCost', () => {
  it('retorna 0 para modelo inexistente', () => {
    expect(calculateCost('fake/model', 1000, 1000)).toBe(0)
  })

  it('calcula custo proporcional a tokens', () => {
    const cost1 = calculateCost('openai/gpt-4.1-mini', 1000, 500)
    const cost2 = calculateCost('openai/gpt-4.1-mini', 2000, 1000)
    expect(cost2).toBeCloseTo(cost1 * 2, 8)
  })

  it('retorna custo positivo para modelos reais', () => {
    const cost = calculateCost('openai/gpt-4.1-mini', 10000, 5000)
    expect(cost).toBeGreaterThan(0)
  })

  it('custo de 0 tokens é 0', () => {
    expect(calculateCost('openai/gpt-4.1-mini', 0, 0)).toBe(0)
  })
})

describe('estimateSearchCost', () => {
  it('calcula custo de busca corretamente', () => {
    expect(estimateSearchCost(1)).toBe(SEARCH_COST_PER_REQUEST)
    expect(estimateSearchCost(5)).toBe(SEARCH_COST_PER_REQUEST * 5)
    expect(estimateSearchCost(0)).toBe(0)
  })
})

describe('formatCostUSD', () => {
  it('formata custos menores que $0.01', () => {
    expect(formatCostUSD(0.005)).toBe('<$0.01')
    expect(formatCostUSD(0.001)).toBe('<$0.01')
  })

  it('formata custos >= $0.01 com 2 casas decimais', () => {
    expect(formatCostUSD(0.05)).toBe('$0.05')
    expect(formatCostUSD(1.234)).toBe('$1.23')
    expect(formatCostUSD(10)).toBe('$10.00')
  })
})
