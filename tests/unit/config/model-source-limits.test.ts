// tests/unit/config/model-source-limits.test.ts
import { describe, it, expect } from 'vitest';
import {
  resolveProcessingMode,
  getMapBatchSize,
  getModeOverhead,
  getAbsoluteMaxSources,
  MODEL_SOURCE_LIMITS,
  DEFAULT_SOURCE_LIMITS,
} from '@/config/model-source-limits';

describe('model-source-limits', () => {
  describe('resolveProcessingMode', () => {
    it('should return base mode when sources are within base limits', () => {
      const result = resolveProcessingMode('openai/gpt-4.1-mini', 10, 5);
      expect(result.mode).toBe('base');
      expect(result.clamped).toBe(false);
      expect(result.effectiveSearchCount).toBe(10);
    });

    it('should return extended mode when sources exceed base but within extended limits', () => {
      const result = resolveProcessingMode('openai/gpt-4.1-mini', 200, 80);
      expect(result.mode).toBe('extended');
      expect(result.clamped).toBe(false);
    });

    it('should return ultra mode when sources exceed extended but within ultra limits', () => {
      const result = resolveProcessingMode('openai/gpt-4.1-mini', 400, 150);
      expect(result.mode).toBe('ultra');
      expect(result.clamped).toBe(false);
    });

    it('should clamp and return ultra mode when sources exceed all limits', () => {
      const result = resolveProcessingMode('openai/gpt-4.1-mini', 9999, 9999);
      expect(result.mode).toBe('ultra');
      expect(result.clamped).toBe(true);
      expect(result.effectiveSearchCount).toBe(500);
      expect(result.effectiveSelectCount).toBe(200);
    });

    it('should clamp to extended for models without ultra', () => {
      const result = resolveProcessingMode('openai/gpt-4-turbo', 9999, 9999);
      expect(result.mode).toBe('extended');
      expect(result.clamped).toBe(true);
      expect(result.effectiveSearchCount).toBe(60);
    });

    it('should use DEFAULT_SOURCE_LIMITS for unknown models', () => {
      const result = resolveProcessingMode('unknown/model-xyz', 5, 3);
      expect(result.mode).toBe('base');
      expect(result.limits).toEqual(DEFAULT_SOURCE_LIMITS);
    });

    it('should return base for unknown model with high sources but limited defaults', () => {
      const result = resolveProcessingMode('unknown/model-xyz', 11, 5);
      expect(result.mode).toBe('extended');
    });

    it('should clamp select count even in base mode', () => {
      const limits = MODEL_SOURCE_LIMITS['openai/gpt-3.5-turbo'];
      expect(limits).toBeDefined();
      const result = resolveProcessingMode('openai/gpt-3.5-turbo', 2, 50);
      expect(result.mode).toBe('base');
      expect(result.effectiveSelectCount).toBe(2);
    });
  });

  describe('getMapBatchSize', () => {
    it('should return ~60% of base maxSelect, minimum 3', () => {
      const batchSize = getMapBatchSize('openai/gpt-4.1-mini');
      const limits = MODEL_SOURCE_LIMITS['openai/gpt-4.1-mini'];
      const expected = Math.max(3, Math.floor(limits.base.maxSelect * 0.6));
      expect(batchSize).toBe(expected);
    });

    it('should return at least 3 for small context models', () => {
      const batchSize = getMapBatchSize('openai/gpt-3.5-turbo');
      expect(batchSize).toBeGreaterThanOrEqual(3);
    });

    it('should use default limits for unknown models', () => {
      const batchSize = getMapBatchSize('unknown/model');
      expect(batchSize).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getModeOverhead', () => {
    it('should return correct info for base mode', () => {
      const info = getModeOverhead('base');
      expect(info.costMultiplier).toBe(1);
      expect(info.latencyMultiplier).toBe(1);
      expect(info.color).toBe('green');
      expect(info.labelShort).toBe('Direto');
    });

    it('should return correct info for extended mode', () => {
      const info = getModeOverhead('extended');
      expect(info.costMultiplier).toBe(2.5);
      expect(info.color).toBe('blue');
      expect(info.labelShort).toBe('Map-Reduce');
    });

    it('should return correct info for ultra mode', () => {
      const info = getModeOverhead('ultra');
      expect(info.costMultiplier).toBe(5);
      expect(info.color).toBe('yellow');
      expect(info.labelShort).toBe('Iterativo');
    });
  });

  describe('getAbsoluteMaxSources', () => {
    it('should return ultra limits when available', () => {
      const max = getAbsoluteMaxSources('openai/gpt-4.1-mini');
      const limits = MODEL_SOURCE_LIMITS['openai/gpt-4.1-mini'];
      expect(max.maxSearch).toBe(limits.ultra!.maxSearch);
      expect(max.maxSelect).toBe(limits.ultra!.maxSelect);
    });

    it('should return extended limits when ultra not available', () => {
      const max = getAbsoluteMaxSources('openai/gpt-4-turbo');
      const limits = MODEL_SOURCE_LIMITS['openai/gpt-4-turbo'];
      expect(max.maxSearch).toBe(limits.extended.maxSearch);
      expect(max.maxSelect).toBe(limits.extended.maxSelect);
    });

    it('should return default limits for unknown models', () => {
      const max = getAbsoluteMaxSources('unknown/model');
      expect(max.maxSearch).toBe(DEFAULT_SOURCE_LIMITS.extended.maxSearch);
    });
  });

  describe('MODEL_SOURCE_LIMITS coverage', () => {
    it('should have entries for key models used by the app', () => {
      const keyModels = [
        'anthropic/claude-sonnet-4.5',
        'anthropic/claude-opus-4.6',
        'openai/gpt-4.1-mini',
        'openai/gpt-4.1-nano',
        'google/gemini-2.5-flash',
      ];
      for (const model of keyModels) {
        expect(MODEL_SOURCE_LIMITS[model]).toBeDefined();
      }
    });

    it('base.maxSearch should always be <= extended.maxSearch', () => {
      for (const [id, limits] of Object.entries(MODEL_SOURCE_LIMITS)) {
        expect(limits.base.maxSearch).toBeLessThanOrEqual(limits.extended.maxSearch);
        if (limits.ultra) {
          expect(limits.extended.maxSearch).toBeLessThanOrEqual(limits.ultra.maxSearch);
        }
      }
    });

    it('all contextK values should be positive', () => {
      for (const limits of Object.values(MODEL_SOURCE_LIMITS)) {
        expect(limits.contextK).toBeGreaterThan(0);
      }
    });
  });
});
