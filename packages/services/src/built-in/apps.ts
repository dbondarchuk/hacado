import { AppScope, IServicesContainer } from "@hacado/types";
import { BuiltInBookingTrackingApp } from "../booking-tracking/app";
import { BOOKING_TRACKING_APP_ID } from "../booking-tracking/const";

export const BuiltInApps: Record<
  string,
  {
    scopes?: AppScope[];
    scheduled?: boolean;
    getService: new (
      organizationId: string,
      services: IServicesContainer,
    ) => any;
  }
> = {
  [BOOKING_TRACKING_APP_ID]: {
    scopes: ["event-subscriber"],
    scheduled: true,
    getService: BuiltInBookingTrackingApp,
  },
};
