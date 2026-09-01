import type { ViewportSize } from "@hacado/builder";
import {
  FLUID_COLUMNS,
  FLUID_MOBILE_COLUMNS,
  FLUID_TABLET_COLUMNS,
  FluidPlacement,
  FluidPlacementOverrides,
  FluidPlacementViewport,
} from "./schema";
import { clampPlacement, placementsForChildIds, syncPlacements } from "./utils";

export type FluidPlacementTier =
  | "desktop"
  | "tablet"
  | "mobile"
  | "mobileLandscape";

const OVERRIDE_TIERS: FluidPlacementViewport[] = [
  "tablet",
  "mobile",
  "mobileLandscape",
];

export function viewportToPlacementTier(
  viewport: ViewportSize,
): FluidPlacementTier {
  switch (viewport) {
    case "tablet":
      return "tablet";
    case "mobile":
      return "mobile";
    case "mobileLandscape":
      return "mobileLandscape";
    default:
      return "desktop";
  }
}

export function getColumnCountForTier(tier: FluidPlacementTier): number {
  if (tier === "tablet") return FLUID_TABLET_COLUMNS;
  if (tier === "mobile" || tier === "mobileLandscape") {
    return FLUID_MOBILE_COLUMNS;
  }
  return FLUID_COLUMNS;
}

export function scalePlacementToTablet(
  placement: FluidPlacement,
): FluidPlacement {
  const colStart = Math.min(11, Math.max(1, Math.ceil(placement.colStart / 2)));
  const width = Math.max(
    1,
    Math.ceil((placement.colEnd - placement.colStart) / 2),
  );
  const maxWidth = FLUID_TABLET_COLUMNS - colStart + 1;
  const clampedWidth = Math.min(width, maxWidth);
  const colEnd = colStart + clampedWidth;
  return clampPlacement(
    {
      ...placement,
      colStart,
      colEnd,
    },
    FLUID_TABLET_COLUMNS,
  );
}

function comparePlacementsForStack(
  a: FluidPlacement,
  b: FluidPlacement,
): number {
  if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart;
  if (a.colStart !== b.colStart) return a.colStart - b.colStart;
  return (a.zIndex ?? 0) - (b.zIndex ?? 0);
}

export function computeMobileStackPlacements(
  childIds: string[],
  source: Record<string, FluidPlacement>,
): Record<string, FluidPlacement> {
  const sorted = [...childIds].sort((a, b) => {
    const pa = source[a];
    const pb = source[b];
    if (!pa && !pb) return 0;
    if (!pa) return 1;
    if (!pb) return -1;
    return comparePlacementsForStack(pa, pb);
  });

  let row = 1;
  const result: Record<string, FluidPlacement> = {};
  for (const id of sorted) {
    const src = source[id];
    if (!src) continue;
    const height = Math.max(1, src.rowEnd - src.rowStart);
    const next: FluidPlacement = {
      colStart: 1,
      colEnd: FLUID_MOBILE_COLUMNS + 1,
      rowStart: row,
      rowEnd: row + height,
      zIndex: src.zIndex ?? 0,
    };
    if (src.rotate != null) {
      next.rotate = src.rotate;
    }
    result[id] = next;
    row += height;
  }
  return result;
}

function clampPlacementsForTier(
  childIds: string[],
  placements: Record<string, FluidPlacement>,
  tier: FluidPlacementTier,
): Record<string, FluidPlacement> {
  const maxColumns = getColumnCountForTier(tier);
  if (maxColumns === FLUID_COLUMNS) return placements;
  const result: Record<string, FluidPlacement> = {};
  for (const id of childIds) {
    const placement = placements[id];
    if (placement) {
      result[id] = clampPlacement(placement, maxColumns);
    }
  }
  return result;
}

function resolveTabletPlacements(
  childIds: string[],
  base: Record<string, FluidPlacement>,
  overrides: FluidPlacementOverrides,
): Record<string, FluidPlacement> {
  const tabletOverrides = overrides.tablet ?? {};
  const result: Record<string, FluidPlacement> = {};
  for (const id of childIds) {
    const override = tabletOverrides[id];
    if (override) {
      result[id] = override;
      continue;
    }
    const desktop = base[id];
    if (desktop) {
      result[id] = scalePlacementToTablet(desktop);
    }
  }
  return result;
}

function resolveMobilePlacements(
  childIds: string[],
  tabletEffective: Record<string, FluidPlacement>,
  overrides: FluidPlacementOverrides,
): Record<string, FluidPlacement> {
  const mobileOverrides = overrides.mobile ?? {};
  const stacked = computeMobileStackPlacements(childIds, tabletEffective);
  const result: Record<string, FluidPlacement> = {};
  for (const id of childIds) {
    result[id] = mobileOverrides[id] ?? stacked[id];
  }
  return result;
}

function resolveMobileLandscapePlacements(
  childIds: string[],
  mobileEffective: Record<string, FluidPlacement>,
  overrides: FluidPlacementOverrides,
): Record<string, FluidPlacement> {
  const landscapeOverrides = overrides.mobileLandscape ?? {};
  const stacked = computeMobileStackPlacements(childIds, mobileEffective);
  const result: Record<string, FluidPlacement> = {};
  for (const id of childIds) {
    result[id] = landscapeOverrides[id] ?? stacked[id] ?? mobileEffective[id];
  }
  return result;
}

export function resolveEffectivePlacements({
  childIds,
  base,
  overrides = {},
  tier,
}: {
  childIds: string[];
  base: Record<string, FluidPlacement>;
  overrides?: FluidPlacementOverrides;
  tier: FluidPlacementTier;
}): Record<string, FluidPlacement> {
  const baseForChildren = placementsForChildIds(childIds, base);

  if (tier === "desktop") {
    return baseForChildren;
  }

  const tabletEffective = resolveTabletPlacements(
    childIds,
    baseForChildren,
    overrides,
  );

  if (tier === "tablet") {
    return placementsForChildIds(childIds, tabletEffective);
  }

  const mobileEffective = resolveMobilePlacements(
    childIds,
    tabletEffective,
    overrides,
  );

  if (tier === "mobile") {
    return clampPlacementsForTier(
      childIds,
      placementsForChildIds(childIds, mobileEffective),
      tier,
    );
  }

  const landscapeEffective = resolveMobileLandscapePlacements(
    childIds,
    mobileEffective,
    overrides,
  );
  return clampPlacementsForTier(
    childIds,
    placementsForChildIds(childIds, landscapeEffective),
    tier,
  );
}

export function hasChildOverride(
  overrides: FluidPlacementOverrides,
  tier: FluidPlacementTier,
  childId: string,
): boolean {
  if (tier === "desktop") return false;
  return !!overrides[tier]?.[childId];
}

export function isTierCustom(
  overrides: FluidPlacementOverrides,
  tier: FluidPlacementTier,
): boolean {
  if (tier === "desktop") return false;
  const map = overrides[tier];
  return !!map && Object.keys(map).length > 0;
}

export function clearChildPlacementOverride(
  overrides: FluidPlacementOverrides,
  tier: FluidPlacementTier,
  childId: string,
): FluidPlacementOverrides {
  if (tier === "desktop") return overrides;
  const tierMap = overrides[tier];
  if (!tierMap?.[childId]) return overrides;

  const nextTierMap = { ...tierMap };
  delete nextTierMap[childId];

  const next = { ...overrides };
  if (Object.keys(nextTierMap).length === 0) {
    delete next[tier];
  } else {
    next[tier] = nextTierMap;
  }
  return next;
}

export function clearTierPlacementOverrides(
  overrides: FluidPlacementOverrides,
  tier: FluidPlacementTier,
): FluidPlacementOverrides {
  if (tier === "desktop") return overrides;
  const next = { ...overrides };
  delete next[tier];
  return next;
}

/** Marks removed override tiers as `undefined` so set-block-data deepMerge deletes them. */
export function toMergeablePlacementOverrides(
  next: FluidPlacementOverrides,
  previous: FluidPlacementOverrides = {},
): FluidPlacementOverrides &
  Record<string, FluidPlacementOverrides[FluidPlacementViewport] | undefined> {
  const mergeable = { ...next } as FluidPlacementOverrides &
    Record<string, FluidPlacementOverrides[FluidPlacementViewport] | undefined>;

  for (const tier of OVERRIDE_TIERS) {
    if (previous[tier] && !next[tier]) {
      mergeable[tier] = undefined;
    }
  }

  return mergeable;
}

export function syncPlacementsAllTiers(
  childIds: string[],
  props: {
    placements: Record<string, FluidPlacement>;
    placementOverrides?: FluidPlacementOverrides;
  },
): {
  placements: Record<string, FluidPlacement>;
  placementOverrides: FluidPlacementOverrides;
} {
  const placements = syncPlacements(childIds, props.placements);
  const sourceOverrides = props.placementOverrides ?? {};
  let placementOverrides = sourceOverrides;
  let changed = placements !== props.placements;

  for (const tier of OVERRIDE_TIERS) {
    const map = sourceOverrides[tier];
    if (!map) continue;

    const cleaned: Record<string, FluidPlacement> = {};
    for (const id of childIds) {
      if (map[id]) cleaned[id] = map[id];
    }

    if (Object.keys(cleaned).length !== Object.keys(map).length) {
      if (placementOverrides === sourceOverrides) {
        placementOverrides = { ...sourceOverrides };
      }
      changed = true;
      if (Object.keys(cleaned).length === 0) {
        delete placementOverrides[tier];
      } else {
        placementOverrides[tier] = cleaned;
      }
    }
  }

  if (!changed) {
    return {
      placements: props.placements,
      placementOverrides: sourceOverrides,
    };
  }

  return { placements, placementOverrides };
}

export function placementToChildCss(
  placement: FluidPlacement,
  childSelector: string,
): string {
  const rotate = placement.rotate ?? 0;
  const rotateCss = rotate
    ? `${childSelector} > .fluid-child-rotate { transform: rotate(${rotate}deg); transform-origin: center center; }`
    : "";
  return `
${childSelector} {
  grid-column: ${placement.colStart} / ${placement.colEnd};
  grid-row: ${placement.rowStart} / ${placement.rowEnd};
  z-index: ${placement.zIndex ?? 0};
}
${rotateCss}`;
}
