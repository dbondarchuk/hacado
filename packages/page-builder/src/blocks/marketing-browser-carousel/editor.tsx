"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import {
  BlockStyle,
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui/cn";
import { MarketingBrowserCarouselClient } from "./marketing-browser-carousel.client";
import type { MarketingBrowserCarouselProps } from "./schema";
import { styles } from "./styles";

export const MarketingBrowserCarouselEditor = ({
  style,
  props,
}: MarketingBrowserCarouselProps) => {
  const currentBlock = useCurrentBlock<MarketingBrowserCarouselProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      <ReplaceOriginalColors />
      <MarketingBrowserCarouselClient
        className={cn(className, base?.className)}
        id={base?.id}
        slides={props.slides ?? []}
        showTabs={props.showTabs ?? true}
        showDots={props.showDots ?? true}
        showBrowserChrome={props.showBrowserChrome ?? true}
        autoRotateMs={props.autoRotateMs ?? 0}
        {...overlayProps}
      />
    </>
  );
};
