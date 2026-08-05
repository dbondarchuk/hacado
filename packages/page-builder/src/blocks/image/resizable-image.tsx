"use client";

import {
  BaseBlockProps,
  useEditorArgs,
  usePortalContext,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn, useDebounce } from "@hacado/ui";
import { mergeRefs } from "@hacado/ui/src/utils/merge-refs";
import { template } from "@hacado/utils";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ImageProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

type ImagePositionEditorProps = {
  props: ImageProps;
  initialX: number;
  initialY: number;
  className?: string;
  base?: BaseBlockProps;
  onPositionChange: (x: number, y: number) => void;
  onClick: (e: React.MouseEvent) => void;
};

export const ImagePositionEditor = forwardRef<
  HTMLImageElement,
  ImagePositionEditorProps
>(
  (
    { props, initialX, initialY, className, onPositionChange, base, onClick },
    ref,
  ) => {
    const { src, alt } = props.props ?? {
      src: "/assets/placeholder/400x200.jpg",
      alt: "Sample image",
    };

    const { document: portalDocument } = usePortalContext();
    const documentOrPortal = portalDocument ?? document;

    // Add a new state to track if the image has loaded
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const startPosRef = useRef({ x: 0, y: 0 });

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

    const handleImageMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingImage(true);
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        dragStartObjectPosRef.current = { ...objectPosition };

        // Change cursor style
        documentOrPortal.body.style.cursor = "move";
      },
      [objectPosition, onClick],
    );

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

    const handleImageMouseUp = useCallback(
      (e: MouseEvent) => {
        if (isDraggingImage) {
          setIsDraggingImage(false);
          documentOrPortal.body.style.cursor = "default";
          e.stopPropagation();
          e.preventDefault();
        }
      },
      [isDraggingImage],
    );

    // Add event listeners for image dragging
    useEffect(() => {
      if (isDraggingImage) {
        documentOrPortal.addEventListener("mousemove", handleImageMouseMove);
        documentOrPortal.addEventListener("mouseup", handleImageMouseUp);

        return () => {
          documentOrPortal.removeEventListener(
            "mousemove",
            handleImageMouseMove,
          );
          documentOrPortal.removeEventListener("mouseup", handleImageMouseUp);
        };
      }
    }, [isDraggingImage, handleImageMouseMove, handleImageMouseUp]);

    const imgClassName = useClassName();
    const defaults = getDefaults(props, false);

    const args = useEditorArgs();

    return (
      <>
        <BlockStyle
          name={imgClassName}
          styleDefinitions={styles}
          styles={props.style}
          defaults={defaults}
          isEditor
        />
        <img
          ref={mergeRefs(imageRef, ref)}
          src={template(src || "/assets/placeholder/400x200.jpg", args, true)}
          alt={alt ?? ""}
          className={cn(base?.className, imgClassName)}
          id={base?.id}
          style={{
            // @ts-expect-error - TODO: remove this once we have a proper solution for this
            userDrag: "none",
            // objectFit: "cover",
            objectPosition: `${objectPosition.x}% ${objectPosition.y}%`,
            cursor: "move",
          }}
          onMouseDown={handleImageMouseDown}
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </>
    );
  },
);
