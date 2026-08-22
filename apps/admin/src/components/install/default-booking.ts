import {
  AppointmentCancellationRescheduleConfiguration,
  appointmentCancellationRescheduleSchema,
  BookingConfiguration,
  bookingConfigurationSchema,
} from "@hacado/types";

/** Customer-friendly defaults when the install wizard enables cancel/reschedule. */
export function getInstallEnabledCancellationsAndReschedules(): AppointmentCancellationRescheduleConfiguration {
  return appointmentCancellationRescheduleSchema.parse({
    cancellations: {
      withDeposit: {
        enabled: true,
        defaultPolicy: { action: "fullRefund" },
      },
      withoutDeposit: {
        enabled: true,
        defaultPolicy: { action: "allowed" },
      },
    },
    reschedules: {
      enabled: true,
      defaultPolicy: { action: "allowed" },
    },
  });
}

export function getDefaultBookingConfiguration(): BookingConfiguration {
  return bookingConfigurationSchema.parse({
    allowPromoCode: "allow-if-has-active",
    payments: { enabled: false },
    cancellationsAndReschedules: {
      cancellations: {
        withDeposit: { enabled: false },
        withoutDeposit: { enabled: false },
      },
      reschedules: { enabled: false },
    },
    catalog: [],
    slotStart: 15,
    maxWeeksInFuture: 8,
    minHoursBeforeBooking: 24,
    breakDuration: 30,
    autoConfirm: false,
  });
}
