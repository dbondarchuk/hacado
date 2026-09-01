"use client";

import { cn } from "@hacado/ui";
import React from "react";
import { BaseStyleDictionary, StyleValue } from "../style";
import { getColorStyle } from "../style/helpers/colors";
import type { BackgroundVideoValue } from "../style/styles/background/background-video";

export const PB_BG_VIDEO_CLASS = "pb-bg-video";
export const PB_BG_VIDEO_OVERLAY_CLASS = "pb-bg-video-overlay";

export function getBaseStyleValue<T>(
  styleProp?: Array<{
    breakpoint?: unknown[] | null;
    state?: unknown[] | null;
    value: T;
  }> | null,
): T | undefined {
  if (!styleProp?.length) return undefined;
  const base = styleProp.find(
    (variant) => !variant.breakpoint?.length && !variant.state?.length,
  );
  return (base ?? styleProp[0])?.value;
}

export function hasBackgroundVideo(
  style?: StyleValue<BaseStyleDictionary> | null,
): boolean {
  const value = getBaseStyleValue<BackgroundVideoValue>(
    style?.backgroundVideo as
      | Array<{ value: BackgroundVideoValue }>
      | undefined,
  );
  return Boolean(value?.src);
}

type BackgroundVideoLayerProps = {
  style?: StyleValue<BaseStyleDictionary> | null;
  className?: string;
};

export const BackgroundVideoLayer: React.FC<BackgroundVideoLayerProps> = ({
  style,
  className,
}) => {
  const video = getBaseStyleValue<BackgroundVideoValue>(
    style?.backgroundVideo as
      | Array<{ value: BackgroundVideoValue }>
      | undefined,
  );
  const src = video?.src;
  if (!src) return null;

  const color = getBaseStyleValue<string>(
    style?.backgroundColor as Array<{ value: string }> | undefined,
  );
  const opacity = getBaseStyleValue<number>(
    style?.backgroundColorOpacity as Array<{ value: number }> | undefined,
  );

  const showOverlay = Boolean(color) && color !== "transparent";
  const overlayOpacity =
    opacity === null || typeof opacity === "undefined" ? 1 : opacity / 100;

  return (
    <>
      <video
        className={cn(PB_BG_VIDEO_CLASS, className)}
        src={src}
        poster={video?.poster || undefined}
        muted
        autoPlay
        loop
        playsInline
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
          pointerEvents: "none",
          // // Avoid becoming a grid item that shifts auto-placement.
          // gridColumn: "1 / -1",
          // gridRow: "1 / -1",
        }}
      />
      {showOverlay && (
        <div
          className={PB_BG_VIDEO_OVERLAY_CLASS}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            pointerEvents: "none",
            backgroundColor: getColorStyle(color),
            opacity: overlayOpacity,
            // gridColumn: "1 / -1",
            // gridRow: "1 / -1",
          }}
        />
      )}
    </>
  );
};
