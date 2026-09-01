import type { CSSProperties } from "react";
import { snapRotationToCardinals } from "./alignment-guides";
import {
  FLUID_COLUMNS,
  FLUID_DEFAULT_COL_SPAN,
  FLUID_DEFAULT_ROW_SPAN,
  FluidPlacement,
} from "./schema";

export function clampPlacement(
  placement: FluidPlacement,
  maxColumns: number = FLUID_COLUMNS,
): FluidPlacement {
  const colStart = Math.min(
    maxColumns,
    Math.max(1, Math.round(placement.colStart)),
  );
  const colEnd = Math.min(
    maxColumns + 1,
    Math.max(colStart + 1, Math.round(placement.colEnd)),
  );
  const rowStart = Math.max(1, Math.round(placement.rowStart));
  const rowEnd = Math.max(rowStart + 1, Math.round(placement.rowEnd));
  const next: FluidPlacement = {
    colStart,
    colEnd,
    rowStart,
    rowEnd,
    zIndex: placement.zIndex ?? 0,
  };
  if (placement.rotate != null) {
    next.rotate = placement.rotate;
  }
  return next;
}

export function getMaxRowEnd(
  placements: Record<string, FluidPlacement>,
): number {
  let max = 1;
  for (const placement of Object.values(placements)) {
    max = Math.max(max, placement.rowEnd);
  }
  return max;
}

export function placementsForChildIds(
  childIds: string[],
  placements: Record<string, FluidPlacement>,
): Record<string, FluidPlacement> {
  const next: Record<string, FluidPlacement> = {};
  for (const id of childIds) {
    const placement = placements[id];
    if (placement) next[id] = placement;
  }
  return next;
}

/** Row tracks to render — content rows plus buffer for drop/resize. */
export function getGridRowCount(
  placements: Record<string, FluidPlacement>,
  buffer = 2,
): number {
  const contentRows = Math.max(1, getMaxRowEnd(placements) - 1);
  return contentRows + buffer;
}

export function createDefaultPlacement(
  placements: Record<string, FluidPlacement>,
  zIndex = 0,
): FluidPlacement {
  const rowStart = getMaxRowEnd(placements);
  return clampPlacement({
    colStart: 1,
    colEnd: 1 + FLUID_DEFAULT_COL_SPAN,
    rowStart: Math.max(1, rowStart),
    rowEnd: Math.max(1, rowStart) + FLUID_DEFAULT_ROW_SPAN,
    zIndex,
  });
}

export function syncPlacements(
  childIds: string[],
  placements: Record<string, FluidPlacement>,
): Record<string, FluidPlacement> {
  const next: Record<string, FluidPlacement> = {};
  let changed = false;
  let working = { ...placements };

  for (const id of childIds) {
    if (working[id]) {
      next[id] = working[id];
    } else {
      const created = createDefaultPlacement(working);
      next[id] = created;
      working = { ...working, [id]: created };
      changed = true;
    }
  }

  for (const id of Object.keys(placements)) {
    if (!childIds.includes(id)) {
      changed = true;
    }
  }

  if (!changed && childIds.length === Object.keys(placements).length) {
    return placements;
  }

  return next;
}

export type GridMetrics = {
  colWidth: number;
  rowHeight: number;
  gap: number;
  paddingLeft: number;
  paddingTop: number;
};

export function pointToCell(
  clientX: number,
  clientY: number,
  gridRect: DOMRect,
  metrics: GridMetrics,
  columnCount: number = FLUID_COLUMNS,
): { col: number; row: number } {
  const x = clientX - gridRect.left - metrics.paddingLeft;
  const y = clientY - gridRect.top - metrics.paddingTop;
  const cellW = metrics.colWidth + metrics.gap;
  const cellH = metrics.rowHeight + metrics.gap;
  const col = Math.min(columnCount, Math.max(1, Math.floor(x / cellW) + 1));
  const row = Math.max(1, Math.floor(y / cellH) + 1);
  return { col, row };
}

export function shiftPlacement(
  placement: FluidPlacement,
  dCol: number,
  dRow: number,
  maxColumns: number = FLUID_COLUMNS,
): FluidPlacement {
  const width = placement.colEnd - placement.colStart;
  const height = placement.rowEnd - placement.rowStart;
  let colStart = placement.colStart + dCol;
  let rowStart = placement.rowStart + dRow;
  colStart = Math.min(maxColumns - width + 1, Math.max(1, colStart));
  rowStart = Math.max(1, rowStart);
  return clampPlacement(
    {
      ...placement,
      colStart,
      colEnd: colStart + width,
      rowStart,
      rowEnd: rowStart + height,
    },
    maxColumns,
  );
}

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function resizePlacementByDelta(
  placement: FluidPlacement,
  handle: ResizeHandle,
  dCol: number,
  dRow: number,
  maxColumns: number = FLUID_COLUMNS,
): FluidPlacement {
  let { colStart, colEnd, rowStart, rowEnd } = placement;

  if (handle.includes("e")) colEnd = placement.colEnd + dCol;
  if (handle.includes("w")) colStart = placement.colStart + dCol;
  if (handle.includes("s")) rowEnd = placement.rowEnd + dRow;
  if (handle.includes("n")) rowStart = placement.rowStart + dRow;

  return clampPlacement(
    {
      ...placement,
      colStart,
      colEnd,
      rowStart,
      rowEnd,
    },
    maxColumns,
  );
}

export function bringForward(
  placements: Record<string, FluidPlacement>,
  childId: string,
): Record<string, FluidPlacement> {
  const current = placements[childId];
  if (!current) return placements;
  const zIndexes = Object.values(placements).map((p) => p.zIndex);
  const max = Math.max(...zIndexes, 0);
  if (current.zIndex >= max) return placements;
  const nextHigher = zIndexes
    .filter((z) => z > current.zIndex)
    .sort((a, b) => a - b)[0];
  return {
    ...placements,
    [childId]: { ...current, zIndex: nextHigher ?? current.zIndex + 1 },
  };
}

export function sendBackward(
  placements: Record<string, FluidPlacement>,
  childId: string,
): Record<string, FluidPlacement> {
  const current = placements[childId];
  if (!current) return placements;
  const zIndexes = Object.values(placements).map((p) => p.zIndex);
  const min = Math.min(...zIndexes, 0);
  if (current.zIndex <= min) return placements;
  const nextLower = zIndexes
    .filter((z) => z < current.zIndex)
    .sort((a, b) => b - a)[0];
  return {
    ...placements,
    [childId]: { ...current, zIndex: nextLower ?? current.zIndex - 1 },
  };
}

export function bringToFront(
  placements: Record<string, FluidPlacement>,
  childId: string,
): Record<string, FluidPlacement> {
  const current = placements[childId];
  if (!current) return placements;
  const max = Math.max(0, ...Object.values(placements).map((p) => p.zIndex));
  return {
    ...placements,
    [childId]: { ...current, zIndex: max + 1 },
  };
}

export function sendToBack(
  placements: Record<string, FluidPlacement>,
  childId: string,
): Record<string, FluidPlacement> {
  const current = placements[childId];
  if (!current) return placements;
  const min = Math.min(0, ...Object.values(placements).map((p) => p.zIndex));
  return {
    ...placements,
    [childId]: { ...current, zIndex: min - 1 },
  };
}

export function pointerAngleFromCenter(
  clientX: number,
  clientY: number,
  centerX: number,
  centerY: number,
): number {
  return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
}

export function rotatePlacementByPointer(
  placement: FluidPlacement,
  originRotate: number,
  startAngle: number,
  currentAngle: number,
  disableSnap: boolean,
): FluidPlacement {
  const rotate = originRotate + (currentAngle - startAngle);
  const snapped = snapRotationToCardinals(rotate, disableSnap);
  if (snapped === 0) {
    const { rotate: _rotate, ...rest } = placement;
    return rest as FluidPlacement;
  }
  return { ...placement, rotate: snapped };
}

export function clearPlacementRotation(
  placements: Record<string, FluidPlacement>,
  childId: string,
): Record<string, FluidPlacement> {
  const current = placements[childId];
  if (!current || current.rotate == null || current.rotate === 0) {
    return placements;
  }
  const { rotate: _rotate, ...rest } = current;
  return { ...placements, [childId]: rest };
}

export function placementToGridStyle(placement: FluidPlacement): CSSProperties {
  return {
    gridColumn: `${placement.colStart} / ${placement.colEnd}`,
    gridRow: `${placement.rowStart} / ${placement.rowEnd}`,
    zIndex: placement.zIndex,
    minWidth: 0,
    minHeight: 0,
  };
}

export function placementToRotateStyle(
  placement: FluidPlacement,
): CSSProperties {
  const rotate = placement.rotate ?? 0;
  if (!rotate) return {};
  return {
    transform: `rotate(${rotate}deg)`,
    transformOrigin: "center center",
  };
}
