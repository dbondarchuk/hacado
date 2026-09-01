"use client";

import { usePortalContext } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import type { FluidPlacementTier } from "./responsive";

type FluidLayoutHelpBarProps = {
  placementTier: FluidPlacementTier;
  isTierCustom: boolean;
  onResetTier: () => void;
  className?: string;
};

const TIER_LABEL_KEYS = {
  desktop: "pageBuilder.blocks.fluidLayout.helpBar.tierDesktop",
  tablet: "pageBuilder.blocks.fluidLayout.helpBar.tierTablet",
  mobile: "pageBuilder.blocks.fluidLayout.helpBar.tierMobile",
  mobileLandscape: "pageBuilder.blocks.fluidLayout.helpBar.tierMobileLandscape",
} as const;

export function FluidLayoutHelpBar({
  placementTier,
  isTierCustom,
  onResetTier,
  className,
}: FluidLayoutHelpBarProps) {
  const t = useI18n("builder");
  const { viewportHintHost } = usePortalContext();

  const modKey = useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl";
    return navigator.userAgent.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
  }, []);

  const tierLabel = t(TIER_LABEL_KEYS[placementTier] as any);

  if (!viewportHintHost) return null;

  return createPortal(
    <div
      className={cn(
        "mx-auto mt-3 w-full max-w-[min(100%,40rem)] rounded-lg border border-border/60 bg-background/95 px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground shadow-sm",
        className,
      )}
    >
      <p className="mb-1 font-medium text-foreground/90">
        {t("pageBuilder.blocks.fluidLayout.helpBar.title")}
      </p>
      {placementTier !== "desktop" ? (
        <p className="mb-1 text-foreground/80">
          {isTierCustom
            ? t("pageBuilder.blocks.fluidLayout.helpBar.tierCustom", {
                tier: tierLabel,
              })
            : t("pageBuilder.blocks.fluidLayout.helpBar.tierAuto", {
                tier: tierLabel,
              })}
          {isTierCustom ? (
            <>
              {" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onResetTier();
                }}
              >
                {t("pageBuilder.blocks.fluidLayout.helpBar.resetLayout")}
              </button>
            </>
          ) : null}
        </p>
      ) : null}
      <p>{t("pageBuilder.blocks.fluidLayout.helpBar.dragDrop", { modKey })}</p>
      <p className="mt-1">
        {t("pageBuilder.blocks.fluidLayout.helpBar.keyboard", { modKey })}
      </p>
    </div>,
    viewportHintHost,
  );
}
