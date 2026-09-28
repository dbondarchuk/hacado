"use client";

import { cn } from "@hacado/ui";
import { forwardRef, type MouseEvent, type ReactNode } from "react";
import { useGiftCardPurchase } from "../gift-card-purchase/use-gift-card-purchase";
import { defaultPurchaseAmount, normalizeAmountPresets } from "./presets";
import { GiftCardPurchaseShowcaseView } from "./view";

export const GiftCardPurchaseShowcaseReader = forwardRef<
  HTMLDivElement,
  {
    appId: string | null | undefined;
    className: string;
    id?: string;
    hideTitle?: boolean | null;
    hideSteps?: boolean | null;
    previewPosition?: "left" | "right" | null;
    abovePreviewFirstOnMobile?: boolean | null;
    amountPresets?: number[] | null;
    title: ReactNode;
    abovePreview: ReactNode;
    belowPreview: ReactNode;
    isEditor?: boolean;
    onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  }
>(
  (
    {
      appId,
      className,
      id,
      hideTitle,
      hideSteps,
      previewPosition,
      abovePreviewFirstOnMobile,
      amountPresets: amountPresetsProp,
      title,
      abovePreview,
      belowPreview,
      isEditor,
      onClick,
    },
    ref,
  ) => {
    const amountPresets = normalizeAmountPresets(amountPresetsProp);
    const purchase = useGiftCardPurchase({
      appId,
      isEditor,
      defaultAmount: defaultPurchaseAmount(amountPresets),
    });

    return (
      <GiftCardPurchaseShowcaseView
        ref={ref}
        purchase={purchase}
        className={cn(className)}
        id={id}
        onClick={onClick}
        hideTitle={hideTitle ?? true}
        hideSteps={hideSteps ?? false}
        previewPosition={previewPosition === "right" ? "right" : "left"}
        abovePreviewFirstOnMobile={abovePreviewFirstOnMobile ?? true}
        amountPresets={amountPresets}
        isEditor={isEditor}
        title={title}
        abovePreview={abovePreview}
        belowPreview={belowPreview}
      />
    );
  },
);
