import {
  BlockStyle,
  generateClassName,
  ReaderEmbeddedSlotChildren,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { GiftCardPurchaseShowcaseReader } from "./reader-component";
import { GiftCardPurchaseShowcaseBlockReaderProps, styles } from "./schema";

export const GiftCardPurchaseShowcaseBlockReaderWrapper = (
  props: GiftCardPurchaseShowcaseBlockReaderProps & {
    isEditor?: boolean;
  },
) => {
  const { block, style, props: blockProps, ...rest } = props;
  const className = generateClassName();
  const metadata = block?.metadata as { giftCardStudioAppId?: string };

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <ReplaceOriginalColors />
      <GiftCardPurchaseShowcaseReader
        appId={metadata?.giftCardStudioAppId}
        className={cn(className, block?.base?.className)}
        id={block?.base?.id}
        hideTitle={blockProps?.hideTitle ?? true}
        hideSteps={blockProps?.hideSteps ?? false}
        previewPosition={blockProps?.previewPosition}
        abovePreviewFirstOnMobile={blockProps?.abovePreviewFirstOnMobile}
        amountPresets={blockProps?.amountPresets}
        isEditor={rest.isEditor}
        title={
          <ReaderEmbeddedSlotChildren
            slot={blockProps?.title}
            styleDefinitions={styles}
            rest={rest}
          />
        }
        abovePreview={
          <ReaderEmbeddedSlotChildren
            slot={blockProps?.abovePreview}
            styleDefinitions={styles}
            rest={rest}
          />
        }
        belowPreview={
          <ReaderEmbeddedSlotChildren
            slot={blockProps?.belowPreview}
            styleDefinitions={styles}
            rest={rest}
          />
        }
      />
    </>
  );
};
