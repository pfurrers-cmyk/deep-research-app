// lib/utils/array-utils.ts — Array utility functions

/**
 * Split an array into chunks of a given size.
 * Last chunk may be smaller than `size`.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be positive');
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
