import { BlockFilterRule, BlockFilterRuleResult } from "./types";

export function matchesRule<
  T extends { type: string; tags?: string[]; capabilities?: string[] },
>(block: T, rule: BlockFilterRuleResult): boolean {
  const matches = (values?: string[], target?: string[]) =>
    !values || values.some((v) => target?.includes(v));

  if (rule === "impossible") return false;

  const matchesAll =
    matches(rule.type, [block.type]) &&
    matches(rule.tags, block.tags) &&
    matches(rule.capabilities, block.capabilities);

  // Only evaluate `not` fields that are explicitly set. Treating undefined as
  // "match all" (like allow fields) would exclude every block whenever `not`
  // is partially specified.
  const matchesNot =
    !rule.not ||
    !(
      (!!rule.not.type && matches(rule.not.type, [block.type])) ||
      (!!rule.not.tags && matches(rule.not.tags, block.tags)) ||
      (!!rule.not.capabilities &&
        matches(rule.not.capabilities, block.capabilities))
    );

  return matchesAll && matchesNot;
}

const intersect = (a?: string[], b?: string[]) => {
  if (!a) return b;
  if (!b) return a;
  return a.filter((v) => b.includes(v));
};

const union = (a?: string[], b?: string[]) => {
  if (!a) return b;
  if (!b) return a;
  return Array.from(new Set([...a, ...b]));
};

export function mergeBlockFilterRules(
  parent?: BlockFilterRule,
  child?: BlockFilterRule,
): BlockFilterRuleResult {
  if (!parent) return child ?? {};
  if (!child) return parent;

  const type = intersect(parent.type, child.type);
  const tags = intersect(parent.tags, child.tags);
  const capabilities = intersect(parent.capabilities, child.capabilities);

  // If any explicitly defined allow field becomes empty → impossible
  if (
    (parent.type && child.type && type?.length === 0) ||
    (parent.tags && child.tags && tags?.length === 0) ||
    (parent.capabilities && child.capabilities && capabilities?.length === 0)
  ) {
    return "impossible";
  }

  const not = {
    type: union(parent.not?.type, child.not?.type),
    tags: union(parent.not?.tags, child.not?.tags),
    capabilities: union(parent.not?.capabilities, child.not?.capabilities),
  };

  return {
    ...(type && { type }),
    ...(tags && { tags }),
    ...(capabilities && { capabilities }),
    ...(Object.values(not).some(Boolean) && { not }),
  };
}
