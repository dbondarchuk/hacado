"use client";

import { cn } from "@hacado/ui";
import { forwardRef, HTMLAttributes } from "react";

export type VideoElementProps = {
  src?: string | null;
  poster?: string | null;
  controls?: boolean | null;
  autoplay?: boolean | null;
  loop?: boolean | null;
  muted?: boolean | null;
  preload?: "none" | "metadata" | "auto" | null;
};

export const Video = forwardRef<
  HTMLVideoElement,
  VideoElementProps &
    Pick<HTMLAttributes<HTMLVideoElement>, "onClick" | "className" | "id">
>(
  (
    {
      src,
      poster,
      controls = true,
      autoplay = false,
      loop = false,
      muted = false,
      preload = "metadata",
      className,
      id,
      ...rest
    },
    ref,
  ) => (
    <video
      {...rest}
      className={cn("block", className)}
      src={src ?? ""}
      poster={poster ?? undefined}
      controls={controls ?? true}
      autoPlay={autoplay ?? false}
      loop={loop ?? false}
      muted={muted ?? false}
      playsInline
      preload={preload ?? "metadata"}
      id={id}
      ref={ref}
    />
  ),
);

Video.displayName = "Video";
