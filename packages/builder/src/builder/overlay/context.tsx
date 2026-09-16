"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import {
  createContext,
  ReactNode,
  RefCallback,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useIsCurrentBlockOverlay } from "../../documents/editor/block";
import {
  useAllowedRule,
  useBlockChildrenIds,
  useBlockDefinition,
  useBlockDisableOptions,
  useBlockParentData,
  useBlocks,
  useBlocksDefinitions,
  useDisableAnimation,
  useHasActiveDragBlock,
  useIsActiveDragBlock,
  useIsSelectedBlock,
  useRootBlockId,
  useSelectedBlockId,
  useSetDisableAnimation,
  useSetSelectedBlockId,
} from "../../documents/editor/context";
import { matchesRule } from "../../documents/utils";
import { DndContext } from "../../types/dndContext";
import { createDynamicCollisionDetector } from "../dnd/collision/dynamic";
import {
  FLUID_LAYOUT_BLOCK_TYPE,
  useFluidDropCollisionPriority,
} from "../dnd/fluid-drop-collision";
import { usePortalContext } from "../template-panel/portal-context";
import { SelectedBlockOverlay } from "./selected-block-overlay";
import { ResizeDirection } from "./types";

const CURSORS: Record<ResizeDirection, string> = {
  nw: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  se: "nwse-resize",
  n: "ns-resize",
  s: "ns-resize",
  w: "ew-resize",
  e: "es-resize",
};

type BlockGeometry = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function toOverlayGeometry(
  rect: DOMRect,
  overlayHost: HTMLElement | null,
  view: Window | null,
): BlockGeometry {
  if (overlayHost) {
    const hostRect = overlayHost.getBoundingClientRect();
    // Elements live in the iframe; their rect is iframe-viewport-relative.
    // The overlay host lives in the parent page — add the iframe's offset.
    const iframe = overlayHost.parentElement?.querySelector("iframe");
    const iframeRect = iframe?.getBoundingClientRect();
    const frameTop = iframeRect?.top ?? hostRect.top;
    const frameLeft = iframeRect?.left ?? hostRect.left;

    return {
      top: rect.top + frameTop - hostRect.top,
      left: rect.left + frameLeft - hostRect.left,
      width: rect.width,
      height: rect.height,
    };
  }

  return {
    top: rect.top + (view?.scrollY ?? 0),
    left: rect.left + (view?.scrollX ?? 0),
    width: rect.width,
    height: rect.height,
  };
}

function applyOverlayGeometry(box: HTMLElement, geometry: BlockGeometry) {
  box.style.top = `${geometry.top}px`;
  box.style.left = `${geometry.left}px`;
  box.style.width = `${geometry.width}px`;
  box.style.height = `${geometry.height}px`;
}

// ---------------------------
// Types
// ---------------------------
type BlockMeta = {
  onResize?: (width: number, height: number) => void;
  handleRef: RefCallback<Element>;
};

type OverlayContextType = {
  hoveredId: string | null;
  selectedId: string | null;
  hoveredBlock: BlockGeometry | null;
  selectedBlock: BlockGeometry | null;
  selectedBlockElement: Element | null;
  hoveredBlockElement: Element | null;
  selectedBlockMeta: BlockMeta | null;
  updateActiveBlocks: () => void;
};

type OverlayBlockContextType = {
  register: (
    id: string,
    el: Element,
    handleRef: RefCallback<Element>,
    onResize?: (width: number, height: number) => void,
  ) => void;
  unregister: (id: string) => void;
};

// ---------------------------
// Context
// ---------------------------
const OverlayContext = createContext<OverlayContextType | null>(null);
const OverlayBlockContext = createContext<OverlayBlockContextType | null>(null);

// ---------------------------
// Provider
// ---------------------------
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [hoveredBlock, setHoveredBlock] = useState<BlockGeometry | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockGeometry | null>(
    null,
  );

  const selectedId = useSelectedBlockId();
  const isDragging = useHasActiveDragBlock();

  const meta = useRef(new Map<string, BlockMeta>());

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { document, overlayHost } = usePortalContext();

  const elements = useRef(new Map<string, Element>());
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // ---------------------------
  // Global hover detection for nested blocks
  // ---------------------------
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const blockEl = elements.find(
        (el) => "dataset" in el && (el.dataset as { blockId: string }).blockId,
      ) as HTMLElement | undefined;

      if (blockEl) {
        setHoveredId(blockEl.dataset.blockId!);
      } else {
        setHoveredId(null);
      }
    };

    document.defaultView?.addEventListener("mousemove", onMove);
    return () => document.defaultView?.removeEventListener("mousemove", onMove);
  }, [document]);

  useEffect(() => {
    if (!selectedId) return;
    const timeoutId = setTimeout(() => {
      elements.current.get(selectedId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedId]);

  const updateActiveBlocks = useCallback(() => {
    if (hoveredId) {
      const el = elements.current.get(hoveredId);
      if (el) {
        const next = toOverlayGeometry(
          el.getBoundingClientRect(),
          overlayHost,
          document.defaultView,
        );
        setHoveredBlock((prev) => {
          if (
            !prev ||
            prev.top !== next.top ||
            prev.left !== next.left ||
            prev.width !== next.width ||
            prev.height !== next.height
          ) {
            return next;
          }
          return prev;
        });
      }
    }

    if (selectedId) {
      const el = elements.current.get(selectedId);
      if (el) {
        const next = toOverlayGeometry(
          el.getBoundingClientRect(),
          overlayHost,
          document.defaultView,
        );
        setSelectedBlock((prev) => {
          if (
            !prev ||
            prev.top !== next.top ||
            prev.left !== next.left ||
            prev.width !== next.width ||
            prev.height !== next.height
          ) {
            return next;
          }
          return prev;
        });
      }
    }
  }, [
    document.defaultView,
    overlayHost,
    hoveredId,
    selectedId,
    setHoveredBlock,
    setSelectedBlock,
  ]);

  // Init single ResizeObserver
  useEffect(() => {
    resizeObserver.current = new ResizeObserver(() => updateActiveBlocks());
    return () => {
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;
    };
  }, []);

  // ---------------------------
  // Register/unregister blocks
  // ---------------------------
  const register = useCallback(
    (
      id: string,
      el: Element,
      handleRef: RefCallback<Element>,
      onResize?: (width: number, height: number) => void,
    ) => {
      elements.current.set(id, el);
      meta.current.set(id, { onResize, handleRef });
      resizeObserver.current?.observe(el);
      updateActiveBlocks();
    },
    [document],
  );

  const unregister = useCallback(
    (id: string) => {
      const el = elements.current.get(id);
      if (el) resizeObserver.current?.unobserve(el);
      elements.current.delete(id);
      meta.current.delete(id);

      if (hoveredId === id) setHoveredBlock(null);
      if (selectedId === id) setSelectedBlock(null);
    },
    [setHoveredBlock, setSelectedBlock],
  );

  useEffect(() => {
    updateActiveBlocks();
  }, [hoveredId, selectedId, updateActiveBlocks]);

  // Keep geometry in sync while scrolling. Prefer rAF (not setInterval — timers
  // are throttled during scroll) and let OverlayLayer write positions to the DOM
  // directly for frame-accurate tracking.
  useEffect(() => {
    const view = document.defaultView;
    if (!view) return;

    const onScroll = () => updateActiveBlocks();
    view.addEventListener("scroll", onScroll, { capture: true, passive: true });

    return () => {
      view.removeEventListener("scroll", onScroll, true);
    };
  }, [updateActiveBlocks, document]);

  const context = useMemo(
    () => ({
      hoveredId,
      selectedId,
      hoveredBlock,
      selectedBlock,
      updateActiveBlocks,
      selectedBlockMeta: selectedId
        ? (meta.current.get(selectedId) ?? null)
        : null,
      selectedBlockElement: selectedId
        ? (elements.current.get(selectedId) ?? null)
        : null,
      hoveredBlockElement: hoveredId
        ? (elements.current.get(hoveredId) ?? null)
        : null,
    }),
    [hoveredId, selectedId, hoveredBlock, selectedBlock, updateActiveBlocks],
  );

  const blockContext = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  );

  return (
    <OverlayContext.Provider value={context}>
      <OverlayBlockContext.Provider value={blockContext}>
        {children}
        {!isDragging && <OverlayLayer />}
      </OverlayBlockContext.Provider>
    </OverlayContext.Provider>
  );
}

// ---------------------------
// Hook for Blocks
// ---------------------------
export function useBlockEditor(
  id: string,
  onResize?: (width: number, height: number) => void,
) {
  const ctx = useContext(OverlayBlockContext);
  const register = ctx?.register;
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const setSelectedId = useSetSelectedBlockId();
  const isSelected = useIsSelectedBlock(id);
  const isOverlay = useIsCurrentBlockOverlay();

  const blockDefinition = useBlockDefinition(id);
  const blockType = blockDefinition?.type;

  const { parentBlockId, parentProperty, index, depth } =
    useBlockParentData(id)!;

  const disable = useBlockDisableOptions(id);
  const allowOnly = useAllowedRule(parentBlockId, parentProperty);
  const ownChildrenAllow = useAllowedRule(id, parentProperty);
  const childrenBlockIds = useBlockChildrenIds(id);
  const hasChildBlocks = useMemo(
    () =>
      Object.values(childrenBlockIds ?? {}).some(
        (childIds) => childIds.length > 0,
      ),
    [childrenBlockIds],
  );
  const parentBlockDefinition = useBlockDefinition(parentBlockId);
  const blocks = useBlocks();
  const blocksDefinitions = useBlocksDefinitions();
  const isActiveDragBlock = useIsActiveDragBlock(id);

  const sortableCollisionPriority = useFluidDropCollisionPriority(
    depth,
    "nested",
    parentBlockDefinition?.type === FLUID_LAYOUT_BLOCK_TYPE
      ? id
      : parentBlockId!,
  );

  const { handleRef } = useSortable({
    id: isOverlay ? `${id}-overlay` : id,
    index,
    group: `${parentBlockId}/${parentProperty}`,
    collisionPriority: sortableCollisionPriority,
    feedback: "default",
    element: ref,
    accept: (draggable) => {
      if (!draggable.type || isOverlay) return false;
      const type = draggable.type as string;
      const dragBlockDefinition = blocksDefinitions.find(
        (b) => b.type === type,
      );

      if (allowOnly === "impossible") return false;
      if (
        allowOnly &&
        blockDefinition &&
        !matchesRule(blockDefinition, allowOnly)
      )
        return false;

      const allowedParents = blocks[type]?.allowedIn;
      if (
        allowedParents &&
        parentBlockDefinition &&
        !matchesRule(parentBlockDefinition, allowedParents)
      )
        return false;

      // Direct fluid children (e.g. button) expose the fluid parent in DnD context.
      // Reject nestable drags on the shell so inner targets handle insertion.
      if (
        parentBlockDefinition?.type === FLUID_LAYOUT_BLOCK_TYPE &&
        hasChildBlocks &&
        ownChildrenAllow &&
        ownChildrenAllow !== "impossible" &&
        dragBlockDefinition &&
        matchesRule(dragBlockDefinition, ownChildrenAllow)
      ) {
        return false;
      }

      return true;
    },
    type: blockType ?? "",
    // transition: {
    //   duration: 200,
    //   easing: "cubic-bezier(0.2, 0, 0, 1)",
    // },
    // transition: null,
    disabled: isOverlay || !!disable?.drag,
    // collisionDetector: closestCenter,
    // collisionDetector: directionBiased,
    collisionDetector: createDynamicCollisionDetector("dynamic"),
    data: {
      context: {
        parentBlockId: parentBlockId!,
        parentProperty: parentProperty!,
        index,
        type: blockType ?? "",
      } satisfies DndContext,
    },
  });

  useEffect(() => {
    if (!register || !ref) return;
    ref.dataset.blockId = id; // needed for global hover detection
    ref.dataset.blockType = blockType ?? "";
    ref.dataset.blockParentId = parentBlockId ?? "";
    ref.dataset.blockParentProperty = parentProperty ?? "";
    ref.dataset.blockIndex = index.toString();
    ref.dataset.blockDepth = depth.toString();
    ref.dataset.blockIsOverlay = isOverlay.toString();

    const cleanup = register(
      id,
      ref,
      handleRef,
      disable?.resize ? undefined : onResize,
    );
    return cleanup;
  }, [
    id,
    blockType,
    onResize,
    register,
    ref,
    isSelected,
    handleRef,
    parentBlockId,
    parentProperty,
    index,
    blockType,
    isActiveDragBlock,
    disable?.resize,
  ]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      setSelectedId(id);
      e.stopPropagation();
    },
    [id, setSelectedId],
  );

  const setRefCallback = useCallback(
    (el: HTMLElement | null) => {
      setRef(el);
    },
    [setRef],
  );

  const result = useMemo(
    () => ({
      ref: setRefCallback,
      onClick,
    }),
    [ref, onClick],
  );

  return result;
}

const OverlayLayer = () => {
  const ctx = useContext(OverlayContext)!;
  const { document, overlayHost } = usePortalContext();

  const [isResizing, setIsResizing] = useState(false);
  const selectedBoxRef = useRef<HTMLDivElement>(null);
  const hoveredBoxRef = useRef<HTMLDivElement>(null);

  const disableAnimation = useDisableAnimation();
  const rootBlockId = useRootBlockId();
  const setDisableAnimation = useSetDisableAnimation();

  const {
    hoveredId,
    selectedId,
    hoveredBlock,
    selectedBlock,
    selectedBlockMeta,
    selectedBlockElement,
    hoveredBlockElement,
  } = ctx;
  const disable = useBlockDisableOptions(selectedId);

  // Frame-synced DOM writes so overlays track iframe scroll without React lag.
  useEffect(() => {
    if (!selectedBlockElement && !hoveredBlockElement) return;

    let raf = 0;
    const tick = () => {
      if (selectedBlockElement && selectedBoxRef.current) {
        applyOverlayGeometry(
          selectedBoxRef.current,
          toOverlayGeometry(
            selectedBlockElement.getBoundingClientRect(),
            overlayHost,
            document.defaultView,
          ),
        );
      }
      if (
        hoveredBlockElement &&
        hoveredBoxRef.current &&
        selectedId !== hoveredId
      ) {
        applyOverlayGeometry(
          hoveredBoxRef.current,
          toOverlayGeometry(
            hoveredBlockElement.getBoundingClientRect(),
            overlayHost,
            document.defaultView,
          ),
        );
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    selectedBlockElement,
    hoveredBlockElement,
    selectedId,
    hoveredId,
    overlayHost,
    document.defaultView,
  ]);

  // Resize handler
  const startResize = useCallback(
    (e: React.MouseEvent, dir: ResizeDirection) => {
      e.preventDefault();
      e.stopPropagation();

      if (!selectedBlock || !selectedBlockMeta?.onResize) return;

      const originalDisableAnimation = disableAnimation;
      setIsResizing(true);
      setDisableAnimation(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = selectedBlock.width;
      const startH = selectedBlock.height;

      const originalCursor = document.body.style.cursor;
      document.body.style.cursor = CURSORS[dir];

      const onMove = (ev: MouseEvent) => {
        let newW = startW;
        let newH = startH;
        if (dir.includes("e")) {
          newW = Math.max(50, startW + (ev.clientX - startX));
        }
        if (dir.includes("s")) {
          newH = Math.max(30, startH + (ev.clientY - startY));
        }
        if (dir.includes("w")) {
          newW = Math.max(50, startW - (ev.clientX - startX));
        }
        if (dir.includes("n")) {
          newH = Math.max(30, startH - (ev.clientY - startY));
        }

        selectedBlockMeta.onResize?.(newW, newH);
        ctx.updateActiveBlocks();
      };

      const cleanup = () => {
        document.defaultView?.removeEventListener("mousemove", onMove);
        document.defaultView?.removeEventListener("mouseup", onUp);
        document.defaultView?.removeEventListener("keydown", onKeyDown);
        setDisableAnimation(originalDisableAnimation);
        setIsResizing(false);
        document.body.style.cursor = originalCursor;
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          cleanup();
          selectedBlockMeta.onResize?.(startW, startH);
        }
      };

      const onUp = () => {
        cleanup();
      };

      document.defaultView?.addEventListener("mousemove", onMove);
      document.defaultView?.addEventListener("mouseup", onUp);
      document.defaultView?.addEventListener("keydown", onKeyDown);
    },
    [
      selectedBlock,
      selectedBlockMeta,
      document,
      disableAnimation,
      setDisableAnimation,
      selectedBlockElement,
      ctx,
    ],
  );

  return createPortal(
    <div className="absolute inset-0 pointer-events-none z-[25] overflow-visible">
      {hoveredBlock && selectedId !== hoveredId && !isResizing && (
        <div
          ref={hoveredBoxRef}
          className="absolute border border-blue-300"
          style={{
            top: hoveredBlock.top,
            left: hoveredBlock.left,
            width: hoveredBlock.width,
            height: hoveredBlock.height,
          }}
        />
      )}

      {selectedBlock &&
        selectedId &&
        rootBlockId !== selectedId &&
        selectedBlockMeta &&
        !disable?.overlay && (
          <SelectedBlockOverlay
            ref={selectedBoxRef}
            top={selectedBlock.top}
            left={selectedBlock.left}
            width={selectedBlock.width}
            height={selectedBlock.height}
            id={selectedId}
            handleRef={selectedBlockMeta.handleRef}
            onResize={selectedBlockMeta.onResize}
            startResize={startResize}
          />
        )}
    </div>,
    overlayHost ?? document.body,
  );
};
