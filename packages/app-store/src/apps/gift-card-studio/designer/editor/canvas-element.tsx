"use client";

import { useI18n } from "@hacado/i18n/client";
import { cn, Icon, IconName, useCurrencyFormat } from "@hacado/ui";
import { Lock } from "lucide-react";
import { DateTime } from "luxon";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { useEditorStore } from "../lib/store";
import {
  DEFAULT_EXPIRES_AT_DATE_FORMAT,
  DYNAMIC_FIELDS,
  FieldKey,
  type Element,
  type IconElement,
  type ImageElement,
  type Paint,
  type ShapeElement,
  type TextElement,
} from "../lib/types";
import {
  calculateSnappedPosition,
  snapRotationToCardinals,
} from "./alignment-guides";
import { EditorContextMenu } from "./context-menu";

interface CanvasElementProps {
  element: Element;
  zoom: number;
  mode: "edit" | "preview";
  isInGroup?: boolean;
  groupOffset?: { x: number; y: number };
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showSelection?: boolean;
  allowGrouping?: boolean;
  marqueeHover?: boolean;
}

export function CanvasElement({
  element,
  zoom,
  mode,
  isInGroup = false,
  groupOffset = { x: 0, y: 0 },
  onDragStart,
  onDragEnd,
  showSelection = false,
  allowGrouping = true,
  marqueeHover = false,
}: CanvasElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fontSize: 0,
  });
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStart, setRotateStart] = useState({
    angle: 0,
    centerX: 0,
    centerY: 0,
  });
  const [isEditingText, setIsEditingText] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const dragMoveLastRef = useRef({ x: 0, y: 0 });
  const gesturePointerIdRef = useRef<number | null>(null);

  const { selectedElements, selectElement, updateElement, design } =
    useEditorStore();
  const isSelected = showSelection || selectedElements.includes(element.id);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === "preview" || element.locked) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();

    // Check if clicked element is already in selection
    const isAlreadySelected = selectedElements.includes(element.id);

    // If shift key is held, toggle selection
    if (e.shiftKey) {
      selectElement(element.id, true);
    }
    // If element is not in current selection, select it (and deselect others)
    else if (!isAlreadySelected) {
      selectElement(element.id);
    }
    // If element is in selection but not dragging, keep selection

    if (!isEditingText) {
      gesturePointerIdRef.current = e.pointerId;
      setIsDragging(true);
      onDragStart?.();
      dragMoveLastRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (mode === "preview" || element.locked) return;
    if (element.type === "text") {
      e.stopPropagation();
      setIsEditingText(true);
    }
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    if (mode === "preview" || element.locked) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
    gesturePointerIdRef.current = e.pointerId;
    setIsResizing(true);

    const textElement =
      element.type === "text" ? (element as TextElement) : null;
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
      fontSize: textElement?.styles.fontSize || 16,
    });
  };

  const handleRotatePointerDown = (e: React.PointerEvent) => {
    if (mode === "preview" || element.locked) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
    gesturePointerIdRef.current = e.pointerId;
    setIsRotating(true);

    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle =
        Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

      setRotateStart({
        angle: angle - element.rotation,
        centerX,
        centerY,
      });
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging) {
      e.preventDefault();
      const z = useEditorStore.getState().zoom;
      const deltaX = (e.clientX - dragMoveLastRef.current.x) / z;
      const deltaY = (e.clientY - dragMoveLastRef.current.y) / z;
      dragMoveLastRef.current = { x: e.clientX, y: e.clientY };

      if (selectedElements.length > 0) {
        selectedElements.forEach((id) => {
          const { design: liveDesign } = useEditorStore.getState();
          const el = liveDesign.elements.find((el) => el.id === id);
          if (el && !el.locked) {
            const newPos = {
              x: el.position.x + deltaX,
              y: el.position.y + deltaY,
            };
            const snappedPos = calculateSnappedPosition(
              { ...el, position: newPos },
              liveDesign.elements,
              liveDesign.canvas.width,
              liveDesign.canvas.height,
              isAltPressed,
            );
            updateElement(id, { position: snappedPos });
          }
        });
      }
    } else if (isResizing) {
      e.preventDefault();
      const deltaX = (e.clientX - resizeStart.x) / zoom;
      const deltaY = (e.clientY - resizeStart.y) / zoom;

      const shapeElement =
        element.type === "shape" ? (element as ShapeElement) : null;
      const textElement =
        element.type === "text" ? (element as TextElement) : null;

      if (shapeElement?.shapeType === "line") {
        const strokeWidth = shapeElement.styles.strokeWidth || 2;
        updateElement(element.id, {
          size: {
            width: Math.max(20, resizeStart.width + deltaX),
            height: strokeWidth,
          },
        });
      } else if (selectedElements.length > 1) {
        // For multi-select: compute scale factors from the handle element and
        // apply them proportionally to every selected element's own size.
        const scaleX =
          Math.max(20, resizeStart.width + deltaX) / resizeStart.width;
        const scaleY =
          Math.max(20, resizeStart.height + deltaY) / resizeStart.height;

        selectedElements.forEach((id) => {
          const el = design.elements.find((e) => e.id === id);
          if (!el || el.locked) return;
          const updates: any = {
            size: {
              width: Math.max(20, el.size.width * scaleX),
              height: Math.max(20, el.size.height * scaleY),
            },
          };
          if (el.type === "text") {
            const te = el as TextElement;
            if (!te.styles.fontSizeLocked) {
              const scale = Math.min(scaleX, scaleY);
              updates.styles = {
                ...te.styles,
                fontSize: Math.max(
                  8,
                  Math.round((te.styles.fontSize || 16) * scale),
                ),
              };
            }
          }
          updateElement(id, updates);
        });
      } else {
        const newWidth = Math.max(20, resizeStart.width + deltaX);
        const newHeight = Math.max(20, resizeStart.height + deltaY);

        const updates: any = {
          size: { width: newWidth, height: newHeight },
        };

        if (textElement && !textElement.styles.fontSizeLocked) {
          const scale = Math.min(
            newWidth / resizeStart.width,
            newHeight / resizeStart.height,
          );
          updates.styles = {
            ...textElement.styles,
            fontSize: Math.max(8, Math.round(resizeStart.fontSize * scale)),
          };
        }

        updateElement(element.id, updates);
      }
    } else if (isRotating) {
      const angle =
        Math.atan2(
          e.clientY - rotateStart.centerY,
          e.clientX - rotateStart.centerX,
        ) *
        (180 / Math.PI);
      const rawRotation = angle - rotateStart.angle;
      const newRotation = snapRotationToCardinals(rawRotation, e.altKey);

      if (selectedElements.length > 1) {
        selectedElements.forEach((id) => {
          const el = design.elements.find((el) => el.id === id);
          if (el && !el.locked) {
            updateElement(id, {
              rotation: newRotation,
            });
          }
        });
      } else {
        updateElement(element.id, {
          rotation: newRotation,
        });
      }
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (gesturePointerIdRef.current !== e.pointerId) return;
    gesturePointerIdRef.current = null;

    if (isDragging || isResizing || isRotating) {
      useEditorStore.getState().pushHistory();
    }
    if (isDragging) {
      onDragEnd?.();
    }
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  };

  const renderHandles = () => (
    <>
      <div
        className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-white z-10 touch-none"
        onPointerDown={handleResizePointerDown}
      />

      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-grab border-2 border-white z-10 touch-none"
        onPointerDown={handleRotatePointerDown}
      />
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-blue-500"
        style={{ pointerEvents: "none" }}
      />
    </>
  );

  const renderElement = () => {
    if (!element.visible && mode === "edit") {
      return null;
    }

    switch (element.type) {
      case "text":
        return (
          <TextElementRenderer
            element={element as TextElement}
            mode={mode}
            isEditing={isEditingText}
            onFinishEditing={() => setIsEditingText(false)}
            zoom={zoom}
          />
        );
      case "image":
        return <ImageElementRenderer element={element as ImageElement} />;
      case "icon":
        return (
          <IconElementRenderer element={element as IconElement} zoom={zoom} />
        );
      case "shape":
        return <ShapeElementRenderer element={element as ShapeElement} />;
      default:
        return null;
    }
  };

  const textElement = element.type === "text" ? (element as TextElement) : null;
  const isRequired = textElement?.required;

  const absoluteX = groupOffset.x + element.position.x;
  const absoluteY = groupOffset.y + element.position.y;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setIsAltPressed(true);
      }
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
  }, []);

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [isDragging, isResizing, isRotating, isAltPressed]);

  return (
    <EditorContextMenu elementId={element.id} allowGrouping={allowGrouping}>
      <div
        ref={elementRef}
        className={cn(
          "absolute select-none",
          !isEditingText && !isInGroup && "cursor-move",
          // !isEditingText  && "cursor-move",
          isSelected && mode === "edit" && "ring-2 ring-primary",
          marqueeHover &&
            mode === "edit" &&
            !isSelected &&
            "ring-2 ring-primary/50",
          element.locked && "cursor-not-allowed",
        )}
        style={{
          left: (isInGroup ? element.position.x : absoluteX) * zoom,
          top: (isInGroup ? element.position.y : absoluteY) * zoom,
          // left: absoluteX * zoom,
          // top: absoluteY * zoom,
          width: element.size.width * zoom,
          height: element.size.height * zoom,
          transform: `rotate(${element.rotation}deg)`,
          opacity: element.opacity,
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: mode === "edit" && !isEditingText ? "none" : undefined,
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
      >
        {renderElement()}

        {isSelected &&
          mode === "edit" &&
          !element.locked &&
          !isInGroup &&
          renderHandles()}

        {isRequired && mode === "edit" && (
          <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
            <Lock className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </EditorContextMenu>
  );
}

function TextElementRenderer({
  element,
  mode,
  isEditing,
  onFinishEditing,
  zoom,
}: {
  element: TextElement;
  mode: "edit" | "preview";
  isEditing: boolean;
  onFinishEditing: () => void;
  zoom: number;
}) {
  const { updateElement } = useEditorStore();
  const currencyFormat = useCurrencyFormat();
  const [editValue, setEditValue] = useState(element.content);
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  useEffect(() => {
    setEditValue(element.content);
  }, [element.content]);

  const handleBlur = () => {
    updateElement(element.id, { content: editValue });
    useEditorStore.getState().pushHistory();
    onFinishEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Always stop propagation so editor-level shortcuts (Delete, arrows, etc.)
    // do not fire while the user is editing text content.
    e.stopPropagation();

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(element.content);
      onFinishEditing();
    }
  };

  const displayContent =
    mode === "preview" && DYNAMIC_FIELDS.includes(element.fieldKey as FieldKey)
      ? element.fieldKey === "expiresAt"
        ? DateTime.now().toFormat(
            element.dateFormat ?? DEFAULT_EXPIRES_AT_DATE_FORMAT,
          )
        : element.fieldKey === "amount"
          ? currencyFormat(100)
          : t.has(
                `designer.sampleValues.${element.fieldKey}` as GiftCardStudioAdminKeys,
              )
            ? t(
                `designer.sampleValues.${element.fieldKey}` as GiftCardStudioAdminKeys,
              )
            : element.fieldKey
      : element.fieldKey
        ? `[${element.fieldKey.toUpperCase()}]`
        : element.content;

  const textAligns = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  const textAlign = textAligns[element.styles.textAlign ?? "left"] ?? "left";

  if (isEditing && !element.fieldKey) {
    return (
      <textarea
        // contentEditable
        // value={editValue}
        // dangerouslySetInnerHTML={{ __html: editValue }}
        onChange={(e) => setEditValue(e.target.value)}
        // onInput={(e) => setEditValue(e.target.textContent)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full h-full flex px-2 py-1 outline-none bg-transparent resize-none"
        style={{
          fontFamily: element.styles.fontFamily || "inherit",
          fontSize: (element.styles.fontSize || 16) * zoom,
          fontWeight: element.styles.fontWeight || 400,
          lineHeight: (element.styles.lineHeight || 1.5) * zoom,
          color: element.styles.color || "#000000",
          // justifyContent: textAlign
          textAlign: element.styles.textAlign ?? "left",
        }}
      />
    );
  }

  return (
    <div
      className="w-full h-full flex items-center px-2 whitespace-pre-wrap"
      style={{
        fontFamily: element.styles.fontFamily || "inherit",
        fontSize: (element.styles.fontSize || 16) * zoom,
        fontWeight: element.styles.fontWeight || 400,
        lineHeight: (element.styles.lineHeight || 1.5) * zoom,
        color: element.styles.color || "#000000",
        backgroundColor: element.styles.backgroundColor || "transparent",
        justifyContent: textAlign,
      }}
    >
      {displayContent}
    </div>
  );
}

function ImageElementRenderer({ element }: { element: ImageElement }) {
  return (
    <img
      src={element.src || "/placeholder.svg"}
      alt=""
      className="w-full h-full pointer-events-none"
      style={{
        objectFit: element.styles.objectFit || "contain",
      }}
    />
  );
}

function IconElementRenderer({
  element,
  zoom,
}: {
  element: IconElement;
  zoom: number;
}) {
  const color = element.styles?.color ?? "#000000";
  const strokeWU = element.styles?.strokeWidth ?? 1;
  const w = element.size.width * zoom;
  const h = element.size.height * zoom;
  const size = Math.min(w, h);
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden">
      <Icon
        name={element.icon as IconName}
        width={size}
        height={size}
        color={color}
        strokeWidth={strokeWU * (size / 24)}
      />
    </div>
  );
}

function resolvePaintCss(paint: Paint | undefined, fallback: string): string {
  if (!paint || paint.type === "none") return "transparent";
  if (paint.type === "color") return paint.color || fallback;
  if (paint.type === "gradient" && paint.gradient) {
    const { type, colors, angle } = paint.gradient;
    return type === "linear"
      ? `linear-gradient(${angle ?? 0}deg, ${colors.join(", ")})`
      : `radial-gradient(circle, ${colors.join(", ")})`;
  }
  if (paint.type === "image" && paint.image?.src) {
    return `url(${paint.image.src})`;
  }
  return fallback;
}

function ShapeElementRenderer({ element }: { element: ShapeElement }) {
  const { shapeType, styles } = element;

  // Resolve fill - prefer new Paint fields, fall back to legacy strings
  const fillPaint =
    styles.fillPaint ??
    (styles.fill ? { type: "color" as const, color: styles.fill } : undefined);
  const strokePaint =
    styles.strokePaint ??
    (styles.stroke
      ? { type: "color" as const, color: styles.stroke }
      : undefined);

  const fillCss = resolvePaintCss(fillPaint, "transparent");
  const isGradientOrImage =
    fillPaint?.type === "gradient" || fillPaint?.type === "image";

  const strokeColor =
    strokePaint?.type === "color"
      ? strokePaint.color
      : styles.stroke || undefined;
  const strokeWidth = styles.strokeWidth || 1;

  if (shapeType === "line") {
    const linePaint = fillPaint ?? strokePaint;
    const lineCss = resolvePaintCss(linePaint, "#000000");
    return (
      <div
        style={{
          width: "100%",
          height: strokeWidth || 2,
          background: lineCss,
        }}
      />
    );
  }

  const shapeStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    border: strokeColor ? `${strokeWidth}px solid ${strokeColor}` : "none",
    borderRadius: shapeType === "circle" ? "50%" : styles.borderRadius || 0,
    ...(isGradientOrImage
      ? {
          background: fillCss,
          backgroundSize: fillPaint?.image?.fit || "cover",
        }
      : { backgroundColor: fillCss }),
  };

  return <div style={shapeStyle} />;
}
