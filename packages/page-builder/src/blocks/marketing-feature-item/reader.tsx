import {
  BlockStyle,
  generateClassName,
  ReaderEmbeddedSlotChildren,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { MarketingFeatureItemReaderProps } from "./schema";
import { styles } from "./styles";

/** Full stacked layout when the item is viewed outside the showcase (fallback). */
export const MarketingFeatureItemReader = ({
  style,
  props,
  block,
  ...rest
}: MarketingFeatureItemReaderProps) => {
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <ReplaceOriginalColors />
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6",
          className,
          base?.className,
        )}
        id={base?.id}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <ReaderEmbeddedSlotChildren
            slot={props?.cardIcon}
            styleDefinitions={styles}
            rest={rest}
          />
          <ReaderEmbeddedSlotChildren
            slot={props?.title}
            styleDefinitions={styles}
            rest={rest}
          />
          <ReaderEmbeddedSlotChildren
            slot={props?.description}
            styleDefinitions={styles}
            rest={rest}
          />
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <ReaderEmbeddedSlotChildren
            slot={props?.detailHeadline}
            styleDefinitions={styles}
            rest={rest}
          />
          <ReaderEmbeddedSlotChildren
            slot={props?.detailBullets}
            styleDefinitions={styles}
            rest={rest}
          />
        </div>
      </div>
    </>
  );
};
