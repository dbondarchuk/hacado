"use client";

import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import {
  BlockStyle,
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { BookingWithWaitlist } from "./components/booking";
import { BookingWithWaitlistProps } from "./schema";
import { styles } from "./styles";

export const BookingWithWaitlistEditor = ({
  props,
  style,
}: BookingWithWaitlistProps) => {
  const currentBlock = useCurrentBlock<BookingWithWaitlistProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const className = useClassName();
  const base = currentBlock.base;
  const metadata = currentBlock?.metadata;
  const appId = metadata?.waitlistAppId;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <ReplaceOriginalColors />
      <BookingWithWaitlist
        className={cn(className, base?.className)}
        id={base?.id}
        successPage={props.confirmationPage}
        flowOrder={props.flowOrder}
        isEditor
        isOnlyWaitlist={false}
        appId={appId}
        {...overlayProps}
      />
    </>
  );
};
