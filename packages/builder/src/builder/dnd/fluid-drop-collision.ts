"use client";

import { useMemo } from "react";
import {
  getBlockHierarchy,
  useActiveDragBlock,
  useBlockHierarchy,
  useDragIntoNestedModifier,
  useEditorStateStore,
  useHasActiveDragBlock,
} from "../../documents/editor/context";

export const FLUID_LAYOUT_BLOCK_TYPE = "FluidLayout";

const FLUID_DROP_BOOST = 20;
const NESTED_DROP_BOOST = 25;
const FLUID_DROP_PENALTY = 15;

export function getFluidLayoutDropCollisionPriority(
  depth: number,
  target: "fluid" | "nested",
  preferNestedDrop: boolean,
): number {
  if (preferNestedDrop) {
    return target === "nested"
      ? depth + NESTED_DROP_BOOST
      : depth - FLUID_DROP_PENALTY;
  }
  return target === "fluid"
    ? depth + FLUID_DROP_BOOST
    : depth - FLUID_DROP_PENALTY;
}

export function getFluidLayoutAncestorId(
  blockId: string | null,
  indexes: Parameters<typeof getBlockHierarchy>[1],
): string | null {
  const hierarchy = getBlockHierarchy(blockId, indexes);
  if (!hierarchy) return null;
  for (let i = hierarchy.length - 1; i >= 0; i--) {
    if (hierarchy[i].type === FLUID_LAYOUT_BLOCK_TYPE) {
      return hierarchy[i].id;
    }
  }
  return null;
}

export function useFluidLayoutAncestorId(
  blockId: string | null,
): string | null {
  const hierarchy = useBlockHierarchy(blockId);
  return useMemo(() => {
    if (!hierarchy) return null;
    for (let i = hierarchy.length - 1; i >= 0; i--) {
      if (hierarchy[i].type === FLUID_LAYOUT_BLOCK_TYPE) {
        return hierarchy[i].id;
      }
    }
    return null;
  }, [hierarchy]);
}

function shouldSkipFluidDropAdjustment(
  activeDrag: NonNullable<ReturnType<typeof useActiveDragBlock>>,
  targetParentBlockId: string,
  fluidAncestorId: string,
  indexes: Parameters<typeof getBlockHierarchy>[1],
): boolean {
  if (activeDrag.isTemplate) return false;

  const dragFluidId = getFluidLayoutAncestorId(activeDrag.blockId, indexes);
  if (dragFluidId !== fluidAncestorId) return false;

  return activeDrag.parentBlockId === targetParentBlockId;
}

function isDragSourceOutsideFluid(
  activeDrag: NonNullable<ReturnType<typeof useActiveDragBlock>>,
  indexes: Parameters<typeof getBlockHierarchy>[1],
): boolean {
  if (activeDrag.isTemplate) return true;
  return getFluidLayoutAncestorId(activeDrag.blockId, indexes) === null;
}

function resolvePreferNestedDrop(
  preferNestedModifier: boolean,
  activeDrag: ReturnType<typeof useActiveDragBlock>,
  targetParentBlockId: string,
  fluidAncestorId: string,
  indexes: Parameters<typeof getBlockHierarchy>[1],
): boolean {
  if (!activeDrag) return preferNestedModifier;

  const targetIsFluidRoot = targetParentBlockId === fluidAncestorId;

  if (preferNestedModifier) {
    // Ctrl/Cmd: nest into blocks inside fluid, but still allow fluid grid drops.
    return !targetIsFluidRoot;
  }

  if (isDragSourceOutsideFluid(activeDrag, indexes)) {
    return false;
  }

  const dragFluidId = getFluidLayoutAncestorId(activeDrag.blockId, indexes);
  if (dragFluidId !== fluidAncestorId) return false;

  // Same fluid layout, different parent - e.g. icon on grid → button children.
  return activeDrag.parentBlockId !== targetParentBlockId;
}

export function usePreferNestedDrop(targetParentBlockId: string): boolean {
  const preferNestedModifier = useDragIntoNestedModifier();
  const hasActiveDragBlock = useHasActiveDragBlock();
  const activeDrag = useActiveDragBlock();
  const fluidAncestorId = useFluidLayoutAncestorId(targetParentBlockId);
  const store = useEditorStateStore();

  return useMemo(() => {
    if (!hasActiveDragBlock || !fluidAncestorId) return preferNestedModifier;

    return resolvePreferNestedDrop(
      preferNestedModifier,
      activeDrag,
      targetParentBlockId,
      fluidAncestorId,
      store.getState().indexes,
    );
  }, [
    activeDrag,
    fluidAncestorId,
    hasActiveDragBlock,
    preferNestedModifier,
    store,
    targetParentBlockId,
  ]);
}

export function useFluidDropCollisionPriority(
  depth: number,
  target: "fluid" | "nested",
  targetParentBlockId: string,
): number {
  const hasActiveDragBlock = useHasActiveDragBlock();
  const preferNestedDrop = usePreferNestedDrop(targetParentBlockId);
  const activeDrag = useActiveDragBlock();
  const fluidAncestorId = useFluidLayoutAncestorId(targetParentBlockId);
  const store = useEditorStateStore();

  return useMemo(() => {
    if (!hasActiveDragBlock || !fluidAncestorId || !activeDrag) {
      return depth;
    }

    const indexes = store.getState().indexes;
    if (
      shouldSkipFluidDropAdjustment(
        activeDrag,
        targetParentBlockId,
        fluidAncestorId,
        indexes,
      )
    ) {
      return depth;
    }

    return getFluidLayoutDropCollisionPriority(depth, target, preferNestedDrop);
  }, [
    activeDrag,
    depth,
    fluidAncestorId,
    hasActiveDragBlock,
    preferNestedDrop,
    store,
    target,
    targetParentBlockId,
  ]);
}
