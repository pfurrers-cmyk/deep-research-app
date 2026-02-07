// tests/unit/lib/map-reduce.test.ts
import { describe, it, expect } from 'vitest';
import { chunkArray } from '@/lib/utils/array-utils';
import {
  formatBatchForMap,
  formatSummariesForReduce,
  formatEnrichment,
  formatVerification,
} from '@/lib/ai/prompts/pipeline-prompts';

describe('chunkArray', () => {
  it('should split array into chunks of given size', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunkArray(arr, 3);
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('should return single chunk when size >= array length', () => {
    const arr = [1, 2, 3];
    expect(chunkArray(arr, 5)).toEqual([[1, 2, 3]]);
    expect(chunkArray(arr, 3)).toEqual([[1, 2, 3]]);
  });

  it('should return empty array for empty input', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  it('should throw for non-positive chunk size', () => {
    expect(() => chunkArray([1], 0)).toThrow('Chunk size must be positive');
    expect(() => chunkArray([1], -1)).toThrow('Chunk size must be positive');
  });

  it('should handle chunk size of 1', () => {
    expect(chunkArray([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});

describe('pipeline-prompts formatters', () => {
  const mockSources = [
    { url: 'https://example.com/1', title: 'Source 1', content: 'Content 1', snippet: 'Snippet 1' },
    { url: 'https://example.com/2', title: 'Source 2', content: 'Content 2', snippet: 'Snippet 2' },
  ];

  describe('formatBatchForMap', () => {
    it('should include query, batch index, and source content', () => {
      const result = formatBatchForMap(mockSources, 0, 3, 'test query');
      expect(result).toContain('test query');
      expect(result).toContain('BATCH 1/3');
      expect(result).toContain('Source 1');
      expect(result).toContain('Content 1');
      expect(result).toContain('Source 2');
    });

    it('should use snippet when content is empty', () => {
      const sources = [{ url: 'https://x.com', title: 'T', content: '', snippet: 'Fallback snippet' }];
      const result = formatBatchForMap(sources, 0, 1, 'q');
      expect(result).toContain('Fallback snippet');
    });

    it('should truncate content to 4000 chars', () => {
      const longContent = 'A'.repeat(10000);
      const sources = [{ url: 'https://x.com', title: 'T', content: longContent, snippet: '' }];
      const result = formatBatchForMap(sources, 0, 1, 'q');
      expect(result.length).toBeLessThan(longContent.length);
    });
  });

  describe('formatSummariesForReduce', () => {
    it('should include query and all summaries', () => {
      const summaries = ['Summary batch 1', 'Summary batch 2'];
      const result = formatSummariesForReduce(summaries, 'test query', 10);
      expect(result).toContain('test query');
      expect(result).toContain('TOTAL DE FONTES PROCESSADAS: 10');
      expect(result).toContain('BATCH 1/2');
      expect(result).toContain('BATCH 2/2');
      expect(result).toContain('Summary batch 1');
      expect(result).toContain('Summary batch 2');
    });
  });

  describe('formatEnrichment', () => {
    it('should include current report and new sources', () => {
      const result = formatEnrichment('Current report text', mockSources, 'test query');
      expect(result).toContain('Current report text');
      expect(result).toContain('NOVA FONTE 1');
      expect(result).toContain('Source 1');
      expect(result).toContain('test query');
    });
  });

  describe('formatVerification', () => {
    it('should include report and summaries for verification', () => {
      const result = formatVerification('Report text', ['Summary 1', 'Summary 2']);
      expect(result).toContain('Report text');
      expect(result).toContain('RESUMO BATCH 1');
      expect(result).toContain('Summary 1');
      expect(result).toContain('Summary 2');
    });
  });
});
