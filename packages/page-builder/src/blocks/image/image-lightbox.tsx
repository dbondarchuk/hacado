"use client";

import { cn } from "@hacado/ui";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { useLightboxImage } from "../lightbox/context";

export const ImageLightbox = forwardRef<
  HTMLImageElement,
  {
    src: string;
    alt?: string;
    className?: string;
    id?: string;
    onClick?: (e: React.MouseEvent) => void;
  }
>(({ src, alt, className, id, onClick }, ref) => {
  const lightbox = useLightboxImage();
  const [imageId, setImageId] = useState<string | null>(null);
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      onClick?.(e);
      if (lightbox && src && imageId) {
        lightbox.openLightbox(imageId);
        e.preventDefault();
      }
    },
    [lightbox, src, imageId, onClick],
  );

  useEffect(() => {
    if (lightbox && src) {
      const id = lightbox.registerImage(src, alt ?? "");
      setImageId(id);
      return () => {
        lightbox.unregisterImage(id);
        setImageId(null);
      };
    }
  }, [lightbox, src, alt]);

  return (
    <img
      alt={alt ?? ""}
      src={src}
      className={cn(className, lightbox ? "cursor-pointer" : "")}
      id={id}
      ref={ref}
      onClick={handleClick}
    />
  );
});
