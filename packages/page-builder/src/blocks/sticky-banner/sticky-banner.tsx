"use client";

import { usePortalContext } from "@hacado/builder";
import { BannerProvider } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { X } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { createPortal } from "react-dom";
import { showStickyBannerType, stickyBannerPositionType } from "./schema";

const shownCookieValue = "shown";

export const StickyBanner: React.FC<{
  blockId: string;
  show: (typeof showStickyBannerType)[number];
  position: (typeof stickyBannerPositionType)[number];
  showCloseButton?: boolean;
  isEditor?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}> = ({
  blockId,
  show,
  position,
  showCloseButton = true,
  isEditor,
  id,
  className,
  children,
}) => {
  const bannerId = id || blockId;
  const COOKIE_NAME = `sticky-banner-shown-${bannerId}`;

  const [cookies, setCookies] = useCookies<
    typeof COOKIE_NAME,
    Record<string, string | undefined>
  >([COOKIE_NAME]);

  const { body } = usePortalContext();
  const container = body && body.nodeType === 1 ? body : undefined;

  // Start closed for one-time so we don't flash open before cookies are readable.
  const [isOpen, setIsOpen] = useState(
    () => show === "always" || (Boolean(isEditor) && show !== "on-click"),
  );

  useEffect(() => {
    if (isEditor || show !== "one-time") return;

    const alreadyShown = document.cookie
      .split("; ")
      .some((row) => row.startsWith(`${COOKIE_NAME}=${shownCookieValue}`));

    if (!alreadyShown) {
      setIsOpen(true);
    }
  }, [COOKIE_NAME, isEditor, show]);

  const onOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);

    if (!!cookies[COOKIE_NAME]) return;

    setCookies(COOKIE_NAME, shownCookieValue, {
      expires: DateTime.now().plus({ years: 1 }).toJSDate(),
    });
  };

  const closeButton = showCloseButton ? (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className={cn(
        "absolute right-6 z-10 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        position === "bottom"
          ? "top-0 -translate-y-1/2"
          : "bottom-0 translate-y-1/2",
      )}
      aria-label="Close"
    >
      <X className="size-3.5" />
      <span className="sr-only">Close</span>
    </button>
  ) : null;

  const content = (
    <BannerProvider id={bannerId} isOpen={isOpen} setIsOpen={onOpenChange}>
      {isOpen ? (
        <div
          id={id}
          className={cn(
            "fixed left-0 right-0 z-40 w-full overflow-visible",
            position === "top" ? "top-0" : "bottom-0",
            className,
          )}
          role="banner"
        >
          <div className="relative w-full overflow-visible">
            {closeButton}
            {children}
          </div>
        </div>
      ) : null}
    </BannerProvider>
  );

  if (isEditor || !container) {
    return content;
  }

  return createPortal(content, container);
};
