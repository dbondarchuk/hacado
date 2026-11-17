import type { BlockCatalogEntry, StyleCatalogEntry } from "../adapters/types";
import type { BlockSearchHit, StylePropertyHit } from "../types";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function scoreText(haystack: string, tokens: string[]): number {
  const value = haystack.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (value === token) score += 10;
    else if (value.startsWith(token)) score += 6;
    else if (value.includes(token)) score += 3;
  }

  return score;
}

export function searchBlockCatalog(
  catalog: BlockCatalogEntry[],
  input: { query: string; category?: string; limit?: number },
): BlockSearchHit[] {
  const tokens = tokenize(input.query);
  const limit = input.limit ?? 12;

  const ranked = catalog
    .filter((entry) => {
      if (input.category && entry.category !== input.category) return false;

      return true;
    })
    .map((entry) => {
      const score =
        scoreText(entry.type, tokens) +
        scoreText(entry.displayName, tokens) +
        scoreText(entry.category, tokens) +
        (entry.tags ?? []).reduce(
          (sum, tag) => sum + scoreText(tag, tokens),
          0,
        ) +
        (entry.capabilities ?? []).reduce(
          (sum, capability) => sum + scoreText(capability, tokens),
          0,
        ) +
        (entry.description ? scoreText(entry.description, tokens) : 0) +
        (entry.providerName ? scoreText(entry.providerName, tokens) : 0);

      return { entry, score };
    })
    .filter((item) => (tokens.length === 0 ? true : item.score > 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ entry }) => ({
    type: entry.type,
    displayName: entry.displayName,
    category: entry.category,
    tags: entry.tags,
    capabilities: entry.capabilities,
    providerName: entry.providerName,
    allowedBuilderTypes: entry.allowedBuilderTypes,
    description: entry.description,
  }));
}

export function searchStyleCatalog(
  catalog: StyleCatalogEntry[],
  input: { query: string; limit?: number; allowlist?: string[] },
): StylePropertyHit[] {
  const tokens = tokenize(input.query);
  const limit = input.limit ?? 20;
  const allowlist = input.allowlist?.length
    ? new Set(input.allowlist)
    : null;

  return catalog
    .filter((entry) => (allowlist ? allowlist.has(entry.name) : true))
    .map((entry) => {
      const score =
        scoreText(entry.name, tokens) +
        (entry.category ? scoreText(entry.category, tokens) : 0) +
        (entry.description ? scoreText(entry.description, tokens) : 0);

      return { entry, score };
    })
    .filter((item) => (tokens.length === 0 ? true : item.score > 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => ({
      name: entry.name,
      category: entry.category,
      description: entry.description,
      responsive: entry.responsive,
    }));
}
