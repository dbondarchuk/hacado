import type { BlockAICapability } from "../types";

/**
 * Abstract resolve: actions come only from the block/catalog entry.
 * Builders and apps declare concrete packs on each block.
 */
export function getBlockAICapabilitiesFromEntry(input: {
  aiCapabilities?: BlockAICapability[];
}): BlockAICapability[] {
  return input.aiCapabilities?.length ? input.aiCapabilities : [];
}
