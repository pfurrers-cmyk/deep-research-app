// lib/ai/cost-estimator.ts — Estimativa de custos pré-execução e tracking em tempo real

import { calculateCost } from '@/config/pricing';
import type { CostBreakdown, CostEntry, PipelineStageName } from '@/lib/research/types';

export function createCostTracker(): CostTracker {
  return new CostTracker();
}

export class CostTracker {
  private entries: CostEntry[] = [];

  addEntry(
    stage: PipelineStageName | 'search',
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): CostEntry {
    const costUSD = calculateCost(modelId, inputTokens, outputTokens);
    const entry: CostEntry = {
      stage,
      modelId,
      inputTokens,
      outputTokens,
      costUSD,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  addSearchCost(numRequests: number, costPerRequest = 0.005): CostEntry {
    const entry: CostEntry = {
      stage: 'search',
      modelId: 'gateway/search',
      inputTokens: 0,
      outputTokens: 0,
      costUSD: numRequests * costPerRequest,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.costUSD, 0);
  }

  getBreakdown(): CostBreakdown {
    const byStage: Record<string, number> = {};
    const byModel: Record<string, number> = {};

    for (const entry of this.entries) {
      byStage[entry.stage] = (byStage[entry.stage] ?? 0) + entry.costUSD;
      byModel[entry.modelId] = (byModel[entry.modelId] ?? 0) + entry.costUSD;
    }

    return {
      entries: [...this.entries],
      totalCostUSD: this.getTotalCost(),
      byStage,
      byModel,
    };
  }

  reset(): void {
    this.entries = [];
  }
}
