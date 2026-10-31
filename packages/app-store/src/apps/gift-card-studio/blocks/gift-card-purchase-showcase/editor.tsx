"use client";

import { EditorEmbeddedSlot } from "@hacado/builder/blocks";
import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import {
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base/helpers";
import { BlockStyle } from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui/cn";
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
        abovePreviewFirstOnMobile={blockProps?.abovePreviewFirstOnMobile}
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
