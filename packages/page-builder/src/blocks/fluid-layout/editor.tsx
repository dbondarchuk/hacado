"use client";

import { useDroppable } from "@dnd-kit/react";
import {
  BlockFilterRule,
  EditorBlock,
  getMoveBlockOutTarget,
  matchesRule,
  useBlockChildrenBlockIds,
  useBlockDepth,
  useBlockEditor,
  useBlockParentData,
  useBlocks,
  useBlocksDefinitions,
  useCurrentBlock,
  useDispatchAction,
  useDocument,
  useDragIntoNestedModifier,
  useFluidDropCollisionPriority,
  useHasActiveDragBlock,
  useIsSelectedBlock,
  usePortalContext,
  useSelectedBlockId,
  useSelectedScreenSize,
  useSetAllowedRule,
  useSetSelectedBlockId,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  BackgroundVideoLayer,
  BlockStyle,
  hasBackgroundVideo,
  useClassName,
} from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeFluidAlignmentGuides,
  snapFluidPlacement,
  snapRotationToCardinals,
  type FluidAlignmentGuide,
} from "./alignment-guides";
import { FluidLayoutProvider } from "./context";
import { FluidAlignmentGuides } from "./fluid-alignment-guides";
import { FluidChildChrome } from "./fluid-child-chrome";
import { FluidLayoutHelpBar } from "./fluid-layout-help-bar";
import {
  clearChildPlacementOverride,
  clearTierPlacementOverrides,
  getColumnCountForTier,
  hasChildOverride as hasChildOverrideUtil,
  isTierCustom as isTierCustomUtil,
  resolveEffectivePlacements,
  syncPlacementsAllTiers,
  toMergeablePlacementOverrides,
  viewportToPlacementTier,
  type FluidPlacementTier,
} from "./responsive";
import {
  FluidLayoutProps,
  FluidPlacement,
  FluidPlacementOverrides,
  styles,
} from "./schema";
import {
  bringForward as bringForwardUtil,
  bringToFront as bringToFrontUtil,
  getGridRowCount,
  placementsForChildIds,
  pointerAngleFromCenter,
  ResizeHandle,
  resizePlacementByDelta,
  rotatePlacementByPointer,
  sendBackward as sendBackwardUtil,
  sendToBack as sendToBackUtil,
  shiftPlacement,
} from "./utils";

export const FLUID_CHILD_ALLOW: BlockFilterRule = {
  not: {
    type: ["FluidLayout", "PageLayout"],
  },
};

type DragSession =
  | {
      mode: "move";
      childId: string;
      startX: number;
      startY: number;
      origin: FluidPlacement;
    }
  | {
      mode: "resize";
      childId: string;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      origin: FluidPlacement;
    }
  | {
      mode: "rotate";
      childId: string;
      centerX: number;
      centerY: number;
      startAngle: number;
      originRotate: number;
      origin: FluidPlacement;
    };

function placementsEqual(
  a: Record<string, FluidPlacement>,
  b: Record<string, FluidPlacement>,
) {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((id) => {
    const pa = a[id];
    const pb = b[id];
    if (!pa || !pb) return false;
    return (
      pa.colStart === pb.colStart &&
      pa.colEnd === pb.colEnd &&
      pa.rowStart === pb.rowStart &&
      pa.rowEnd === pb.rowEnd &&
      (pa.zIndex ?? 0) === (pb.zIndex ?? 0) &&
      (pa.rotate ?? 0) === (pb.rotate ?? 0)
    );
  });
}

function readGridMetrics(el: HTMLElement, gap: number, columnCount: number) {
  const style = getComputedStyle(el);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const contentWidth = el.clientWidth - paddingLeft - paddingRight;
  const colWidth = (contentWidth - gap * (columnCount - 1)) / columnCount;
  // Square cells: row track size matches column track size.
  const rowHeight = colWidth;
  return { colWidth, rowHeight, gap, paddingLeft, paddingTop };
}

export const FluidLayoutEditor = ({ props }: FluidLayoutProps) => {
  const t = useI18n("builder");
  const currentBlock = useCurrentBlock<FluidLayoutProps>();
  const { ref: overlayRef, onClick: selectFluidLayout } = useBlockEditor(
    currentBlock.id,
  );
  const setSelectedBlockId = useSetSelectedBlockId();
  const className = useClassName();
  const base = currentBlock.base;
  const blockStyle = currentBlock.data?.style;
  const dispatchAction = useDispatchAction();
  const document = useDocument();
  const childIds = useBlockChildrenBlockIds(currentBlock.id, "props") ?? [];
  const depth = useBlockDepth(currentBlock.id) ?? 0;
  const isSelected = useIsSelectedBlock(currentBlock.id);
  const selectedBlockId = useSelectedBlockId();
  const selectedParent = useBlockParentData(selectedBlockId);
  const setAllowedRule = useSetAllowedRule();
  const hasActiveDragBlock = useHasActiveDragBlock();
  const preferNestedDrop = useDragIntoNestedModifier();
  const fluidCollisionPriority = useFluidDropCollisionPriority(
    depth,
    "fluid",
    currentBlock.id,
  );
  const blocksDefinitions = useBlocksDefinitions();
  const blocks = useBlocks();
  const { document: portalDocument } = usePortalContext();
  const selectedScreenSize = useSelectedScreenSize();
  const placementTier = viewportToPlacementTier(selectedScreenSize);
  const columnCount = getColumnCountForTier(placementTier);
  const gap = props.gap ?? 8;
  const basePlacements = props.placements ?? {};
  const placementOverrides = props.placementOverrides ?? {};
  const gridRef = useRef<HTMLDivElement>(null);
  const currentBlockRef = useRef(currentBlock);
  currentBlockRef.current = currentBlock;
  const placementTierRef = useRef(placementTier);
  placementTierRef.current = placementTier;
  const columnCountRef = useRef(columnCount);
  columnCountRef.current = columnCount;
  const storedEffectivePlacements = useMemo(
    () =>
      resolveEffectivePlacements({
        childIds,
        base: basePlacements,
        overrides: placementOverrides,
        tier: placementTier,
      }),
    [basePlacements, childIds, placementOverrides, placementTier],
  );
  const storedEffectivePlacementsRef = useRef(storedEffectivePlacements);
  storedEffectivePlacementsRef.current = storedEffectivePlacements;
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const livePlacementsRef = useRef<Record<string, FluidPlacement> | null>(null);
  const suppressGridClickRef = useRef(false);
  const [livePlacements, setLivePlacements] = useState<Record<
    string,
    FluidPlacement
  > | null>(null);
  livePlacementsRef.current = livePlacements;
  const [cellSize, setCellSize] = useState<number>(24);
  const [alignmentGuides, setAlignmentGuides] = useState<FluidAlignmentGuide[]>(
    [],
  );
  const [isAltPressed, setIsAltPressed] = useState(false);
  const isAltPressedRef = useRef(false);
  isAltPressedRef.current = isAltPressed;

  const showGuides =
    isSelected || selectedParent?.parentBlockId === currentBlock.id;

  useEffect(() => {
    setAllowedRule(currentBlock.id, "props", FLUID_CHILD_ALLOW);
  }, [currentBlock.id, setAllowedRule]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const update = () => {
      const metrics = readGridMetrics(el, gap, columnCount);
      setCellSize(Math.max(8, metrics.colWidth));
    };
    update();

    const view = portalDocument.defaultView;
    const ro = view ? new view.ResizeObserver(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [columnCount, gap, portalDocument, childIds.length]);

  const persistTierPlacements = useCallback(
    (tier: FluidPlacementTier, placements: Record<string, FluidPlacement>) => {
      const block = currentBlockRef.current;
      const blockProps = block.data.props ?? {};

      if (tier === "desktop") {
        const existing = (blockProps.placements ?? {}) as Record<
          string,
          FluidPlacement
        >;
        const cleaned: Record<string, FluidPlacement | undefined> = {
          ...placements,
        };
        for (const id of Object.keys(existing)) {
          if (!(id in placements)) {
            cleaned[id] = undefined;
          }
        }
        dispatchAction({
          type: "set-block-data",
          value: {
            blockId: block.id,
            data: {
              ...block.data,
              props: {
                ...blockProps,
                placements: cleaned,
              },
            },
          },
        });
        return;
      }

      const existingOverrides = (blockProps.placementOverrides ??
        {}) as FluidPlacementOverrides;
      const existingTier = existingOverrides[tier] ?? {};
      const cleaned: Record<string, FluidPlacement | undefined> = {
        ...placements,
      };
      for (const id of Object.keys(existingTier)) {
        if (!(id in placements)) {
          cleaned[id] = undefined;
        }
      }

      const hasValues = Object.values(cleaned).some((value) => value != null);
      const nextOverrides: FluidPlacementOverrides = {
        ...existingOverrides,
      };
      if (hasValues) {
        nextOverrides[tier] = cleaned as Record<string, FluidPlacement>;
      } else {
        delete nextOverrides[tier];
      }

      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: block.id,
          data: {
            ...block.data,
            props: {
              ...blockProps,
              placementOverrides: toMergeablePlacementOverrides(
                nextOverrides,
                existingOverrides,
              ),
            },
          },
        },
      });
    },
    [dispatchAction],
  );

  const persistCurrentTierPlacements = useCallback(
    (placements: Record<string, FluidPlacement>) => {
      persistTierPlacements(placementTierRef.current, placements);
    },
    [persistTierPlacements],
  );

  // Clear optimistic placements once the store has caught up.
  useEffect(() => {
    if (
      livePlacements &&
      placementsEqual(livePlacements, storedEffectivePlacements)
    ) {
      setLivePlacements(null);
    }
  }, [livePlacements, storedEffectivePlacements]);

  useEffect(() => {
    setLivePlacements(null);
    dragRef.current = null;
    setActiveChildId(null);
    setAlignmentGuides([]);
  }, [selectedScreenSize]);

  useEffect(() => {
    if (livePlacements || dragRef.current) return;
    const synced = syncPlacementsAllTiers(childIds, {
      placements: basePlacements,
      placementOverrides,
    });
    const overridesChanged =
      JSON.stringify(synced.placementOverrides) !==
      JSON.stringify(placementOverrides);
    if (synced.placements !== basePlacements || overridesChanged) {
      const block = currentBlockRef.current;
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: block.id,
          data: {
            ...block.data,
            props: {
              ...block.data.props,
              placements: synced.placements,
              placementOverrides: synced.placementOverrides,
            },
          },
        },
      });
    }
  }, [
    basePlacements,
    childIds,
    dispatchAction,
    livePlacements,
    placementOverrides,
  ]);

  const placements = livePlacements ?? storedEffectivePlacements;
  const visiblePlacements = useMemo(
    () => placementsForChildIds(childIds, placements),
    [childIds, placements],
  );
  const rowBuffer = activeChildId || hasActiveDragBlock ? 4 : 0;
  const gridRowCount = getGridRowCount(visiblePlacements, rowBuffer);
  const maxRowEnd = gridRowCount + 1;
  const isTierCustom = useMemo(
    () => isTierCustomUtil(placementOverrides, placementTier),
    [placementOverrides, placementTier],
  );

  const hasChildOverride = useCallback(
    (childId: string) =>
      hasChildOverrideUtil(placementOverrides, placementTier, childId),
    [placementOverrides, placementTier],
  );

  const gridRowCountRef = useRef(gridRowCount);
  gridRowCountRef.current = gridRowCount;

  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: `${currentBlock.id}/props/fluid-drop`,
    collisionPriority: fluidCollisionPriority,
    accept: (draggable) => {
      if (!draggable.type) return false;
      const type = draggable.type as string;
      const blockDefinition = blocksDefinitions.find((b) => b.type === type);
      if (blockDefinition && !matchesRule(blockDefinition, FLUID_CHILD_ALLOW)) {
        return false;
      }
      const allowedParents = blocks[type]?.allowedIn;
      if (
        allowedParents &&
        !matchesRule(
          {
            type: "FluidLayout",
            capabilities: blocks.FluidLayout?.capabilities,
            tags: blocks.FluidLayout?.tags,
          },
          allowedParents,
        )
      ) {
        return false;
      }
      return true;
    },
    data: {
      context: {
        parentBlockId: currentBlock.id,
        parentProperty: "props",
        index: childIds.length,
        type: "",
      },
    },
  });

  const setGridRef = useCallback(
    (node: HTMLDivElement | null) => {
      gridRef.current = node;
      overlayRef(node);
    },
    [overlayRef],
  );

  const onGridClick = useCallback(
    (e: MouseEvent) => {
      if (suppressGridClickRef.current) {
        suppressGridClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      selectFluidLayout(e);
    },
    [selectFluidLayout],
  );

  const suppressParentSelection = useCallback(() => {
    suppressGridClickRef.current = true;
  }, []);

  const updatePlacement = useCallback(
    (childId: string, placement: FluidPlacement) => {
      persistCurrentTierPlacements({ ...placements, [childId]: placement });
    },
    [persistCurrentTierPlacements, placements],
  );

  const bringForward = useCallback(
    (childId: string) => {
      persistCurrentTierPlacements(bringForwardUtil(placements, childId));
    },
    [persistCurrentTierPlacements, placements],
  );

  const sendBackward = useCallback(
    (childId: string) => {
      persistCurrentTierPlacements(sendBackwardUtil(placements, childId));
    },
    [persistCurrentTierPlacements, placements],
  );

  const bringToFront = useCallback(
    (childId: string) => {
      persistCurrentTierPlacements(bringToFrontUtil(placements, childId));
    },
    [persistCurrentTierPlacements, placements],
  );

  const sendToBack = useCallback(
    (childId: string) => {
      persistCurrentTierPlacements(sendToBackUtil(placements, childId));
    },
    [persistCurrentTierPlacements, placements],
  );

  const beginMove = useCallback(
    (childId: string, clientX: number, clientY: number) => {
      const origin = storedEffectivePlacementsRef.current[childId];
      if (!origin) return;
      dragRef.current = {
        mode: "move",
        childId,
        startX: clientX,
        startY: clientY,
        origin,
      };
      lastPointerRef.current = { x: clientX, y: clientY };
      const initial = { ...storedEffectivePlacementsRef.current };
      livePlacementsRef.current = initial;
      setActiveChildId(childId);
      setLivePlacements(initial);
    },
    [],
  );

  const beginResize = useCallback(
    (
      childId: string,
      handle: ResizeHandle,
      clientX: number,
      clientY: number,
    ) => {
      const origin = storedEffectivePlacementsRef.current[childId];
      if (!origin) return;
      dragRef.current = {
        mode: "resize",
        childId,
        handle,
        startX: clientX,
        startY: clientY,
        origin,
      };
      lastPointerRef.current = { x: clientX, y: clientY };
      const initial = { ...storedEffectivePlacementsRef.current };
      livePlacementsRef.current = initial;
      setActiveChildId(childId);
      setLivePlacements(initial);
    },
    [],
  );

  const beginRotate = useCallback(
    (
      childId: string,
      clientX: number,
      clientY: number,
      centerX: number,
      centerY: number,
    ) => {
      const origin = storedEffectivePlacementsRef.current[childId];
      if (!origin) return;
      dragRef.current = {
        mode: "rotate",
        childId,
        centerX,
        centerY,
        startAngle: pointerAngleFromCenter(clientX, clientY, centerX, centerY),
        originRotate: origin.rotate ?? 0,
        origin,
      };
      lastPointerRef.current = { x: clientX, y: clientY };
      const initial = { ...storedEffectivePlacementsRef.current };
      livePlacementsRef.current = initial;
      setActiveChildId(childId);
      setLivePlacements(initial);
    },
    [],
  );

  const resetRotation = useCallback(
    (childId: string) => {
      const current = placements[childId];
      if (!current?.rotate) return;
      persistCurrentTierPlacements({
        ...placements,
        [childId]: { ...current, rotate: undefined },
      });
    },
    [persistCurrentTierPlacements, placements],
  );

  const resetChildPlacement = useCallback(
    (childId: string) => {
      if (placementTier === "desktop") return;
      const nextOverrides = clearChildPlacementOverride(
        placementOverrides,
        placementTier,
        childId,
      );
      setLivePlacements(null);
      const block = currentBlockRef.current;
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: block.id,
          data: {
            ...block.data,
            props: {
              ...block.data.props,
              placementOverrides: toMergeablePlacementOverrides(
                nextOverrides,
                placementOverrides,
              ),
            },
          },
        },
      });
    },
    [dispatchAction, placementOverrides, placementTier],
  );

  const resetTierPlacements = useCallback(() => {
    if (placementTier === "desktop") return;
    const nextOverrides = clearTierPlacementOverrides(
      placementOverrides,
      placementTier,
    );
    setLivePlacements(null);
    const block = currentBlockRef.current;
    dispatchAction({
      type: "set-block-data",
      value: {
        blockId: block.id,
        data: {
          ...block.data,
          props: {
            ...block.data.props,
            placementOverrides: toMergeablePlacementOverrides(
              nextOverrides,
              placementOverrides,
            ),
          },
        },
      },
    });
  }, [dispatchAction, placementOverrides, placementTier]);

  const cloneChild = useCallback(
    (childId: string) => {
      dispatchAction({
        type: "clone-block",
        value: { blockId: childId },
      });
    },
    [dispatchAction],
  );

  const deleteChild = useCallback(
    (childId: string) => {
      dispatchAction({
        type: "delete-block",
        value: { blockId: childId },
      });
    },
    [dispatchAction],
  );

  const moveOut = useCallback(
    (childId: string) => {
      const target = getMoveBlockOutTarget(document, childId);
      if (!target) return;
      suppressParentSelection();
      dispatchAction({
        type: "move-block",
        value: {
          blockId: childId,
          ...target,
        },
      });
      setSelectedBlockId(childId);
    },
    [dispatchAction, document, setSelectedBlockId, suppressParentSelection],
  );

  useEffect(() => {
    const view = portalDocument.defaultView;
    if (!view) return;

    const onPointerMove = (e: PointerEvent) => {
      const session = dragRef.current;
      const el = gridRef.current;
      if (!session || !el) return;
      e.preventDefault();
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      const disableSnap = e.altKey || isAltPressedRef.current;
      const base =
        livePlacementsRef.current ?? storedEffectivePlacementsRef.current;
      const cols = columnCountRef.current;
      let childPlacement: FluidPlacement;

      if (session.mode === "rotate") {
        const currentAngle = pointerAngleFromCenter(
          e.clientX,
          e.clientY,
          session.centerX,
          session.centerY,
        );
        childPlacement = rotatePlacementByPointer(
          session.origin,
          session.originRotate,
          session.startAngle,
          currentAngle,
          disableSnap,
        );
        setAlignmentGuides([]);
      } else {
        const metrics = readGridMetrics(el, gap, cols);
        const cellW = metrics.colWidth + metrics.gap;
        const cellH = metrics.rowHeight + metrics.gap;
        const dCol = Math.round((e.clientX - session.startX) / cellW);
        const dRow = Math.round((e.clientY - session.startY) / cellH);

        if (session.mode === "move") {
          childPlacement = shiftPlacement(session.origin, dCol, dRow, cols);
          childPlacement = snapFluidPlacement(
            childPlacement,
            base,
            session.childId,
            gridRowCountRef.current,
            disableSnap,
            cols,
          );
          setAlignmentGuides(
            computeFluidAlignmentGuides(
              childPlacement,
              base,
              session.childId,
              gridRowCountRef.current,
              disableSnap,
              cols,
            ),
          );
        } else {
          childPlacement = resizePlacementByDelta(
            session.origin,
            session.handle,
            dCol,
            dRow,
            cols,
          );
          setAlignmentGuides([]);
        }
      }

      const next = { ...base, [session.childId]: childPlacement };
      livePlacementsRef.current = next;
      setLivePlacements(next);
    };

    const onPointerUp = () => {
      const session = dragRef.current;
      if (!session) return;
      const childId = session.childId;
      const mode = session.mode;
      dragRef.current = null;
      setActiveChildId(null);
      lastPointerRef.current = null;
      setAlignmentGuides([]);

      let final = livePlacementsRef.current;
      if (final && mode === "rotate") {
        const placement = final[childId];
        if (placement) {
          const rotate = snapRotationToCardinals(
            placement.rotate ?? 0,
            isAltPressedRef.current,
          );
          final = {
            ...final,
            [childId]:
              rotate === 0
                ? (() => {
                    const { rotate: _rotate, ...rest } = placement;
                    return rest as FluidPlacement;
                  })()
                : { ...placement, rotate },
          };
          livePlacementsRef.current = final;
        }
      }
      if (final) {
        persistCurrentTierPlacements(final);
      }
      suppressGridClickRef.current = true;
      setSelectedBlockId(childId);
    };

    view.addEventListener("pointermove", onPointerMove);
    view.addEventListener("pointerup", onPointerUp);
    view.addEventListener("pointercancel", onPointerUp);
    return () => {
      view.removeEventListener("pointermove", onPointerMove);
      view.removeEventListener("pointerup", onPointerUp);
      view.removeEventListener("pointercancel", onPointerUp);
    };
  }, [gap, persistCurrentTierPlacements, portalDocument, setSelectedBlockId]);

  useEffect(() => {
    const view = portalDocument.defaultView;
    if (!view) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        isAltPressedRef.current = true;
        setIsAltPressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        isAltPressedRef.current = false;
        setIsAltPressed(false);
        setAlignmentGuides([]);
      }
    };

    view.addEventListener("keydown", onKeyDown);
    view.addEventListener("keyup", onKeyUp);
    return () => {
      view.removeEventListener("keydown", onKeyDown);
      view.removeEventListener("keyup", onKeyUp);
    };
  }, [portalDocument]);

  useEffect(() => {
    const view = portalDocument.defaultView;
    if (!view) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return !!target.closest(
        "input, textarea, select, [contenteditable='true']",
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedBlockId || !childIds.includes(selectedBlockId)) return;
      if (isEditableTarget(e.target)) return;

      const step = e.shiftKey ? 2 : 1;
      let dCol = 0;
      let dRow = 0;
      switch (e.key) {
        case "ArrowLeft":
          dCol = -step;
          break;
        case "ArrowRight":
          dCol = step;
          break;
        case "ArrowUp":
          dRow = -step;
          break;
        case "ArrowDown":
          dRow = step;
          break;
        default:
          return;
      }

      e.preventDefault();
      e.stopPropagation();

      const placement =
        livePlacementsRef.current?.[selectedBlockId] ??
        storedEffectivePlacementsRef.current[selectedBlockId];
      if (!placement) return;

      const disableSnap = e.altKey || isAltPressedRef.current;
      const cols = columnCountRef.current;
      let next = shiftPlacement(placement, dCol, dRow, cols);
      next = snapFluidPlacement(
        next,
        storedEffectivePlacementsRef.current,
        selectedBlockId,
        gridRowCountRef.current,
        disableSnap,
        cols,
      );

      const nextPlacements = {
        ...storedEffectivePlacementsRef.current,
        [selectedBlockId]: next,
      };
      persistCurrentTierPlacements(nextPlacements);
      setAlignmentGuides(
        computeFluidAlignmentGuides(
          next,
          nextPlacements,
          selectedBlockId,
          gridRowCountRef.current,
          disableSnap,
          cols,
        ),
      );
      suppressGridClickRef.current = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (
        e.key.startsWith("Arrow") &&
        selectedBlockId &&
        childIds.includes(selectedBlockId)
      ) {
        setAlignmentGuides([]);
      }
    };

    view.addEventListener("keydown", onKeyDown);
    view.addEventListener("keyup", onKeyUp);
    return () => {
      view.removeEventListener("keydown", onKeyDown);
      view.removeEventListener("keyup", onKeyUp);
    };
  }, [childIds, persistCurrentTierPlacements, portalDocument, selectedBlockId]);

  const contextValue = useMemo(
    () => ({
      fluidBlockId: currentBlock.id,
      placements: visiblePlacements,
      placementTier,
      columnCount,
      hasChildOverride,
      isTierCustom,
      updatePlacement,
      resetChildPlacement,
      resetTierPlacements,
      bringForward,
      sendBackward,
      bringToFront,
      sendToBack,
      rowHeight: cellSize,
      gap,
      showGuides,
      activeChildId,
      setActiveChildId,
      beginMove,
      beginResize,
      beginRotate,
      resetRotation,
      suppressParentSelection,
      cloneChild,
      deleteChild,
      moveOut,
      isAltPressed,
    }),
    [
      activeChildId,
      beginMove,
      beginResize,
      beginRotate,
      bringForward,
      bringToFront,
      cellSize,
      cloneChild,
      columnCount,
      currentBlock.id,
      deleteChild,
      gap,
      hasChildOverride,
      isAltPressed,
      isTierCustom,
      moveOut,
      placementTier,
      resetChildPlacement,
      resetRotation,
      resetTierPlacements,
      visiblePlacements,
      suppressParentSelection,
      sendBackward,
      sendToBack,
      showGuides,
      updatePlacement,
    ],
  );

  const squareRow = `minmax(${cellSize}px, ${cellSize}px)`;
  const hasVideoBg = hasBackgroundVideo(blockStyle);
  const gridCss = `
.${className}.fluid-layout-grid {
  container-type: inline-size;
  display: grid !important;
  grid-template-columns: repeat(${columnCount}, minmax(0, 1fr));
  grid-template-rows: repeat(${gridRowCount}, ${squareRow});
  gap: ${gap}px;
  position: relative;
  box-sizing: border-box;
  overflow: ${hasVideoBg ? "hidden" : "visible"};
  ${hasVideoBg ? "isolation: isolate;" : ""}
}
.${className}.fluid-layout-grid > [data-fluid-child] {
  width: auto;
  min-width: 0;
  min-height: 0;
}
.${className}.fluid-layout-grid > [data-fluid-child] > .fluid-child-rotate,
.${className}.fluid-layout-grid > [data-fluid-child] > .fluid-child-rotate > .fluid-child-content,
.${className}.fluid-layout-grid > [data-fluid-child] > .fluid-child-rotate > .fluid-child-content > * {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  box-sizing: border-box;
}
.${className}.fluid-layout-grid > [data-fluid-child] > .fluid-child-rotate > .fluid-child-content > [data-block-id] {
display: grid !important;
}
`;

  return (
    <FluidLayoutProvider value={contextValue}>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={blockStyle}
        isEditor
      />
      <style dangerouslySetInnerHTML={{ __html: gridCss }} />
      <div
        className={cn(className, "fluid-layout-grid")}
        id={base?.id}
        onClick={onGridClick}
        ref={setGridRef}
      >
        <BackgroundVideoLayer style={blockStyle} />
        <div
          ref={droppableRef}
          className={cn(
            "pointer-events-none absolute inset-0 rounded-sm border-2 border-dashed",
            hasActiveDragBlock && isDropTarget
              ? preferNestedDrop
                ? "border-blue-400/25 bg-blue-400/5"
                : "border-blue-500 bg-blue-500/15"
              : "border-transparent",
          )}
          aria-hidden
        />
        {showGuides ? (
          <div
            aria-hidden
            className="pointer-events-none z-0 grid"
            style={{
              gridColumn: `1 / ${columnCount + 1}`,
              gridRow: `1 / ${maxRowEnd}`,
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridRowCount}, ${cellSize}px)`,
              gap: `${gap}px`,
            }}
          >
            {Array.from({ length: columnCount * gridRowCount }).map((_, i) => (
              <div
                key={i}
                className="min-h-0 border border-dashed border-blue-400/30 bg-blue-400/[0.04]"
              />
            ))}
          </div>
        ) : null}
        <div
          className="pointer-events-none relative z-[9998]"
          style={{
            gridColumn: `1 / ${columnCount + 1}`,
            gridRow: `1 / ${maxRowEnd}`,
          }}
        >
          <FluidAlignmentGuides
            guides={alignmentGuides}
            cellSize={cellSize}
            gap={gap}
            gridRowCount={gridRowCount}
          />
        </div>
        {childIds.map((childId, index) => {
          const placement = visiblePlacements[childId];
          if (!placement) return null;
          return (
            <FluidChildChrome
              key={childId}
              childId={childId}
              placement={placement}
              selected={selectedBlockId === childId}
            >
              <EditorBlock
                blockId={childId}
                index={index}
                parentBlockId={currentBlock.id}
                parentProperty="props"
                disableMove
                disableResize
                disableOverlay
                allow={FLUID_CHILD_ALLOW}
              />
            </FluidChildChrome>
          );
        })}
        {!childIds.length ? (
          <div className="pointer-events-none col-span-full flex min-h-32 items-center justify-center text-sm text-muted-foreground">
            {t("pageBuilder.blocks.fluidLayout.emptyHint")}
          </div>
        ) : null}
        {showGuides ? (
          <FluidLayoutHelpBar
            placementTier={placementTier}
            isTierCustom={isTierCustom}
            onResetTier={resetTierPlacements}
          />
        ) : null}
      </div>
    </FluidLayoutProvider>
  );
};
