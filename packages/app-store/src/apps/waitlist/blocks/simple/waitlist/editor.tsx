"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import {
  BlockStyle,
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui/cn";
import { BookingWithWaitlist } from "../booking-with-waitlist/components/booking";
import { WaitlistProps } from "./schema";
import { styles } from "./styles";

export const WaitlistEditor = ({ props, style }: WaitlistProps) => {
  const currentBlock = useCurrentBlock<WaitlistProps>();
  const metadata = currentBlock?.metadata;
  const overlayProps = useBlockEditor(currentBlock.id);

  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <ReplaceOriginalColors />
      <BookingWithWaitlist
        className={cn(className, base?.className)}
        id={base?.id}
        isEditor
        appId={metadata?.waitlistAppId}
        isOnlyWaitlist={true}
        {...overlayProps}
      />
    </>
  );
};
