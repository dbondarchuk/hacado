import { FlowOrder } from "./context";

export type BookingProps = {
  successPage?: string | null;
  flowOrder?: FlowOrder | null;
  dontAllowAnySpecialist?: boolean | null;
  lockServiceId?: string | null;
  lockMemberId?: string | null;
  className?: string;
};
