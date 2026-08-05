import { ReaderDocumentBlocksDictionary } from "@hacado/builder";
import { BookingWithWaitlistReader as ModernBookingWithWaitlistReader } from "./modern/booking-with-waitlist/reader";
import { WaitlistReader as ModernWaitlistReader } from "./modern/waitlist/reader";
import type { WaitlistBlocksSchema } from "./schema";
import { BookingWithWaitlistReader as SimpleBookingWithWaitlistReader } from "./simple/booking-with-waitlist/reader";
import { WaitlistReader as SimpleWaitlistReader } from "./simple/waitlist/reader";

export const WaitlistReaders: ReaderDocumentBlocksDictionary<
  typeof WaitlistBlocksSchema
> = {
  WaitlistModern: {
    Reader: ModernWaitlistReader,
  },
  BookingModern: {
    Reader: ModernBookingWithWaitlistReader,
  },
  WaitlistSimple: {
    Reader: SimpleWaitlistReader,
  },
  BookingSimple: {
    Reader: SimpleBookingWithWaitlistReader,
  },
};
