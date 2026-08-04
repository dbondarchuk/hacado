import {
  Calendar,
  CheckCircle2,
  CreditCard,
  HeartPlus,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { AddonsCard } from "./addons-card";
import { CalendarCard } from "./calendar-card";
import { FlowOrder, FlowType, ScheduleContextProps, Step, StepType } from "./context";
import { FormCard } from "./form-card";
import { AppointmentOptionCard } from "./option-card";
import { PaymentCard } from "./payment-card";
import { ReviewCard } from "./review-card";
import { SpecialistCard } from "./specialist-card";
import { WaitlistFormCard } from "./waitlist-form-card";
import { WaitlistReviewCard } from "./waitlist-review-card";

export function getSteps(flow: FlowType, flowOrder: FlowOrder): StepType[] {
  const tail: StepType[] =
    flow === "waitlist"
      ? ["addons", "waitlist-form", "waitlist-review"]
      : ["addons", "calendar", "form", "review", "payment"];

  if (flowOrder === "specialist-first") {
    return ["specialist", "option", ...tail];
  }

  return ["option", "specialist", ...tail];
}

const handleGoToPayment = async (ctx: ScheduleContextProps) => {
  try {
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

/** Goes to "addons" (if any), or fetches availability and goes to "calendar"/"waitlist-form". */
const goToStepAfterSpecialist = async (ctx: ScheduleContextProps) => {
  if (ctx.selectedAppointmentOption?.addons?.length) {
    ctx.setCurrentStep("addons");
    return;
  }

  if (ctx.flow === "waitlist") {
    ctx.setCurrentStep("waitlist-form");
    return;
  }

  ctx.setCurrentStep("calendar");
  await ctx.fetchAvailability();
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
      show: (ctx) => ctx.flowOrder === "specialist-first",
      isEnabled: () => true,
      action: ({ setCurrentStep }) => setCurrentStep("specialist"),
    },
    next: {
      show: () => true,
      isEnabled: (ctx) => !!ctx.selectedAppointmentOption && !!ctx.duration,
      action: async (ctx) => {
        if (ctx.flowOrder !== "specialist-first") {
          if (ctx.activeStaff.length > 1) {
            ctx.setCurrentStep("specialist");
            return;
          }
          if (ctx.activeStaff.length === 1) {
            ctx.setSelectedMemberId(ctx.activeStaff[0].member.id);
          } else {
            ctx.setSelectedMemberId(null);
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
      action: async ({ fetchAvailability, setCurrentStep, flow }) => {
        if (flow === "waitlist") {
          setCurrentStep("waitlist-form");
          return;
        }

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
        if (ctx.selectedAppointmentOption?.addons?.length) {
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
      text: "block.buttons.confirm",
    },
    Content: ReviewCard,
  },
  "waitlist-form": {
    icon: User,
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: (ctx) => {
        if (ctx.selectedAppointmentOption?.addons?.length) {
          ctx.setCurrentStep("addons");
          return;
        }

        goToStepBeforeAddons(ctx);
      },
    },
    next: {
      show: () => true,
      isEnabled: ({ isFormValid }) => isFormValid,
      action: ({ setCurrentStep }) => setCurrentStep("waitlist-review"),
    },
    Content: WaitlistFormCard,
  },
  "waitlist-review": {
    icon: CheckCircle2,
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep }) => setCurrentStep("waitlist-form"),
    },
    next: {
      show: () => true,
      isEnabled: ({ isFormValid }) => isFormValid,
      action: ({ onWaitlistSubmit }) => onWaitlistSubmit(),
    },
    Content: WaitlistReviewCard,
  },
};
