import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { Booking } from "./components/booking";
import { BookingReaderProps } from "./schema";
import { styles } from "./styles";

export const BookingReader = ({
  props,
  style,
  args,
  isEditor,
  ...rest
}: BookingReaderProps) => {
  const className = generateClassName();
  const base = rest.block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      {isEditor && <ReplaceOriginalColors />}
      <Booking
        className={cn(className, base?.className)}
        successPage={props.confirmationPage}
        id={base?.id}
        hideTitle={props.hideTitle}
        hideSteps={props.hideSteps}
        scrollToTop={props.scrollToTop}
        flowOrder={props.flowOrder}
        isEditor={isEditor}
      />
    </>
  );
};
