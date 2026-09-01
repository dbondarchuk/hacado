import { FLUID_COLUMNS, FluidPlacement } from "./schema";
import { clampPlacement } from "./utils";

export type FluidAlignmentGuide = {
  type: "column" | "row";
  position: number;
  label?: string;
};

const SNAP_THRESHOLD = 0.4;
const CARDINAL_ROTATIONS = [0, 90, 180, 270] as const;
const ROTATION_SNAP_THRESHOLD_DEG = 8;

function placementSize(placement: FluidPlacement) {
  return {
    width: placement.colEnd - placement.colStart,
    height: placement.rowEnd - placement.rowStart,
  };
}

function placementEdges(placement: FluidPlacement) {
  const { width, height } = placementSize(placement);
  const centerX = (placement.colStart + placement.colEnd) / 2;
  const centerY = (placement.rowStart + placement.rowEnd) / 2;
  return {
    left: placement.colStart,
    right: placement.colEnd,
    top: placement.rowStart,
    bottom: placement.rowEnd,
    centerX,
    centerY,
    width,
    height,
  };
}

function pushGuide(guides: FluidAlignmentGuide[], guide: FluidAlignmentGuide) {
  if (
    !guides.some(
      (g) =>
        g.type === guide.type && Math.abs(g.position - guide.position) < 0.01,
    )
  ) {
    guides.push(guide);
  }
}

export function computeFluidAlignmentGuides(
  active: FluidPlacement,
  others: Record<string, FluidPlacement>,
  activeId: string,
  gridRowCount: number,
  disableSnap: boolean,
  columnCount: number = FLUID_COLUMNS,
): FluidAlignmentGuide[] {
  if (disableSnap) return [];

  const guides: FluidAlignmentGuide[] = [];
  const activeEdges = placementEdges(active);
  const gridCenterX = (columnCount + 1) / 2;
  const gridCenterY = (gridRowCount + 1) / 2;

  if (Math.abs(activeEdges.centerX - gridCenterX) < SNAP_THRESHOLD) {
    pushGuide(guides, {
      type: "column",
      position: gridCenterX,
      label: "Center",
    });
  }
  if (Math.abs(activeEdges.centerY - gridCenterY) < SNAP_THRESHOLD) {
    pushGuide(guides, {
      type: "row",
      position: gridCenterY,
      label: "Center",
    });
  }
  if (Math.abs(activeEdges.left - 1) < SNAP_THRESHOLD) {
    pushGuide(guides, { type: "column", position: 1 });
  }
  if (Math.abs(activeEdges.right - (columnCount + 1)) < SNAP_THRESHOLD) {
    pushGuide(guides, { type: "column", position: columnCount + 1 });
  }
  if (Math.abs(activeEdges.top - 1) < SNAP_THRESHOLD) {
    pushGuide(guides, { type: "row", position: 1 });
  }
  if (Math.abs(activeEdges.bottom - (gridRowCount + 1)) < SNAP_THRESHOLD) {
    pushGuide(guides, { type: "row", position: gridRowCount + 1 });
  }

  for (const [id, other] of Object.entries(others)) {
    if (id === activeId) continue;
    const otherEdges = placementEdges(other);

    if (Math.abs(activeEdges.left - otherEdges.left) < SNAP_THRESHOLD) {
      pushGuide(guides, { type: "column", position: otherEdges.left });
    }
    if (Math.abs(activeEdges.right - otherEdges.right) < SNAP_THRESHOLD) {
      pushGuide(guides, { type: "column", position: otherEdges.right });
    }
    if (Math.abs(activeEdges.centerX - otherEdges.centerX) < SNAP_THRESHOLD) {
      pushGuide(guides, { type: "column", position: otherEdges.centerX });
    }
    if (Math.abs(activeEdges.top - otherEdges.top) < SNAP_THRESHOLD) {
      pushGuide(guides, { type: "row", position: otherEdges.top });
    }
    if (Math.abs(activeEdges.bottom - otherEdges.bottom) < SNAP_THRESHOLD) {
      pushGuide(guides, { type: "row", position: otherEdges.bottom });
    }
    if (Math.abs(activeEdges.centerY - otherEdges.centerY) < SNAP_THRESHOLD) {
      pushGuide(guides, { type: "row", position: otherEdges.centerY });
    }
  }

  return guides;
}

export function snapFluidPlacement(
  active: FluidPlacement,
  others: Record<string, FluidPlacement>,
  activeId: string,
  gridRowCount: number,
  disableSnap: boolean,
  columnCount: number = FLUID_COLUMNS,
): FluidPlacement {
  if (disableSnap) return active;

  const { width, height } = placementSize(active);
  let colStart = active.colStart;
  let rowStart = active.rowStart;
  const colEnd = active.colEnd;
  const rowEnd = active.rowEnd;

  const left = colStart;
  const right = colEnd;
  const centerX = (colStart + colEnd) / 2;
  const top = rowStart;
  const bottom = rowEnd;
  const centerY = (rowStart + rowEnd) / 2;

  const gridCenterX = (columnCount + 1) / 2;
  const gridCenterY = (gridRowCount + 1) / 2;

  if (Math.abs(centerX - gridCenterX) < SNAP_THRESHOLD) {
    colStart = Math.round(gridCenterX - width / 2);
  } else if (Math.abs(left - 1) < SNAP_THRESHOLD) {
    colStart = 1;
  } else if (Math.abs(right - (columnCount + 1)) < SNAP_THRESHOLD) {
    colStart = columnCount + 1 - width;
  }

  if (Math.abs(centerY - gridCenterY) < SNAP_THRESHOLD) {
    rowStart = Math.round(gridCenterY - height / 2);
  } else if (Math.abs(top - 1) < SNAP_THRESHOLD) {
    rowStart = 1;
  } else if (Math.abs(bottom - (gridRowCount + 1)) < SNAP_THRESHOLD) {
    rowStart = gridRowCount + 1 - height;
  }

  for (const [id, other] of Object.entries(others)) {
    if (id === activeId) continue;
    const otherEdges = placementEdges(other);

    if (Math.abs(left - otherEdges.left) < SNAP_THRESHOLD) {
      colStart = otherEdges.left;
    } else if (Math.abs(right - otherEdges.right) < SNAP_THRESHOLD) {
      colStart = otherEdges.right - width;
    } else if (Math.abs(centerX - otherEdges.centerX) < SNAP_THRESHOLD) {
      colStart = Math.round(otherEdges.centerX - width / 2);
    }

    if (Math.abs(top - otherEdges.top) < SNAP_THRESHOLD) {
      rowStart = otherEdges.top;
    } else if (Math.abs(bottom - otherEdges.bottom) < SNAP_THRESHOLD) {
      rowStart = otherEdges.bottom - height;
    } else if (Math.abs(centerY - otherEdges.centerY) < SNAP_THRESHOLD) {
      rowStart = Math.round(otherEdges.centerY - height / 2);
    }
  }

  return clampPlacement(
    {
      ...active,
      colStart,
      colEnd: colStart + width,
      rowStart,
      rowEnd: rowStart + height,
    },
    columnCount,
  );
}

/** Snap angle to 0/90/180/270° when within threshold. Alt disables snap. */
export function snapRotationToCardinals(
  rotation: number,
  disableSnap: boolean,
): number {
  let r = rotation % 360;
  if (r < 0) r += 360;

  const normalized = ((Math.round(r) % 360) + 360) % 360;

  if (disableSnap) {
    return normalized;
  }

  for (const target of CARDINAL_ROTATIONS) {
    const diff = Math.min(
      Math.abs(normalized - target),
      360 - Math.abs(normalized - target),
    );
    if (diff <= ROTATION_SNAP_THRESHOLD_DEG) {
      return target;
    }
  }

  return normalized;
}
