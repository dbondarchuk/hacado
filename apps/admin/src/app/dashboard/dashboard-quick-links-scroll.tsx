"use client";

import { useHasDashboardNotifications } from "@/app/dashboard/notifications-toast-stream";
import { useI18n } from "@hacado/i18n/client";
import { cn, Link } from "@hacado/ui";
import React from "react";
import type { QuickLinkRenderItem } from "./dashboard-quick-links-types";
import { recordQuickLinkUsageAction } from "./quick-link-usage-actions";

export type { QuickLinkRenderItem };

const pillClassName =
  "relative inline-flex shrink-0 items-center gap-2 rounded-full";

function trackQuickLinkUsage(usageKey: string) {
  void recordQuickLinkUsageAction(usageKey);
}

function QuickLinkDot({
  notificationsCountKey,
}: {
  notificationsCountKey?: string;
}) {
  const hasNotification = useHasDashboardNotifications([notificationsCountKey]);
  if (!hasNotification) {
    return null;
  }

  return (
    <span
      className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background"
      aria-hidden
    />
  );
}

function QuickLinkPill({ item }: { item: QuickLinkRenderItem }) {
  const t = useI18n();
  const label = t(item.labelKey);
  const onActivate = () => trackQuickLinkUsage(item.usageKey);

  if (item.Action) {
    const Action = item.Action;
    return (
      <span
        className="relative inline-flex shrink-0"
        onClickCapture={onActivate}
      >
        <Action
          appId={item.appId}
          label={label}
          icon={item.icon}
          className={pillClassName}
        />
        <QuickLinkDot notificationsCountKey={item.notificationsCountKey} />
      </span>
    );
  }

  if (!item.href) {
    return null;
  }

  return (
    <Link
      href={item.href}
      button
      variant="outline"
      size="sm"
      className={pillClassName}
      onClick={onActivate}
    >
      {item.icon}
      {label}
      <QuickLinkDot notificationsCountKey={item.notificationsCountKey} />
    </Link>
  );
}

export function DashboardQuickLinksScroll({
  links,
}: {
  links: QuickLinkRenderItem[];
}) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollIndicators = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    const hasOverflow = maxScrollLeft > 1;
    const scrollLeft = viewport.scrollLeft;

    setCanScrollLeft(hasOverflow && scrollLeft > 1);
    setCanScrollRight(hasOverflow && scrollLeft < maxScrollLeft - 1);
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => updateScrollIndicators();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollIndicators);

    const resizeObserver = new ResizeObserver(() => updateScrollIndicators());
    resizeObserver.observe(viewport);
    const content = viewport.firstElementChild;
    if (content instanceof HTMLElement) {
      resizeObserver.observe(content);
    }

    requestAnimationFrame(updateScrollIndicators);

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollIndicators);
      resizeObserver.disconnect();
    };
  }, [updateScrollIndicators, links.length]);

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={viewportRef}
        className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {links.map((link) => (
          <QuickLinkPill key={link.id} item={link} />
        ))}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent transition-opacity",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent transition-opacity",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
