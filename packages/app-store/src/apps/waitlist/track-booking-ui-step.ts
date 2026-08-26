import { clientApi } from "@hacado/api-sdk";
import type { BookingTrackingMetadata } from "@hacado/types";

/** Waitlist wizard screens that core booking tracking does not know about. */
const WAITLIST_UI_STEP_TRACKING = {
  "waitlist-form": "FORM_FILLED",
} as const;

export function trackWaitlistBookingUiStep(
  uiStep: string,
  metadata?: BookingTrackingMetadata,
) {
  if (uiStep === "waitlist-form") {
    void clientApi.booking.trackStep(
      WAITLIST_UI_STEP_TRACKING["waitlist-form"],
      metadata,
    );
    return;
  }
  clientApi.booking.trackAdvanceFromUiStep(uiStep, metadata);
}
