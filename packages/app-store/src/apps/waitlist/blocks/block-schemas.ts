import { BookingWithWaitlistPropsSchema as ModernBookingWithWaitlistPropsSchema } from "./modern/booking-with-waitlist/schema";
import { WaitlistPropsSchema as ModernWaitlistPropsSchema } from "./modern/waitlist/schema";
import { BookingWithWaitlistPropsSchema as SimpleBookingWithWaitlistPropsSchema } from "./simple/booking-with-waitlist/schema";
import { WaitlistPropsSchema as SimpleWaitlistPropsSchema } from "./simple/waitlist/schema";

export const WaitlistBlocksSchema = {
  WaitlistModern: ModernWaitlistPropsSchema,
  BookingModern: ModernBookingWithWaitlistPropsSchema,
  WaitlistSimple: SimpleWaitlistPropsSchema,
  BookingSimple: SimpleBookingWithWaitlistPropsSchema,
};

export const WaitlistBlocksAllowedInFooter = {
  WaitlistModern: false,
  BookingModern: false,
  WaitlistSimple: false,
  BookingSimple: false,
};
