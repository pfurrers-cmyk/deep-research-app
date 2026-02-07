// tests/unit/lib/cost-estimator.test.ts — Testes para CostTracker
import { describe, it, expect } from 'vitest'
import { createCostTracker } from '@/lib/ai/cost-estimator'

describe('CostTracker', () => {
  it('começa com custo zero', () => {
    const tracker = createCostTracker()
    expect(tracker.getTotalCost()).toBe(0)
    expect(tracker.getBreakdown().entries).toHaveLength(0)
  })

  it('acumula custos de entradas', () => {
    const tracker = createCostTracker()
    tracker.addEntry('decomposition', 'openai/gpt-4.1-mini', 500, 200)
    tracker.addEntry('evaluation', 'openai/gpt-4.1-mini', 1000, 300)

    expect(tracker.getTotalCost()).toBeGreaterThan(0)
    expect(tracker.getBreakdown().entries).toHaveLength(2)
  })

  it('addSearchCost calcula corretamente', () => {
    const tracker = createCostTracker()
    tracker.addSearchCost(3)

    expect(tracker.getTotalCost()).toBeCloseTo(0.015, 4)
    expect(tracker.getBreakdown().byStage['search']).toBeCloseTo(0.015, 4)
  })

  it('getBreakdown organiza por stage e model', () => {
    const tracker = createCostTracker()
    tracker.addEntry('decomposition', 'openai/gpt-4.1-mini', 500, 200)
    tracker.addEntry('synthesis', 'anthropic/claude-sonnet-4-20250514', 1000, 500)
    tracker.addSearchCost(2)

    const breakdown = tracker.getBreakdown()
    expect(Object.keys(breakdown.byStage)).toContain('decomposition')
    expect(Object.keys(breakdown.byStage)).toContain('synthesis')
    expect(Object.keys(breakdown.byStage)).toContain('search')
    expect(Object.keys(breakdown.byModel)).toContain('openai/gpt-4.1-mini')
  })

  it('reset limpa tudo', () => {
    const tracker = createCostTracker()
    tracker.addEntry('decomposition', 'openai/gpt-4.1-mini', 500, 200)
    tracker.addSearchCost(5)

    expect(tracker.getTotalCost()).toBeGreaterThan(0)
    tracker.reset()
    expect(tracker.getTotalCost()).toBe(0)
    expect(tracker.getBreakdown().entries).toHaveLength(0)
  })

  it('cada entry tem timestamp ISO', () => {
    const tracker = createCostTracker()
    const entry = tracker.addEntry('decomposition', 'openai/gpt-4.1-mini', 500, 200)

    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(entry.stage).toBe('decomposition')
    expect(entry.modelId).toBe('openai/gpt-4.1-mini')
    expect(entry.inputTokens).toBe(500)
    expect(entry.outputTokens).toBe(200)
  })
})
