"use client";

import { ReplaceOriginalColors } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { GripVertical } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface BeforeAfterSliderProps {
  before: React.ReactNode;
  after: React.ReactNode;
  sliderPosition: number;
  showLabels: boolean;
  beforeLabel?: React.ReactNode;
  afterLabel?: React.ReactNode;
  orientation: "horizontal" | "vertical";
  document?: Document;
  className?: string;
  id?: string;
}

const ComparisonItem = ({
  className,
  position,
  sliderPosition,
  orientation,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  position: "left" | "right";
  orientation: "horizontal" | "vertical";
  sliderPosition: number;
}) => {
  const clipPath =
    orientation === "horizontal"
      ? position === "left"
        ? `inset(0 ${100 - sliderPosition}% 0 0)`
        : `inset(0 0 0 ${sliderPosition}%)`
      : position === "left"
        ? `inset(0 0 ${100 - sliderPosition}% 0)`
        : `inset(${sliderPosition}% 0 0 0)`;
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      role="img"
      style={{
        clipPath,
      }}
      {...props}
    />
  );
};

const ComparisonHandle = ({
  className,
  children,
  sliderPosition,
  orientation,
  onDragStart,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  sliderPosition: number;
  orientation: "horizontal" | "vertical";
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}) => {
  const style =
    orientation === "horizontal"
      ? { left: `${sliderPosition}%` }
      : { top: `${sliderPosition}%` };
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute z-10 flex w-10 items-center justify-center",
        "cursor-grab active:cursor-grabbing",
        orientation === "horizontal"
          ? "-translate-x-1/2 top-0 h-full w-10"
          : "-translate-y-1/2 left-0 h-10 w-full",
        className,
      )}
      role="presentation"
      style={style}
      {...props}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
    >
      {children ?? (
        <>
          <div
            className={cn(
              "absolute bg-background",
              orientation === "horizontal"
                ? "-translate-x-1/2 left-1/2 h-full w-1"
                : "-translate-y-1/2 top-1/2 h-1 w-full",
            )}
          />
          <div className="z-[11] flex items-center justify-center rounded-sm bg-background px-0.5 py-1 border">
            <GripVertical className="h-4 w-4 select-none text-muted-foreground" />
          </div>
        </>
      )}
    </div>
  );
};

export const BeforeAfterSlider = ({
  before,
  after,
  sliderPosition,
  showLabels,
  beforeLabel,
  afterLabel,
  orientation,
  document: documentProp,
  className,
  id,
}: BeforeAfterSliderProps) => {
  const [position, setPosition] = useState(sliderPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(sliderPosition);
  }, [sliderPosition]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      e.preventDefault();
    },
    [],
  );

  useEffect(() => {
    const handleMove = (rect: DOMRect, clientX: number, clientY: number) => {
      let newPosition: number;

      if (orientation === "horizontal") {
        newPosition = ((clientX - rect.left) / rect.width) * 100;
      } else {
        newPosition = ((clientY - rect.top) / rect.height) * 100;
      }

      newPosition = Math.max(0, Math.min(100, newPosition));
      setPosition(newPosition);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      handleMove(rect, e.clientX, e.clientY);
    };

    const touchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      handleMove(rect, e.touches[0].clientX, e.touches[0].clientY);

      e.preventDefault();
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      const documentToUse = documentProp ?? document;

      documentToUse.addEventListener("mousemove", handleMouseMove);
      documentToUse.addEventListener("touchmove", touchMove, {
        passive: false,
      });
      documentToUse.addEventListener("mouseup", handleMouseUp);
      documentToUse.addEventListener("touchend", handleMouseUp);
      return () => {
        documentToUse.removeEventListener("mousemove", handleMouseMove);
        documentToUse.removeEventListener("touchmove", touchMove);
        documentToUse.removeEventListener("mouseup", handleMouseUp);
        documentToUse.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, documentProp, orientation]);

  return (
    <div
      ref={containerRef}
      aria-label="Before/After Slider"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={position}
      className={cn(
        "relative isolate overflow-hidden select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      id={id}
    >
      <ReplaceOriginalColors />

      <ComparisonItem
        position="left"
        sliderPosition={position}
        orientation={orientation}
      >
        {before}
        {showLabels && beforeLabel}
      </ComparisonItem>
      <ComparisonItem
        position="right"
        sliderPosition={position}
        orientation={orientation}
      >
        {after}
        {showLabels && afterLabel}
      </ComparisonItem>

      <ComparisonHandle
        sliderPosition={position}
        orientation={orientation}
        onDragStart={handleMouseDown}
      />
    </div>
  );
};
