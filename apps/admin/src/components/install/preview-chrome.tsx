"use client";

import { cn } from "@hacado/ui";
import { useEffect, useState } from "react";

export type PreviewHeaderVariant = "solid" | "transparent";

type PreviewChromeProps = {
  header?: PreviewHeaderVariant | null;
  footer?: boolean;
  logoUrl?: string | null;
  businessName?: string;
  children: React.ReactNode;
};

/**
 * Static header/footer chrome for template and install live previews.
 * Not the real page-header entities - visual only for screenshots / iframes.
 */
export function PreviewChrome({
  header,
  footer,
  logoUrl,
  businessName = "Studio",
  children,
}: PreviewChromeProps) {
  const showHeader = Boolean(header);
  const transparent = header === "transparent";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) {
      setScrolled(false);
      return;
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const overlaySolid = transparent && scrolled;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {showHeader ? (
        <header
          className={cn(
            "z-20 flex w-full items-center justify-between gap-4 px-6 py-4 transition-[background-color,color,box-shadow,border-color] duration-200 md:px-10",
            !transparent &&
              "relative border-b border-border bg-background text-foreground",
            transparent &&
              !overlaySolid &&
              "absolute inset-x-0 top-0 border-b border-transparent bg-transparent text-white",
            transparent &&
              overlaySolid &&
              "fixed inset-x-0 top-0 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-sm",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            {!!logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-8 w-auto max-w-[9rem] object-contain"
              />
            )}
            <span
              className={cn(
                "truncate text-lg font-semibold tracking-tight",
                transparent && !overlaySolid && "drop-shadow-sm",
              )}
            >
              {businessName}
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <span className="rounded-md px-3 py-1.5 opacity-90">About</span>
            <span
              className={cn(
                "rounded-md px-3 py-1.5",
                transparent && !overlaySolid
                  ? "bg-white/15 text-white"
                  : "bg-primary text-primary-foreground",
              )}
            >
              Book
            </span>
          </nav>
        </header>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
      {footer ? (
        <footer className="mt-auto border-t border-border bg-muted/40 px-6 py-10 md:px-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:justify-between">
            <div>
              <p className="text-base font-semibold">{businessName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Book online anytime
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>Book</span>
              <span>About</span>
              <span>Terms</span>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

export function parsePreviewHeaderParam(
  value: string | null | undefined,
): PreviewHeaderVariant | null {
  if (value === "solid" || value === "transparent") return value;
  return null;
}
