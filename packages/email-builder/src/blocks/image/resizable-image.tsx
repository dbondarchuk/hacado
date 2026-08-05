"use client";

import { usePortalContext } from "@hacado/builder";
import { cn, useDebounce } from "@hacado/ui";
import { mergeRefs } from "@hacado/ui/src/utils/merge-refs";
import {
  CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type ResizableImageProps = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  initialX: number;
  initialY: number;
  className?: string;
  wrapperStyles?: CSSProperties;
  imageStyles?: CSSProperties;
  onPositionChange: (x: number, y: number) => void;
  onClick?: (e: React.MouseEvent) => void;
};

export const ResizableImage = forwardRef<HTMLImageElement, ResizableImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      initialX,
      initialY,
      className,
      wrapperStyles,
      imageStyles,
      onPositionChange,
      onClick,
    },
    ref,
  ) => {
    // Add a new state to track if the image has loaded

    const imageRef = useRef<HTMLImageElement>(null);
    const { document } = usePortalContext();

    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [objectPosition, setObjectPosition] = useState({
      x: initialX,
      y: initialY,
    });
    const debouncedObjectPosition = useDebounce(objectPosition, 200);

    useEffect(() => {
      setObjectPosition({ x: initialX, y: initialY });
    }, [initialX, initialY]);

    useEffect(() => {
      onPositionChange(debouncedObjectPosition.x, debouncedObjectPosition.y);
    }, [debouncedObjectPosition]);

    const dragStartPosRef = useRef({ x: 0, y: 0 });
    const dragStartObjectPosRef = useRef({ x: 50, y: 50 });

    const originalCursor = useRef<string>("");

    const handleImageMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDraggingImage(true);
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      dragStartObjectPosRef.current = { ...objectPosition };

      // Change cursor style
      originalCursor.current = document.body.style.cursor;
      document.body.style.cursor = "move";
    };

    const handleImageMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDraggingImage || !imageRef.current) return;

        // Calculate the delta movement
        const deltaX = e.clientX - dragStartPosRef.current.x;
        const deltaY = e.clientY - dragStartPosRef.current.y;

        const rect = imageRef.current.getBoundingClientRect();

        // Calculate new position (invert the movement for natural feeling)
        // and constrain between 0 and 100
        const newX = Math.max(
          0,
          Math.min(
            100,
            dragStartObjectPosRef.current.x - (deltaX / rect.width) * 100,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(
            100,
            dragStartObjectPosRef.current.y - (deltaY / rect.height) * 100,
          ),
        );

        setObjectPosition({ x: Math.round(newX), y: Math.round(newY) });
      },
      [isDraggingImage, imageRef.current],
    );

    const handleImageMouseUp = useCallback(() => {
      if (isDraggingImage) {
        setIsDraggingImage(false);
        document.body.style.cursor = originalCursor.current;
      }
    }, [isDraggingImage]);

    // Add event listeners for image dragging
    useEffect(() => {
      if (isDraggingImage) {
        document.addEventListener("mousemove", handleImageMouseMove);
        document.addEventListener("mouseup", handleImageMouseUp);
      }

      return () => {
        document.removeEventListener("mousemove", handleImageMouseMove);
        document.removeEventListener("mouseup", handleImageMouseUp);
      };
    }, [isDraggingImage, handleImageMouseMove, handleImageMouseUp]);

    return (
      <div className="w-full" style={wrapperStyles} onClick={onClick}>
        <div
          className={cn(
            "relative group inline-block",
            "select-none",
            className,
          )}
          style={{}}
        >
          <div className="relative w-full h-full overflow-hidden inline-block">
            <img
              ref={mergeRefs(imageRef, ref)}
              src={src || "/placeholder.svg"}
              alt={alt}
              style={{
                objectFit: "cover",
                ...imageStyles,
                objectPosition: `${objectPosition.x}% ${objectPosition.y}%`,
                width: width ? `${width}px` : undefined,
                height: height ? `${height}px` : undefined,
                cursor: "move",
              }}
              onMouseDown={handleImageMouseDown}
              draggable={false}
            />
          </div>
        </div>
      </div>
    );
  },
);
