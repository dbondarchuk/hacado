"use client";

import { cn } from "@hacado/ui";
import { forwardRef, HTMLAttributes, MouseEvent, useCallback } from "react";
import { extractYouTubeVideoId } from "./utils";

export type YouTubeVideoElementProps = {
  youtubeUrl?: string | null;
  autoplay?: boolean | null;
  controls?: boolean | null;
  loop?: boolean | null;
  muted?: boolean | null;
  showInfo?: boolean | null;
  rel?: boolean | null;
  modestbranding?: boolean | null;
  start?: number | null;
  end?: number | null;
  privacy?: boolean | null;
  disableEvents?: boolean;
};

export const YouTubeVideo = forwardRef<
  HTMLDivElement,
  YouTubeVideoElementProps &
    Pick<HTMLAttributes<HTMLDivElement>, "onClick" | "className" | "id">
>(
  (
    {
      youtubeUrl,
      autoplay = false,
      controls = true,
      loop = false,
      muted = false,
      showInfo = true,
      rel = false,
      modestbranding = false,
      start,
      end,
      privacy = false,
      disableEvents = false,
      className,
      id,
      onClick: onClickProp,
      ...rest
    },
    ref,
  ) => {
    const eventListener = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        onClickProp?.(e);
        if (disableEvents) {
          e.preventDefault();
        }
      },
      [disableEvents, onClickProp],
    );

    const videoId = extractYouTubeVideoId(youtubeUrl || "");
    if (!videoId) {
      return (
        <div
          className={cn(className)}
          style={{ color: "red" }}
          id={id}
          ref={ref}
        >
          Invalid YouTube URL
        </div>
      );
    }

    const baseUrl = privacy
      ? "https://www.youtube-nocookie.com/embed/"
      : "https://www.youtube.com/embed/";

    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      controls: controls === false ? "0" : "1",
      loop: loop ? "1" : "0",
      mute: muted ? "1" : "0",
      modestbranding: modestbranding ? "1" : "0",
      rel: rel ? "1" : "0",
      showinfo: showInfo ? "1" : "0",
    });
    if (start) params.set("start", String(start));
    if (end) params.set("end", String(end));
    if (loop) params.set("playlist", videoId);

    const src = `${baseUrl}${videoId}?${params.toString()}`;

    return (
      <div
        {...rest}
        className={cn("relative", className)}
        id={id}
        ref={ref}
        style={{
          pointerEvents: disableEvents ? "none" : undefined,
        }}
        onMouseDown={eventListener}
        onClick={eventListener}
      >
        <iframe
          src={src}
          title="YouTube video"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  },
);

YouTubeVideo.displayName = "YouTubeVideo";
