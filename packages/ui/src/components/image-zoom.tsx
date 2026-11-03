"use client";

import { useI18n } from "@hacado/i18n/client";
import { Minus, Plus, RotateCcw } from "lucide-react";
import * as React from "react";

import { cn } from "../utils";
import { Button } from "./button";

type ImageZoomProps = {
  src: string;
  alt?: string;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  className?: string;
};

type Point = {
  x: number;
  y: number;
};

export const ImageZoom: React.FC<ImageZoomProps> = ({
  src,
  alt = "",
  initialZoom = 1,
  minZoom = 1,
  maxZoom = 4,
  zoomStep = 0.5,
  className,
}) => {
  const t = useI18n("ui");
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const [scale, setScale] = React.useState(initialZoom);
  const [position, setPosition] = React.useState<Point>({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = React.useState(false);

  /**
   * Active pointers.
   *
   * We use pointer events so mouse, touch and pen
   * all use the same implementation.
   */
  const pointers = React.useRef(new Map<number, Point>());

  const dragRef = React.useRef<{
    pointerId: number;
    start: Point;
    position: Point;
  } | null>(null);

  const pinchRef = React.useRef<{
    distance: number;
    scale: number;
    center: Point;
  } | null>(null);

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  /**
   * Calculate the maximum amount the image can be moved.
   *
   * The viewport itself NEVER moves.
   * Only the image inside it does.
   */
  const clampPosition = React.useCallback(
    (x: number, y: number, nextScale: number): Point => {
      const viewport = viewportRef.current;

      if (!viewport || nextScale <= 1) {
        return {
          x: 0,
          y: 0,
        };
      }

      const { width, height } = viewport.getBoundingClientRect();

      const maxX = (width * (nextScale - 1)) / 2;
      const maxY = (height * (nextScale - 1)) / 2;

      return {
        x: clamp(x, -maxX, maxX),
        y: clamp(y, -maxY, maxY),
      };
    },
    [],
  );

  const setZoom = React.useCallback(
    (nextScale: number) => {
      const next = clamp(nextScale, minZoom, maxZoom);

      setScale(next);

      setPosition((current) => clampPosition(current.x, current.y, next));
    },
    [minZoom, maxZoom, clampPosition],
  );

  const zoomIn = () => {
    setZoom(scale + zoomStep);
  };

  const zoomOut = () => {
    setZoom(scale - zoomStep);
  };

  const reset = () => {
    setScale(initialZoom);
    setPosition({
      x: 0,
      y: 0,
    });
  };

  const getDistance = (a: Point, b: Point) => {
    return Math.hypot(b.x - a.x, b.y - a.y);
  };

  const getCenter = (a: Point, b: Point): Point => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Don't allow controls to start a drag.
    if ((event.target as HTMLElement).closest("[data-zoom-controls]")) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    /*
     * Two pointers = pinch gesture.
     */
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());

      pinchRef.current = {
        distance: getDistance(a, b),
        scale,
        center: getCenter(a, b),
      };

      dragRef.current = null;
      setIsDragging(false);

      return;
    }

    /*
     * One pointer = normal pan.
     */
    if (scale > 1) {
      dragRef.current = {
        pointerId: event.pointerId,
        start: {
          x: event.clientX,
          y: event.clientY,
        },
        position: {
          ...position,
        },
      };

      setIsDragging(true);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) {
      return;
    }

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    /*
     * PINCH ZOOM
     */
    if (pointers.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointers.current.values());

      const distance = getDistance(a, b);

      if (pinchRef.current.distance === 0) {
        return;
      }

      const ratio = distance / pinchRef.current.distance;

      const nextScale = clamp(pinchRef.current.scale * ratio, minZoom, maxZoom);

      setScale(nextScale);

      /*
       * Keep the current position valid while
       * the scale changes.
       */
      setPosition((current) => clampPosition(current.x, current.y, nextScale));

      return;
    }

    /*
     * MOUSE / SINGLE TOUCH PAN
     */
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId || scale <= 1) {
      return;
    }

    const deltaX = event.clientX - drag.start.x;

    const deltaY = event.clientY - drag.start.y;

    const next = clampPosition(
      drag.position.x + deltaX,
      drag.position.y + deltaY,
      scale,
    );

    setPosition(next);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);

    dragRef.current = null;
    pinchRef.current = null;

    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={cn("relative h-full w-full", "overflow-hidden", className)}>
      {/* Fixed viewport.
          Nothing inside the dialog changes its size. */}
      <div
        ref={viewportRef}
        className={cn(
          "relative h-full w-full",
          "overflow-hidden",
          "select-none",
        )}
        style={{
          touchAction: scale > 1 ? "none" : "pan-x pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={cn(
            "absolute left-1/2 top-1/2",
            "h-full w-full",
            "object-contain select-none",
            "will-change-transform",
            scale > 1
              ? isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-default",
          )}
          style={{
            transform: `
              translate(-50%, -50%)
              translate(${position.x}px, ${position.y}px)
              scale(${scale})
            `,
          }}
        />
      </div>

      {/* Controls are ABOVE EVERYTHING */}
      <div
        data-zoom-controls
        className={cn(
          "absolute bottom-3 right-3",
          "z-[100]",
          "flex items-center gap-1",
          "rounded-lg border",
          "bg-background/95 p-1",
          "shadow-xl backdrop-blur-sm",
        )}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={scale <= minZoom}
          onClick={zoomOut}
          aria-label={t("imageZoom.zoomOut")}
        >
          <Minus className="size-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={reset}
          aria-label={t("imageZoom.resetZoom")}
        >
          <RotateCcw className="size-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={scale >= maxZoom}
          onClick={zoomIn}
          aria-label={t("imageZoom.zoomIn")}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
};
