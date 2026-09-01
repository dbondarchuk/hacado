"use client";

import { createContext, useContext } from "react";
import type { FluidPlacementTier } from "./responsive";
import { FluidPlacement } from "./schema";
import { ResizeHandle } from "./utils";

export type FluidLayoutContextValue = {
  fluidBlockId: string;
  placements: Record<string, FluidPlacement>;
  placementTier: FluidPlacementTier;
  columnCount: number;
  hasChildOverride: (childId: string) => boolean;
  isTierCustom: boolean;
  updatePlacement: (childId: string, placement: FluidPlacement) => void;
  resetChildPlacement: (childId: string) => void;
  resetTierPlacements: () => void;
  bringForward: (childId: string) => void;
  sendBackward: (childId: string) => void;
  bringToFront: (childId: string) => void;
  sendToBack: (childId: string) => void;
  moveOut: (childId: string) => void;
  rowHeight: number;
  gap: number;
  showGuides: boolean;
  activeChildId: string | null;
  setActiveChildId: (id: string | null) => void;
  beginMove: (childId: string, clientX: number, clientY: number) => void;
  beginResize: (
    childId: string,
    handle: ResizeHandle,
    clientX: number,
    clientY: number,
  ) => void;
  beginRotate: (
    childId: string,
    clientX: number,
    clientY: number,
    centerX: number,
    centerY: number,
  ) => void;
  resetRotation: (childId: string) => void;
  suppressParentSelection: () => void;
  cloneChild: (childId: string) => void;
  deleteChild: (childId: string) => void;
  isAltPressed: boolean;
};

const FluidLayoutContext = createContext<FluidLayoutContextValue | null>(null);

export const FluidLayoutProvider = FluidLayoutContext.Provider;

export function useFluidLayout() {
  const ctx = useContext(FluidLayoutContext);
  if (!ctx) {
    throw new Error("useFluidLayout must be used within FluidLayoutProvider");
  }
  return ctx;
}

export function useFluidLayoutOptional() {
  return useContext(FluidLayoutContext);
}
