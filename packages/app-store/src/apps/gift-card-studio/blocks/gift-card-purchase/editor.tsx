"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import {
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base/helpers";
import { BlockStyle } from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui/cn";
import { GiftCardPurchaseBlockReader } from "./reader-component";
import {
  GiftCardPurchaseBlockProps,
  GiftCardPurchaseBlockReaderProps,
  styles,
} from "./schema";

export const GiftCardPurchaseBlockEditor = ({
  style,
  props: _props,
  block,
  ..._rest
}: GiftCardPurchaseBlockReaderProps & Record<string, unknown>) => {
  const currentBlock = useCurrentBlock<GiftCardPurchaseBlockProps>();
  const overlayProps = useBlockEditor(currentBlock?.id);

  const appId = (currentBlock?.metadata as { giftCardStudioAppId?: string })
    ?.giftCardStudioAppId;

  const className = useClassName();
  const base = currentBlock?.base;
  const props = currentBlock?.data?.props;

  return (
    <>
      <ReplaceOriginalColors />
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      <GiftCardPurchaseBlockReader
        appId={appId}
        className={cn(className, base?.className)}
        id={base?.id}
        hideTitle={props?.hideTitle ?? false}
        hideSteps={props?.hideSteps ?? false}
        onClick={overlayProps.onClick}
        isEditor={true}
        ref={overlayProps.ref}
      />
    </>
  );
};
