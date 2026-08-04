import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
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
        flowOrder={props.flowOrder}
        id={base?.id}
      />
    </>
  );
};
