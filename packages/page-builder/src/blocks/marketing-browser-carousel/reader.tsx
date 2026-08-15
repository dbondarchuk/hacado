import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { MarketingBrowserCarouselClient } from "./marketing-browser-carousel.client";
import { type MarketingBrowserCarouselReaderProps } from "./schema";
import { styles } from "./styles";

export const MarketingBrowserCarouselReader = ({
  block,
  style,
  props,
  isEditor,
}: MarketingBrowserCarouselReaderProps) => {
  const className = generateClassName();
  const base = block.base;
  const p = props ?? {};

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor={isEditor}
      />
      <ReplaceOriginalColors />
      <MarketingBrowserCarouselClient
        className={cn(className, base?.className)}
        id={base?.id}
        slides={p.slides ?? []}
        showTabs={p.showTabs ?? true}
        showDots={p.showDots ?? true}
        showBrowserChrome={p.showBrowserChrome ?? true}
        autoRotateMs={p.autoRotateMs ?? 0}
      />
    </>
  );
};
