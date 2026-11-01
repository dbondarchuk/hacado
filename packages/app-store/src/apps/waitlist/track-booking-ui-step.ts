import { bookingApi } from "@hacado/api-sdk/client/booking";
import type { BookingTrackingMetadata } from "@hacado/types/booking";

/** Waitlist wizard screens that core booking tracking does not know about. */
const WAITLIST_UI_STEP_TRACKING = {
  "waitlist-form": "FORM_FILLED",
} as const;

export function trackWaitlistBookingUiStep(
  uiStep: string,
  metadata?: BookingTrackingMetadata,
) {
  if (uiStep === "waitlist-form") {
    void bookingApi.trackStep(
      WAITLIST_UI_STEP_TRACKING["waitlist-form"],
      metadata,
    );

    return;
  }

  bookingApi.trackAdvanceFromUiStep(uiStep, metadata);
}
