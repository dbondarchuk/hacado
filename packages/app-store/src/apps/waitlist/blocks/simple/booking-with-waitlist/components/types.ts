import { FlowOrder } from "./context";

export type BookingWithWaitlistProps = {
  successPage?: string | null;
  flowOrder?: FlowOrder | null;
  className?: string;
};
