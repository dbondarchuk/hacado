"use client";

import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import type { MarketingBrowserCarouselSlide } from "./schema";

export type MarketingBrowserCarouselClientProps = {
  className?: string;
  id?: string;
  slides: MarketingBrowserCarouselSlide[];
  showTabs: boolean;
  showDots: boolean;
  showBrowserChrome: boolean;
  autoRotateMs: number;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
};

export const MarketingBrowserCarouselClient = forwardRef<
  HTMLDivElement,
  MarketingBrowserCarouselClientProps
>(
  (
    {
      className,
      id,
      slides,
      showTabs,
      showDots,
      showBrowserChrome,
      autoRotateMs,
      onClick,
    },
    ref,
  ) => {
    const t = useI18n("ui");
    const [index, setIndex] = useState(0);

    const safeSlides = useMemo(
      () => slides.filter((s) => s.src?.trim().length > 0),
      [slides],
    );

    useEffect(() => {
      setIndex((i) => Math.min(i, Math.max(0, safeSlides.length - 1)));
    }, [safeSlides.length]);

    useEffect(() => {
      if (!autoRotateMs || safeSlides.length <= 1) return;
      const timer = window.setInterval(() => {
        setIndex((i) => (i + 1) % safeSlides.length);
      }, autoRotateMs);
      return () => window.clearInterval(timer);
    }, [autoRotateMs, safeSlides.length]);

    const current = safeSlides[index] ?? safeSlides[0];
    const address = current?.addressBar?.trim() || current?.label || "\u00a0";

    if (!safeSlides.length) {
      return (
        <div
          ref={ref}
          id={id}
          onClick={onClick}
          className={cn("w-full", className)}
        >
          <div className="flex min-h-[12rem] w-full items-center justify-center rounded-xl border border-dashed border-muted bg-muted/20 text-center text-sm text-muted-foreground">
            {t("marketingBrowserCarousel.emptySlides")}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        id={id}
        onClick={onClick}
        className={cn("w-full", className)}
      >
        {showTabs ? (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {safeSlides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-all",
                  index === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {slide.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            showBrowserChrome &&
              "relative rounded-xl bg-foreground/5 p-2 ring-1 ring-primary/20",
          )}
        >
          <div
            className={cn(
              "overflow-hidden bg-card shadow-2xl ring-1 ring-border",
              showBrowserChrome ? "rounded-lg" : "rounded-xl",
            )}
          >
            {showBrowserChrome ? (
              <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex gap-1.5" aria-hidden>
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <span className="truncate text-xs text-muted-foreground">
                    {address}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
              {safeSlides.map((slide, i) => (
                <img
                  key={slide.id}
                  src={slide.src}
                  alt={t("marketingBrowserCarousel.imageAlt", {
                    name: slide.label,
                  })}
                  className={cn(
                    "absolute inset-0 size-full object-cover transition-opacity duration-500",
                    index === i ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {showDots ? (
          <div className="mt-4 flex justify-center gap-1.5">
            {safeSlides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                aria-label={t("marketingBrowserCarousel.goToSlide", {
                  slide: i + 1,
                })}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === i
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);
