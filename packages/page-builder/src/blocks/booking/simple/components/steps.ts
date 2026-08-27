import { clientApi } from "@hacado/api-sdk";
import { AddonsCard } from "./addons-card";
import { CalendarCard } from "./calendar-card";
import { ConfirmationCard } from "./confirmation-card";
import { ScheduleContextProps, Step, StepType } from "./context";
import { DuplicateAppointmentConfirmationCard } from "./duplicate-appointment-confirmation-card";
import { DurationCard } from "./duration-card";
import { FormCard } from "./form-card";
import { OtpCard } from "./otp-card";
import { PaymentCard } from "./payment-card";
import { SpecialistCard } from "./specialist-card";

const handleGoToPayment = async (ctx: ScheduleContextProps) => {
  try {
    if (
      (ctx.requireCustomerOtp ||
        ctx.purchasePackageId ||
        ctx.customerPackageId) &&
      !ctx.otpVerified
    ) {
      const sessionMatches =
        await clientApi.customerAuth.sessionMatchesBookingFields(ctx.fields);
      if (!sessionMatches) {
        ctx.setOtpDialogOpen(true);
        return;
      }
    }
    const payment = await ctx.fetchPaymentInformation();
    ctx.setPaymentInformation(payment);

    if (!payment || payment.intent?.status === "paid") {
      ctx.onSubmit(payment?.intent?._id);
    } else {
      clientApi.booking.trackPaymentReached(payment.intent?.amount);
      ctx.setStep("payment");
    }
  } catch (e) {
    console.error(e);
  }
};

/** Goes back to the step preceding the (optional) "specialist" step. */
const goToStepBeforeSpecialist = (ctx: ScheduleContextProps) => {
  if (
    ctx.appointmentOption.durationType === "fixed" &&
    ctx.appointmentOption.duration &&
    ctx.goBack
  ) {
    ctx.goBack();
    return;
  }

  ctx.setStep("duration");
};

/** Goes back to the step preceding "addons", accounting for the specialist step. */
const goToStepBeforeAddons = (ctx: ScheduleContextProps) => {
  if (ctx.showSpecialistStep) {
    ctx.setStep("specialist");
    return;
  }

  goToStepBeforeSpecialist(ctx);
};

/** Resolves the member to use when the specialist step is skipped (sole staff). */
const resolveMemberIdForFetch = (ctx: ScheduleContextProps): string | null => {
  if (ctx.selectedMemberId || ctx.preselectedMemberId) {
    return ctx.selectedMemberId ?? ctx.preselectedMemberId ?? null;
  }
  if (ctx.activeStaff.length === 1) {
    const memberId = ctx.activeStaff[0].member.id;
    ctx.setSelectedMemberId(memberId);
    return memberId;
  }
  return null;
};

/** Resolves the assigned staff (if needed) then proceeds to addons/calendar. */
const goToStepAfterSpecialist = async (ctx: ScheduleContextProps) => {
  if (
    ctx.appointmentOption.addons?.length &&
    !ctx.purchasePackageId &&
    !ctx.customerPackageId
  ) {
    resolveMemberIdForFetch(ctx);
    ctx.setStep("addons");
    return;
  }

  const memberId = resolveMemberIdForFetch(ctx);
  await ctx.fetchAvailability(memberId);
  ctx.setStep("calendar");
};

export const ScheduleSteps: Record<StepType, Step> = {
  duration: {
    prev: {
      show: ({ goBack }) => !!goBack,
      isEnabled: () => true,
      action: ({ goBack }) => goBack?.(),
    },
    next: {
      show: () => true,
      isEnabled: ({ duration: optionDuration }) => !!optionDuration,
      action: async (ctx) => {
        if (ctx.showSpecialistStep) {
          ctx.setStep("specialist");
          return;
        }

        await goToStepAfterSpecialist(ctx);
      },
    },
    Content: DurationCard,
  },
  specialist: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: (ctx) => goToStepBeforeSpecialist(ctx),
    },
    next: {
      show: () => true,
      isEnabled: ({ selectedMemberId }) => !!selectedMemberId,
      action: async (ctx) => goToStepAfterSpecialist(ctx),
    },
    Content: SpecialistCard,
  },
  addons: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: (ctx) => goToStepBeforeAddons(ctx),
    },
    next: {
      show: () => true,
      isEnabled: () => true,
      action: ({ fetchAvailability, setStep }) => {
        fetchAvailability();
        setStep("calendar");
      },
    },
    Content: AddonsCard,
  },
  calendar: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: (ctx) => {
        if (ctx.isCustomerPackageLocked) {
          ctx.goBack?.();
          return;
        }
        if (
          ctx.appointmentOption.addons?.length &&
          !ctx.purchasePackageId &&
          !ctx.customerPackageId
        ) {
          ctx.setStep("addons");
          return;
        }

        goToStepBeforeAddons(ctx);
      },
    },
    next: {
      show: () => true,
      isEnabled: ({ dateTime }) => !!dateTime,
      action: ({ setStep }) => setStep("form"),
    },
    Content: CalendarCard,
  },
  form: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => setStep("calendar"),
    },
    next: {
      show: () => true,
      isEnabled: ({ isFormValid, isEditor }) => isFormValid && !isEditor,
      action: async (ctx) => {
        const optionNeedsDuplicateAppointmentsConfirmation =
          ctx.appointmentOption.duplicateAppointmentCheck?.enabled;
        if (optionNeedsDuplicateAppointmentsConfirmation) {
          const closeAppointments = await ctx.checkDuplicateAppointments();
          if (closeAppointments.hasDuplicateAppointments) {
            ctx.setClosestDuplicateAppointment(
              closeAppointments.closestAppointment,
            );
            ctx.setDuplicateAppointmentDoNotAllowScheduling(
              closeAppointments.doNotAllowScheduling,
            );
            ctx.setStep("duplicate-appointments-confirmation");
            return;
          }
        }

        handleGoToPayment(ctx);
      },
    },
    Content: FormCard,
  },
  otp: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => setStep("form"),
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: OtpCard,
  },
  payment: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => setStep("form"),
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: PaymentCard,
  },
  confirmation: {
    prev: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: ConfirmationCard,
  },
  "duplicate-appointments-confirmation": {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => setStep("form"),
    },
    next: {
      show: () => true,
      isEnabled: ({
        duplicateAppointmentDoNotAllowScheduling,
        confirmDuplicateAppointment,
      }) =>
        !duplicateAppointmentDoNotAllowScheduling &&
        confirmDuplicateAppointment,
      action: (ctx) => handleGoToPayment(ctx),
    },
    Content: DuplicateAppointmentConfirmationCard,
  },
};
