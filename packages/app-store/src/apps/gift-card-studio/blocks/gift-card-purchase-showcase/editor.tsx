"use client";

import {
  EditorEmbeddedSlot,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { ReplaceOriginalColors, useClassName } from "@hacado/page-builder-base";
import { BlockStyle } from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { normalizeAmountPresets } from "./presets";
import { GiftCardPurchaseShowcaseReader } from "./reader-component";
import {
  GiftCardPurchaseShowcaseBlockProps,
  GiftCardPurchaseShowcaseBlockReaderProps,
  styles,
} from "./schema";

export const GiftCardPurchaseShowcaseBlockEditor = ({
  style,
}: GiftCardPurchaseShowcaseBlockReaderProps) => {
  const currentBlock = useCurrentBlock<GiftCardPurchaseShowcaseBlockProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const appId = (currentBlock.metadata as { giftCardStudioAppId?: string })
    ?.giftCardStudioAppId;
  const blockProps = currentBlock.data?.props;
  const amountPresets = normalizeAmountPresets(blockProps?.amountPresets);
  const parentBlockId = currentBlock.id;

  return (
    <>
      <ReplaceOriginalColors />
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      <GiftCardPurchaseShowcaseReader
        appId={appId}
        className={cn(className, currentBlock.base?.className)}
        id={currentBlock.base?.id}
        onClick={overlayProps.onClick}
        ref={overlayProps.ref}
        hideTitle={blockProps?.hideTitle ?? true}
        hideSteps={blockProps?.hideSteps ?? false}
        previewPosition={blockProps?.previewPosition}
        amountPresets={amountPresets}
        isEditor
        title={
          <EditorEmbeddedSlot
            parentBlockId={parentBlockId}
            childrenProperty="props.title"
            slotKey="title"
          />
        }
        abovePreview={
          <EditorEmbeddedSlot
            parentBlockId={parentBlockId}
            childrenProperty="props.abovePreview"
            slotKey="abovePreview"
          />
        }
        belowPreview={
          <EditorEmbeddedSlot
            parentBlockId={parentBlockId}
            childrenProperty="props.belowPreview"
            slotKey="belowPreview"
          />
        }
      />
    </>
  );
};
