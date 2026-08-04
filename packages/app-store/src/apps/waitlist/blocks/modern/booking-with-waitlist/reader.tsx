import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
import { BookingWithWaitlist } from "./components/booking";
import { BookingWithWaitlistReaderProps } from "./schema";
import { styles } from "./styles";

export const BookingWithWaitlistReader = ({
  props,
  style,
  args,
  isEditor,
  ...rest
}: BookingWithWaitlistReaderProps) => {
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
        successPage={props.confirmationPage}
        flowOrder={props.flowOrder}
        id={base?.id}
        isOnlyWaitlist={false}
        appId={appId}
        hideTitle={props.hideTitle}
        hideSteps={props.hideSteps}
        scrollToTop={props.scrollToTop}
      />
    </>
  );
};
