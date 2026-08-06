import type { Value } from "@udecode/plate";

/**
 * Split a document at top-level block boundaries (each slice remains a valid {@link Value}).
 */
export function chunkPlateValueByTopLevelBlocks(
  value: Value,
  maxBlocksPerChunk: number,
): Value[] {
  if (maxBlocksPerChunk < 1 || value.length <= maxBlocksPerChunk) {
    return [value];
  }

  const out: Value[] = [];
  for (let i = 0; i < value.length; i += maxBlocksPerChunk) {
    out.push(value.slice(i, i + maxBlocksPerChunk) as Value);
  }

  return out;
}
