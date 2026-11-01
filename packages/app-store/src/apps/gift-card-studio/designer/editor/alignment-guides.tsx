"use client";

import { useEffect, useState } from "react";
import type { Element } from "../lib/types";

interface AlignmentGuide {
  type: "horizontal" | "vertical";
  position: number;
  label?: string;
}

interface AlignmentGuidesProps {
  activeElements: Element[];
  allElements: Element[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  isAltPressed: boolean;
}

export function AlignmentGuides({
  activeElements,
  allElements,
  canvasWidth,
  canvasHeight,
  zoom,
  isAltPressed,
}: AlignmentGuidesProps) {
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);

  useEffect(() => {
    if (activeElements.length === 0 || isAltPressed) {
      setGuides([]);
      return;
    }

    const SNAP_THRESHOLD = 8 / zoom;
    const newGuides: AlignmentGuide[] = [];

    // Get bounds of active element(s)
    let activeLeft = Number.POSITIVE_INFINITY;
    let activeRight = Number.NEGATIVE_INFINITY;
    let activeTop = Number.POSITIVE_INFINITY;
    let activeBottom = Number.NEGATIVE_INFINITY;
    let activeCenterX = 0;
    let activeCenterY = 0;

    activeElements.forEach((el) => {
      activeLeft = Math.min(activeLeft, el.position.x);
      activeTop = Math.min(activeTop, el.position.y);
      activeRight = Math.max(activeRight, el.position.x + el.size.width);
      activeBottom = Math.max(activeBottom, el.position.y + el.size.height);
    });

    activeCenterX = (activeLeft + activeRight) / 2;
    activeCenterY = (activeTop + activeBottom) / 2;

    // Canvas center guides
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    if (Math.abs(activeCenterX - canvasCenterX) < SNAP_THRESHOLD) {
      newGuides.push({
        type: "vertical",
        position: canvasCenterX,
        label: "Center",
      });
    }

    if (Math.abs(activeCenterY - canvasCenterY) < SNAP_THRESHOLD) {
      newGuides.push({
        type: "horizontal",
        position: canvasCenterY,
        label: "Center",
      });
    }

    // Canvas edge guides
    if (Math.abs(activeLeft) < SNAP_THRESHOLD) {
      newGuides.push({ type: "vertical", position: 0 });
    }

    if (Math.abs(activeRight - canvasWidth) < SNAP_THRESHOLD) {
      newGuides.push({ type: "vertical", position: canvasWidth });
    }

    if (Math.abs(activeTop) < SNAP_THRESHOLD) {
      newGuides.push({ type: "horizontal", position: 0 });
    }

    if (Math.abs(activeBottom - canvasHeight) < SNAP_THRESHOLD) {
      newGuides.push({ type: "horizontal", position: canvasHeight });
    }

    // Other element alignment guides
    const otherElements = allElements.filter(
      (el) =>
        !activeElements.find((ae) => ae.id === el.id) && el.type !== "group",
    );

    otherElements.forEach((el) => {
      const elLeft = el.position.x;
      const elRight = el.position.x + el.size.width;
      const elTop = el.position.y;
      const elBottom = el.position.y + el.size.height;
      const elCenterX = (elLeft + elRight) / 2;
      const elCenterY = (elTop + elBottom) / 2;

      // Vertical alignment
      if (Math.abs(activeLeft - elLeft) < SNAP_THRESHOLD) {
        newGuides.push({ type: "vertical", position: elLeft });
      }

      if (Math.abs(activeRight - elRight) < SNAP_THRESHOLD) {
        newGuides.push({ type: "vertical", position: elRight });
      }

      if (Math.abs(activeCenterX - elCenterX) < SNAP_THRESHOLD) {
        newGuides.push({ type: "vertical", position: elCenterX });
      }

      // Horizontal alignment
      if (Math.abs(activeTop - elTop) < SNAP_THRESHOLD) {
        newGuides.push({ type: "horizontal", position: elTop });
      }

      if (Math.abs(activeBottom - elBottom) < SNAP_THRESHOLD) {
        newGuides.push({ type: "horizontal", position: elBottom });
      }

      if (Math.abs(activeCenterY - elCenterY) < SNAP_THRESHOLD) {
        newGuides.push({ type: "horizontal", position: elCenterY });
      }
    });

    // Remove duplicates
    const uniqueGuides = newGuides.filter(
      (guide, index, self) =>
        index ===
        self.findIndex(
          (g) =>
            g.type === guide.type && Math.abs(g.position - guide.position) < 1,
        ),
    );

    setGuides(uniqueGuides);
  }, [
    activeElements,
    allElements,
    canvasWidth,
    canvasHeight,
    zoom,
    isAltPressed,
  ]);

  return (
    <>
      {guides.map((guide, index) => (
        <div
          key={index}
          className="absolute pointer-events-none"
          style={{
            ...(guide.type === "vertical"
              ? {
                  left: guide.position * zoom,
                  top: 0,
                  width: 1,
                  height: "100%",
                }
              : {
                  left: 0,
                  top: guide.position * zoom,
                  width: "100%",
                  height: 1,
                }),
            backgroundColor: "#ff00ff",
            boxShadow: "0 0 2px rgba(255, 0, 255, 0.5)",
            zIndex: 1000,
          }}
        >
          {guide.label && (
            <span
              className="absolute bg-[#ff00ff] text-white text-xs px-1 rounded"
              style={{
                ...(guide.type === "vertical"
                  ? { left: 4, top: 4 }
                  : { top: 4, left: 4 }),
              }}
            >
              {guide.label}
            </span>
          )}
        </div>
      ))}
    </>
  );
}

export function calculateSnappedPosition(
  element: Element,
  allElements: Element[],
  canvasWidth: number,
  canvasHeight: number,
  isAltPressed: boolean,
): { x: number; y: number } {
  if (isAltPressed) {
    return { x: element.position.x, y: element.position.y };
  }

  const SNAP_THRESHOLD = 8;
  let x = element.position.x;
  let y = element.position.y;

  const left = x;
  const right = x + element.size.width;
  const centerX = (left + right) / 2;
  const top = y;
  const bottom = y + element.size.height;
  const centerY = (top + bottom) / 2;

  // Canvas snapping
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) {
    x = canvasCenterX - element.size.width / 2;
  } else if (Math.abs(left) < SNAP_THRESHOLD) {
    x = 0;
  } else if (Math.abs(right - canvasWidth) < SNAP_THRESHOLD) {
    x = canvasWidth - element.size.width;
  }

  if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) {
    y = canvasCenterY - element.size.height / 2;
  } else if (Math.abs(top) < SNAP_THRESHOLD) {
    y = 0;
  } else if (Math.abs(bottom - canvasHeight) < SNAP_THRESHOLD) {
    y = canvasHeight - element.size.height;
  }

  // Element snapping
  const otherElements = allElements.filter(
    (el) => el.id !== element.id && el.type !== "group",
  );

  otherElements.forEach((el) => {
    const elLeft = el.position.x;
    const elRight = el.position.x + el.size.width;
    const elCenterX = (elLeft + elRight) / 2;
    const elTop = el.position.y;
    const elBottom = el.position.y + el.size.height;
    const elCenterY = (elTop + elBottom) / 2;

    if (Math.abs(left - elLeft) < SNAP_THRESHOLD) {
      x = elLeft;
    } else if (Math.abs(right - elRight) < SNAP_THRESHOLD) {
      x = elRight - element.size.width;
    } else if (Math.abs(centerX - elCenterX) < SNAP_THRESHOLD) {
      x = elCenterX - element.size.width / 2;
    }

    if (Math.abs(top - elTop) < SNAP_THRESHOLD) {
      y = elTop;
    } else if (Math.abs(bottom - elBottom) < SNAP_THRESHOLD) {
      y = elBottom - element.size.height;
    } else if (Math.abs(centerY - elCenterY) < SNAP_THRESHOLD) {
      y = elCenterY - element.size.height / 2;
    }
  });

  return { x, y };
}

const CARDINAL_ROTATIONS = [0, 90, 180, 270] as const;
const ROTATION_SNAP_THRESHOLD_DEG = 8;

/** Snap angle to 0/90/180/270° when within threshold. Pass `disableSnap` (e.g. Alt) to keep free rotation. */
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

  for (const t of CARDINAL_ROTATIONS) {
    const diff = Math.min(
      Math.abs(normalized - t),
      360 - Math.abs(normalized - t),
    );

    if (diff <= ROTATION_SNAP_THRESHOLD_DEG) {
      return t;
    }
  }

  return normalized;
}
