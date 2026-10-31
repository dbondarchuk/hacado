import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { BookingWithWaitlistProps } from "./schema";
import { bookingWithWaitlistShortcuts } from "./shortcuts";

export const BookingWithWaitlistToolbar = (
  props: ConfigurationProps<BookingWithWaitlistProps>,
) => (
  <ShortcutsToolbar
    shortcuts={bookingWithWaitlistShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
