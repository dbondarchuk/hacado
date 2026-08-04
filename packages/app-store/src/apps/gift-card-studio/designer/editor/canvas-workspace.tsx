"use client";

import type React from "react";

import { useI18n } from "@timelish/i18n/client";
import type { UploadedFile } from "@timelish/types";
import { cn, toast, useIsMac, useUploadFile } from "@timelish/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { GIFT_CARD_DESIGNER_CLIPBOARD_PREFIX } from "../lib/clipboard";
import { isEditableClipboardTarget, isTypingInInput } from "../lib/keyboard";
import { elementSchema } from "../lib/schema";
import { useEditorStore } from "../lib/store";
import type { Element, GroupElement, ImageElement } from "../lib/types";
import { AlignmentGuides } from "./alignment-guides";
import { CanvasElement } from "./canvas-element";
import { EditorContextMenu } from "./context-menu";
import { GroupElementRenderer } from "./group-element";

interface CanvasWorkspaceProps {
  allowGrouping?: boolean;
}

function getIdsTouchingMarquee(
  elements: Element[],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): string[] {
  const groups = elements.filter((e) => e.type === "group") as GroupElement[];

  return elements
    .filter((el) => {
      if (el.type === "group") {
        const elMinX = el.position.x;
        const elMinY = el.position.y;
        const elMaxX = el.position.x + el.size.width;
        const elMaxY = el.position.y + el.size.height;
        return !(
          elMaxX < minX ||
          elMinX > maxX ||
          elMaxY < minY ||
          elMinY > maxY
        );
      }

      const parentGroup = groups.find((g) => g.children?.includes(el.id));
      if (parentGroup) return false;

      const elMinX = el.position.x;
      const elMinY = el.position.y;
      const elMaxX = el.position.x + el.size.width;
      const elMaxY = el.position.y + el.size.height;
      return !(
        elMaxX < minX ||
        elMinX > maxX ||
        elMaxY < minY ||
        elMinY > maxY
      );
    })
    .map((el) => el.id);
}

export function CanvasWorkspace({
  allowGrouping = true,
}: CanvasWorkspaceProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const preventUnselectionRef = useRef(false);
  const {
    design,
    zoom,
    pan,
    mode,
    clearSelection,
    setPan,
    selectedElements,
    disabled,
  } = useEditorStore();
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const tAdmin = useI18n("admin");

  const [isPanning, setIsPanning] = useState(false);
  const panSessionRef = useRef({
    originClient: { x: 0, y: 0 },
    originPan: { x: 0, y: 0 },
  });
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });
  const [marqueeHoverIds, setMarqueeHoverIds] = useState<string[]>([]);

  const canvasBgPointersRef = useRef(
    new Map<number, { clientX: number; clientY: number }>(),
  );
  const pinchLastRef = useRef<{
    dist: number;
    mid: { x: number; y: number };
  } | null>(null);
  const panPointerIdRef = useRef<number | null>(null);
  const marqueeSessionRef = useRef(false);
  const marqueeBoundsRef = useRef({
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
  });
  const isPanningRef = useRef(false);
  const isMarqueeSelectingRef = useRef(false);

  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);
  useEffect(() => {
    isMarqueeSelectingRef.current = isMarqueeSelecting;
  }, [isMarqueeSelecting]);
  useEffect(() => {
    marqueeBoundsRef.current = { start: marqueeStart, end: marqueeEnd };
  }, [marqueeStart, marqueeEnd]);

  const isMac = useIsMac();
  const ctrl = isMac ? "⌘" : "Ctrl";

  const canvasTheme = design.canvas.theme || "light";

  const activeElements = design.elements.filter((el) =>
    selectedElements.includes(el.id),
  );

  const { uploadFile, isUploading: isUploadingImage } = useUploadFile({
    onFileUploaded: useCallback((file: UploadedFile) => {
      const store = useEditorStore.getState();
      const { canvas } = store.design;
      const defaultSize = 200;
      const element: ImageElement = {
        id: `element-${Date.now()}`,
        type: "image",
        src: file.url,
        position: {
          x: Math.max(0, (canvas.width - defaultSize) / 2),
          y: Math.max(0, (canvas.height - defaultSize) / 2),
        },
        size: { width: defaultSize, height: defaultSize },
        rotation: 0,
        opacity: 1,
        visible: true,
        styles: { objectFit: "contain" },
      };
      store.addElement(element);
      store.selectMultiple([element.id]);
    }, []),
    onUploadError: (_, error, errorCode) => {
      if (errorCode === "asset_total_size_limit_reached") {
        toast.error(tAdmin("assets.toasts.assetTotalSizeLimitReached"));
      }
    },
  });

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (isEditableClipboardTarget(e.target)) return;
      const state = useEditorStore.getState();
      if (state.disabled || state.mode === "preview") return;
      if (state.selectedElements.length === 0) return;

      const elements = state.design.elements.filter((el) =>
        state.selectedElements.includes(el.id),
      );
      if (elements.length === 0) return;

      e.clipboardData?.setData(
        "text/plain",
        GIFT_CARD_DESIGNER_CLIPBOARD_PREFIX + JSON.stringify(elements),
      );
      e.preventDefault();
      state.copySelectedElements();
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isEditableClipboardTarget(e.target)) return;
      const state = useEditorStore.getState();
      if (state.disabled || state.mode === "preview") return;

      const items = e.clipboardData?.items;
      const imageItems = Array.from(items || []).filter((item) =>
        item.type.startsWith("image/"),
      );

      if (imageItems.length > 0) {
        if (isUploadingImage) return;
        const imageFile = imageItems[0]!.getAsFile();
        if (imageFile && imageFile.size > 0) {
          e.preventDefault();
          e.stopPropagation();
          const promise = uploadFile([{ file: imageFile }]);
          toast.promise(promise, {
            loading: t("designer.pasteImage.uploading"),
            success: t("designer.pasteImage.success"),
            error: t("designer.pasteImage.error"),
          });
        }
        return;
      }

      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (text.startsWith(GIFT_CARD_DESIGNER_CLIPBOARD_PREFIX)) {
        e.preventDefault();
        e.stopPropagation();
        try {
          const raw = JSON.parse(
            text.slice(GIFT_CARD_DESIGNER_CLIPBOARD_PREFIX.length),
          );
          if (!Array.isArray(raw)) return;
          const parsed: Element[] = [];
          for (const item of raw) {
            const r = elementSchema.safeParse(item);
            if (r.success) parsed.push(r.data);
          }
          if (parsed.length === 0) return;
          useEditorStore.setState({ clipboardMultiple: parsed });
          useEditorStore.getState().pasteElements();
        } catch {
          /* invalid clipboard */
        }
        return;
      }

      if (state.clipboardMultiple.length > 0 || state.clipboard !== null) {
        e.preventDefault();
        e.stopPropagation();
        if (state.clipboardMultiple.length > 0) {
          state.pasteElements();
        } else {
          state.pasteElement();
        }
      }
    };

    window.addEventListener("copy", handleCopy);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("paste", handlePaste);
    };
  }, [isUploadingImage, uploadFile, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setIsAltPressed(true);
      }

      // Ignore all editor shortcuts when the user is typing in any input,
      // textarea, select, or contenteditable element (including properties panel
      // inputs and in-canvas text editing).
      if (isTypingInInput(e)) return;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setIsAltPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedElements]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (preventUnselectionRef.current) {
        preventUnselectionRef.current = false;
      } else {
        clearSelection();
      }
    }
  };

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (disabled || mode === "preview") return;
    if (e.pointerType !== "mouse") return;
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      panSessionRef.current = {
        originClient: { x: e.clientX, y: e.clientY },
        originPan: { x: pan.x, y: pan.y },
      };
      setIsPanning(true);
      panPointerIdRef.current = e.pointerId;
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (disabled || mode === "preview") return;
    if (e.target !== e.currentTarget) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { zoom: z } = useEditorStore.getState();
    const map = canvasBgPointersRef.current;
    map.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    if (map.size === 1) {
      marqueeSessionRef.current = true;
      pinchLastRef.current = null;
      setIsMarqueeSelecting(true);
      const x = (e.clientX - rect.left) / z;
      const y = (e.clientY - rect.top) / z;
      setMarqueeStart({ x, y });
      setMarqueeEnd({ x, y });
      marqueeBoundsRef.current = { start: { x, y }, end: { x, y } };
    } else if (map.size === 2) {
      marqueeSessionRef.current = false;
      setIsMarqueeSelecting(false);
      setMarqueeHoverIds([]);
      const pts = [...map.values()];
      const d = Math.hypot(
        pts[0].clientX - pts[1].clientX,
        pts[0].clientY - pts[1].clientY,
      );
      const mid = {
        x: (pts[0].clientX + pts[1].clientX) / 2,
        y: (pts[0].clientY + pts[1].clientY) / 2,
      };
      pinchLastRef.current = d > 0 ? { dist: d, mid } : { dist: 1, mid };
    }
  };

  useEffect(() => {
    if (disabled || mode === "preview") return;

    const onGlobalPointerMove = (e: PointerEvent) => {
      const map = canvasBgPointersRef.current;
      if (map.has(e.pointerId)) {
        map.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      }

      const store = useEditorStore.getState();
      const z = store.zoom;

      if (map.size >= 2 && pinchLastRef.current) {
        const pts = [...map.values()];
        if (pts.length < 2) return;
        const d = Math.hypot(
          pts[0].clientX - pts[1].clientX,
          pts[0].clientY - pts[1].clientY,
        );
        const mid = {
          x: (pts[0].clientX + pts[1].clientX) / 2,
          y: (pts[0].clientY + pts[1].clientY) / 2,
        };
        const prev = pinchLastRef.current;
        if (d > 0 && prev.dist > 0 && Number.isFinite(d / prev.dist)) {
          store.setZoom(store.zoom * (d / prev.dist));
        }
        const dmidx = mid.x - prev.mid.x;
        const dmidy = mid.y - prev.mid.y;
        store.setPan({ x: store.pan.x + dmidx, y: store.pan.y + dmidy });
        pinchLastRef.current = { dist: d > 0 ? d : prev.dist, mid };
        return;
      }

      if (
        isMarqueeSelectingRef.current &&
        map.size === 1 &&
        map.has(e.pointerId)
      ) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / z;
        const y = (e.clientY - rect.top) / z;
        setMarqueeEnd({ x, y });
        const s = marqueeBoundsRef.current.start;
        marqueeBoundsRef.current = { start: s, end: { x, y } };
        const minX = Math.min(s.x, x);
        const minY = Math.min(s.y, y);
        const maxX = Math.max(s.x, x);
        const maxY = Math.max(s.y, y);
        const hoverIds = getIdsTouchingMarquee(
          store.design.elements,
          minX,
          minY,
          maxX,
          maxY,
        );
        setMarqueeHoverIds(hoverIds);
        return;
      }

      if (isPanningRef.current && panPointerIdRef.current === e.pointerId) {
        const { originClient, originPan } = panSessionRef.current;
        store.setPan({
          x: originPan.x + (e.clientX - originClient.x),
          y: originPan.y + (e.clientY - originClient.y),
        });
      }
    };

    const onGlobalPointerUp = (e: PointerEvent) => {
      const map = canvasBgPointersRef.current;
      if (map.has(e.pointerId)) {
        map.delete(e.pointerId);
        const remaining = map.size;
        if (remaining < 2) {
          pinchLastRef.current = null;
        }
        if (remaining === 0) {
          if (marqueeSessionRef.current) {
            const { start, end } = marqueeBoundsRef.current;
            const minX = Math.min(start.x, end.x);
            const minY = Math.min(start.y, end.y);
            const maxX = Math.max(start.x, end.x);
            const maxY = Math.max(start.y, end.y);
            if (Math.abs(maxX - minX) > 1 || Math.abs(maxY - minY) > 1) {
              const { design: d } = useEditorStore.getState();
              const selectedIds = getIdsTouchingMarquee(
                d.elements,
                minX,
                minY,
                maxX,
                maxY,
              );
              useEditorStore.getState().selectMultiple(selectedIds);
              preventUnselectionRef.current = true;
            }
          }
          marqueeSessionRef.current = false;
          setIsMarqueeSelecting(false);
          setMarqueeHoverIds([]);
        }
      }
      if (panPointerIdRef.current === e.pointerId) {
        panPointerIdRef.current = null;
        setIsPanning(false);
      }
    };

    window.addEventListener("pointermove", onGlobalPointerMove);
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalPointerMove);
      window.removeEventListener("pointerup", onGlobalPointerUp);
      window.removeEventListener("pointercancel", onGlobalPointerUp);
    };
  }, [disabled, mode]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      useEditorStore.getState().setZoom(zoom + delta);
    }
  };

  const renderElements = () => {
    const renderedIds = new Set<string>();

    return design.elements.map((element) => {
      // Skip if already rendered as part of a group
      if (
        renderedIds.has(element.id) ||
        design.elements.some(
          (el) => el.type === "group" && el.children?.includes(element.id),
        )
      )
        return null;

      if (element.type === "group") {
        const groupElement = element as any;
        renderedIds.add(element.id);
        // Also mark children so they are not rendered standalone
        groupElement.children?.forEach((id: string) => renderedIds.add(id));

        return (
          <GroupElementRenderer
            key={element.id}
            element={element as GroupElement}
            zoom={zoom}
            mode={mode}
            marqueeHoverIds={marqueeHoverIds}
            allowGrouping={allowGrouping}
          />
        );
      }

      const isMarqueeHover = marqueeHoverIds.includes(element.id);

      return (
        <CanvasElement
          key={element.id}
          element={element}
          zoom={zoom}
          mode={mode}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          allowGrouping={allowGrouping}
          marqueeHover={isMarqueeHover}
        />
      );
    });
  };

  const getCanvasBackgroundStyle = () => {
    const bg = design.canvas.background;
    if (!bg) {
      return {
        backgroundColor: canvasTheme === "dark" ? "#1a1a1a" : "#ffffff",
      };
    }

    if (bg.type === "color") {
      return { backgroundColor: bg.color || "#ffffff" };
    }

    if (bg.type === "gradient" && bg.gradient) {
      const { type, colors, angle } = bg.gradient;
      if (type === "linear") {
        return {
          background: `linear-gradient(${angle || 0}deg, ${colors.join(", ")})`,
        };
      } else {
        return {
          background: `radial-gradient(circle, ${colors.join(", ")})`,
        };
      }
    }

    if (bg.type === "image" && bg.image) {
      return {
        backgroundImage: `url(${bg.image.src})`,
        backgroundSize: bg.image.fit || "cover",
        backgroundPosition: bg.image.position || "center",
        backgroundRepeat: "no-repeat",
      };
    }

    return { backgroundColor: canvasTheme === "dark" ? "#1a1a1a" : "#ffffff" };
  };

  const marqueeRect = isMarqueeSelecting
    ? {
        left: Math.min(marqueeStart.x, marqueeEnd.x) * zoom,
        top: Math.min(marqueeStart.y, marqueeEnd.y) * zoom,
        width: Math.abs(marqueeEnd.x - marqueeStart.x) * zoom,
        height: Math.abs(marqueeEnd.y - marqueeStart.y) * zoom,
      }
    : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 grid min-h-0 min-w-0 overflow-hidden relative bg-muted/30",
      )}
      id="gift-card-editor-canvas"
      onPointerDown={handleContainerPointerDown}
      onWheel={handleWheel}
    >
      <div className="h-full min-h-0 w-full overflow-auto overscroll-contain">
        <div className="flex min-h-full w-max min-w-full box-border justify-center items-center p-4 sm:p-8 lg:p-12">
          <EditorContextMenu allowGrouping={allowGrouping}>
            <div
              ref={canvasRef}
              className="relative shadow-2xl select-none"
              style={{
                ...getCanvasBackgroundStyle(),
                width: design.canvas.width * zoom,
                height: design.canvas.height * zoom,
                minWidth: design.canvas.width * zoom,
                minHeight: design.canvas.height * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: mode === "edit" ? "none" : undefined,
                overflow: mode === "preview" ? "hidden" : "visible",
              }}
              onClick={handleCanvasClick}
              onPointerDown={handleCanvasPointerDown}
            >
              {renderElements()}

              {/* Marquee Selection Box */}
              {marqueeRect && mode === "edit" && (
                <div
                  className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                  style={{
                    left: marqueeRect.left,
                    top: marqueeRect.top,
                    width: marqueeRect.width,
                    height: marqueeRect.height,
                  }}
                />
              )}

              {/* Alignment Guides */}
              {mode === "edit" && isDragging && activeElements.length > 0 && (
                <AlignmentGuides
                  activeElements={activeElements}
                  allElements={design.elements}
                  canvasWidth={design.canvas.width}
                  canvasHeight={design.canvas.height}
                  zoom={zoom}
                  isAltPressed={isAltPressed}
                />
              )}

              {/* Grid overlay in edit mode */}
              {mode === "edit" && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                    linear-gradient(to right, ${canvasTheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px),
                    linear-gradient(to bottom, ${canvasTheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px)
                  `,
                    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                  }}
                />
              )}
            </div>
          </EditorContextMenu>
        </div>
      </div>

      {mode === "edit" && (
        <div className="absolute max-lg:hidden bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
          {t("designer.shortcuts.label", {
            arrows: t("designer.shortcuts.arrows"),
            shiftArrows: t("designer.shortcuts.shiftArrows"),
            ctrlC: t("designer.shortcuts.ctrlC", { ctrl }),
            ctrlV: t("designer.shortcuts.ctrlV", { ctrl }),
            ctrlZ: t("designer.shortcuts.ctrlZ", { ctrl }),
            ctrlShiftZ: t("designer.shortcuts.ctrlShiftZ", { ctrl }),
            ctrlD: t("designer.shortcuts.ctrlD", { ctrl }),
            del: t("designer.shortcuts.del"),
          })}
        </div>
      )}
    </div>
  );
}
