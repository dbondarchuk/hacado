import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BookingWithWaitlist } from "../booking-with-waitlist/components/booking";
import { WaitlistReaderProps } from "./schema";
import { styles } from "./styles";

export const WaitlistReader = ({
  props,
  style,
  args,
  isEditor,
  ...rest
}: WaitlistReaderProps) => {
  const className = generateClassName();
  const base = rest.block.base;
  const metadata = rest.block.metadata;
  const appId = metadata?.waitlistAppId;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      {isEditor && <ReplaceOriginalColors />}
      <BookingWithWaitlist
        className={cn(className, base?.className)}
        id={base?.id}
        appId={appId}
        isOnlyWaitlist={true}
      />
    </>
  );
};
