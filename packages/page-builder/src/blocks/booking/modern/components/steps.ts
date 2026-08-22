import { clientApi } from "@hacado/api-sdk";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  HeartPlus,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { AddonsCard } from "./addons-card";
import { CalendarCard } from "./calendar-card";
import { FlowOrder, ScheduleContextProps, Step, StepType } from "./context";
import { FormCard } from "./form-card";
import { AppointmentOptionCard } from "./option-card";
import { PaymentCard } from "./payment-card";
import { ReviewCard } from "./review-card";
import { SpecialistCard } from "./specialist-card";

export function getBookingSteps(flowOrder: FlowOrder): StepType[] {
  if (flowOrder === "specialist-first") {
    return [
      "specialist",
      "option",
      "addons",
      "calendar",
      "form",
      "review",
      "otp",
      "payment",
    ];
  }

  return [
    "option",
    "specialist",
    "addons",
    "calendar",
    "form",
    "review",
    "otp",
    "payment",
  ];
}

const handleGoToPayment = async (ctx: ScheduleContextProps) => {
  try {
    if (
      (ctx.requireCustomerOtp ||
        ctx.customerPackageId ||
        ctx.purchasePackageId) &&
      !ctx.otpVerified
    ) {
      const sessionMatches =
        await clientApi.customerAuth.sessionMatchesBookingFields(ctx.fields);
      if (!sessionMatches) {
        ctx.setOtpReturnStep("payment");
        ctx.setOtpDialogOpen(true);
        return;
      }
    }
    const payment = await ctx.fetchPaymentInformation();
    ctx.setPaymentInformation(payment);

    if (!payment || payment.intent?.status === "paid") {
      ctx.onSubmit();
    } else {
      ctx.setCurrentStep("payment");
    }
  } catch (e) {
    console.error(e);
  }
};

/** Resolves the member to use when the specialist step is skipped (sole staff). */
const resolveMemberIdForFetch = (ctx: ScheduleContextProps): string | null => {
  if (ctx.selectedMemberId) return ctx.selectedMemberId;
  if (ctx.activeStaff.length === 1) {
    const memberId = ctx.activeStaff[0].member.id;
    ctx.setSelectedMemberId(memberId);
    return memberId;
  }
  return null;
};

/** Goes to "addons" (if any) or fetches availability and goes to "calendar". */
const goToStepAfterSpecialist = async (ctx: ScheduleContextProps) => {
  if (
    ctx.selectedAppointmentOption?.addons?.length &&
    !ctx.purchasePackageId &&
    !ctx.customerPackageId
  ) {
    // Ensure sole staff is selected before addons so later availability has memberId.
    resolveMemberIdForFetch(ctx);
    ctx.setCurrentStep("addons");
    return;
  }

  const memberId = resolveMemberIdForFetch(ctx);
  ctx.setCurrentStep("calendar");
  await ctx.fetchAvailability(memberId);
};

/** Goes back to the step preceding "addons", accounting for the specialist step. */
const goToStepBeforeAddons = (ctx: ScheduleContextProps) => {
  if (ctx.flowOrder !== "specialist-first" && ctx.activeStaff.length > 1) {
    ctx.setCurrentStep("specialist");
    return;
  }

  ctx.setCurrentStep("option");
};

export const ScheduleSteps: Record<StepType, Step> = {
  option: {
    icon: Sparkles,
    prev: {
      show: (ctx) =>
        (ctx.packageBookingFlow && ctx.otpVerified) ||
        ctx.flowOrder === "specialist-first" ||
        (ctx.catalogPath?.length ?? 0) > 0,
      isEnabled: () => true,
      action: (ctx) => {
        if (ctx.packageBookingFlow && ctx.otpVerified) {
          ctx.setPackageBookingFlow(false);
          ctx.setCustomerPackageId(undefined);
          return;
        }
        if (ctx.catalogPath.length) {
          ctx.setCatalogPath(ctx.catalogPath.slice(0, -1));
          return;
        }
        ctx.setCurrentStep("specialist");
      },
    },
    next: {
      show: (ctx) => !(ctx.packageBookingFlow && ctx.otpVerified),
      isEnabled: (ctx) => !!ctx.selectedAppointmentOption && !!ctx.duration,
      action: async (ctx) => {
        if (ctx.flowOrder !== "specialist-first") {
          if (ctx.activeStaff.length > 1) {
            ctx.setCurrentStep("specialist");
            return;
          }
        }

        await goToStepAfterSpecialist(ctx);
      },
    },
    Content: AppointmentOptionCard,
  },
  specialist: {
    icon: Users,
    prev: {
      show: (ctx) => ctx.flowOrder !== "specialist-first",
      isEnabled: () => true,
      action: ({ setCurrentStep }) => setCurrentStep("option"),
    },
    next: {
      show: () => true,
      isEnabled: ({ selectedMemberId }) => !!selectedMemberId,
      action: async (ctx) => {
        if (ctx.flowOrder === "specialist-first") {
          ctx.setCurrentStep("option");
          return;
        }

        await goToStepAfterSpecialist(ctx);
      },
    },
    Content: SpecialistCard,
  },
  addons: {
    icon: HeartPlus,
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: (ctx) => goToStepBeforeAddons(ctx),
    },
    next: {
      show: () => true,
      isEnabled: () => true,
      action: async ({ fetchAvailability, setCurrentStep }) => {
        setCurrentStep("calendar");
        await fetchAvailability();
      },
    },
    Content: AddonsCard,
  },
  calendar: {
    icon: Calendar,
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: (ctx) => {
        if (ctx.isCustomerPackageLocked) {
          ctx.setCustomerPackageId(undefined);
          ctx.setSelectedAppointmentOption(undefined);
          ctx.setCurrentStep("option");
          return;
        }

        if (
          ctx.selectedAppointmentOption?.addons?.length &&
          !ctx.purchasePackageId &&
          !ctx.customerPackageId
        ) {
          ctx.setCurrentStep("addons");
          return;
        }

        goToStepBeforeAddons(ctx);
      },
    },
    next: {
      show: () => true,
      isEnabled: ({ dateTime }) => !!dateTime,
      action: ({ setCurrentStep }) => setCurrentStep("form"),
    },
    Content: CalendarCard,
  },
  form: {
    icon: User,
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep }) => setCurrentStep("calendar"),
    },
    next: {
      show: () => true,
      isEnabled: ({ isFormValid, isEditor }) => isFormValid && !isEditor,
      action: async (ctx) => {
        const optionNeedsDuplicateAppointmentsConfirmation =
          ctx.selectedAppointmentOption?.duplicateAppointmentCheck?.enabled;
        if (optionNeedsDuplicateAppointmentsConfirmation) {
          const closeAppointments = await ctx.checkDuplicateAppointments();
          if (closeAppointments.hasDuplicateAppointments) {
            ctx.setClosestDuplicateAppointment(
              closeAppointments.closestAppointment,
            );
            ctx.setDuplicateAppointmentDoNotAllowScheduling(
              closeAppointments.doNotAllowScheduling,
            );
          }
        }

        ctx.setCurrentStep("review");
      },
    },
    Content: FormCard,
  },
  otp: {
    icon: ShieldCheck,
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
    Content: () => null,
  },
  payment: {
    icon: CreditCard,
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep }) => setCurrentStep("review"),
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: PaymentCard,
  },
  review: {
    icon: CheckCircle2,
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep }) => setCurrentStep("form"),
    },
    next: {
      show: () => true,
      isEnabled: (ctx) => {
        return (
          !ctx.selectedAppointmentOption?.duplicateAppointmentCheck?.enabled ||
          !ctx.closestDuplicateAppointment ||
          ctx.confirmDuplicateAppointment
        );
      },

      action: (ctx) => handleGoToPayment(ctx),
      text: "common.buttons.confirmBooking",
    },
    Content: ReviewCard,
  },
};
