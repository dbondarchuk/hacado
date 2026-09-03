"use client";

import { cn } from "@hacado/ui";
import { Play } from "lucide-react";
import React from "react";

export type PreviewVideoProps = {
  src: string;
  poster?: string;
  /** Keep playing while selected (in addition to hover). */
  active?: boolean;
  className?: string;
  alt?: string;
};

export const PreviewVideo: React.FC<PreviewVideoProps> = ({
  src,
  poster,
  active,
  className,
  alt,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = React.useState(false);
  const shouldPlay = Boolean(active || hovered);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPlay) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Autoplay can be blocked; ignore - hover/select will retry.
        });
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [shouldPlay]);

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        className="w-full h-32 object-cover"
      />
      {!shouldPlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-black/50 p-2">
            <Play className="size-5 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
};
