import { CalendarCard } from "./calendar-card";
import { ConfirmationCard } from "./confirmation-card";
import { ModifyAppointmentFormContextProps, Step, StepType } from "./context";
import { FormCard } from "./form-card";
import { NotAllowedCard } from "./not-allowed-card";
import { OtpCard } from "./otp-card";
import { PaymentCard } from "./payment-card";
import { SuccessCard } from "./success-card";
import { TypeCard } from "./type-card";

const handleGoToPayment = async (ctx: ModifyAppointmentFormContextProps) => {
  try {
    const payment = await ctx.fetchPaymentInformation();
    ctx.setPaymentInformation(payment);

    if (!payment || payment.intent?.status === "paid") {
      ctx.onSubmit(payment?.intent?._id);
    } else {
      ctx.setStep("payment");
    }
  } catch (e) {
    console.error(e);
  }
};

export const CancelOrRescheduleSteps: Record<StepType, Step> = {
  type: {
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
    Content: TypeCard,
  },
  otp: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => setStep("type"),
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: OtpCard,
  },
  notAllowed: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => {
        setStep("form");
      },
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: NotAllowedCard,
  },
  form: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep, isOtpVerified }) => {
        setStep(isOtpVerified ? "type" : "otp");
      },
    },
    next: {
      show: () => true,
      isEnabled: ({ isFormValid }) => isFormValid,
      action: async ({
        fetchAppointment,
        setAppointment,
        setStep,
        fetchAvailability,
        type,
      }) => {
        const appointment = await fetchAppointment();
        if (!appointment) {
          return;
        }
        setAppointment(appointment);

        if (!appointment.allowed) {
          setStep("notAllowed");
          return;
        }

        if (type === "cancel") {
          setStep("confirmation");
          return;
        }

        await fetchAvailability(appointment);
        setStep("calendar");
      },
    },
    Content: FormCard,
  },
  calendar: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => {
        setStep("form");
      },
    },
    next: {
      show: () => true,
      isEnabled: ({ dateTime, isEditor }) => !!dateTime && !isEditor,
      action: ({ setStep }) => setStep("confirmation"),
    },
    Content: CalendarCard,
  },
  confirmation: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep, type }) =>
        setStep(type === "cancel" ? "form" : "calendar"),
    },
    next: {
      show: () => true,
      isEnabled: ({ confirmedByUser }) => confirmedByUser,
      action: (ctx) => {
        handleGoToPayment(ctx);
      },
    },
    Content: ConfirmationCard,
  },
  payment: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setStep }) => setStep("confirmation"),
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: PaymentCard,
  },
  success: {
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
    Content: SuccessCard,
  },
};
