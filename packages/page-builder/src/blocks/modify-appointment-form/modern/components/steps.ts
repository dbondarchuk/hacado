import {
  Calendar,
  CheckCircle2,
  CreditCard,
  KeyRound,
  RefreshCw,
  User,
} from "lucide-react";
import { CalendarCard } from "./calendar-card";
import { ModifyAppointmentFormContextProps, Step, StepType } from "./context";
import { FormCard } from "./form-card";
import { OtpCard } from "./otp-card";
import { PaymentCard } from "./payment-card";
import { ReviewCard } from "./review-card";
import { TypeCard } from "./type-card";

export const CANCELLATIION_STEPS: StepType[] = [
  "type",
  "otp",
  "form",
  "review",
  "payment",
];

export const RESCHEDULE_STEPS: StepType[] = [
  "type",
  "otp",
  "form",
  "calendar",
  "review",
  "payment",
];

const handleGoToPayment = async (ctx: ModifyAppointmentFormContextProps) => {
  try {
    const payment = await ctx.fetchPaymentInformation();
    ctx.setPaymentInformation(payment);

    if (!payment || payment.intent?.status === "paid") {
      ctx.onSubmit(payment?.intent?._id);
    } else {
      ctx.setCurrentStep("payment");
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
      show: () => true,
      isEnabled: ({ type }) => !!type,
      action: ({ setCurrentStep, isOtpVerified }) => {
        setCurrentStep(isOtpVerified ? "form" : "otp");
      },
    },
    Content: TypeCard,
    icon: RefreshCw,
  },
  otp: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep }) => setCurrentStep("type"),
    },
    next: {
      show: () => false,
      isEnabled: () => false,
      action: () => {},
    },
    Content: OtpCard,
    icon: KeyRound,
  },
  form: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep, isOtpVerified }) => {
        setCurrentStep(isOtpVerified ? "type" : "otp");
      },
    },
    next: {
      show: () => true,
      isEnabled: ({ isFormValid }) => isFormValid,
      action: async ({
        fetchAppointment,
        setAppointment,
        setCurrentStep,
        fetchAvailability,
        type,
        setSearchError,
      }) => {
        setSearchError(undefined);
        const appointment = await fetchAppointment();
        setAppointment(appointment);

        if (!appointment) {
          setSearchError("notFound");
          return;
        }

        if (!appointment.allowed) {
          setSearchError("notAllowed");
          return;
        }

        if (type === "cancel") {
          setCurrentStep("review");
          return;
        }

        await fetchAvailability(appointment);
        setCurrentStep("calendar");
      },
    },
    Content: FormCard,
    icon: User,
  },
  calendar: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep, setDateTime, setAppointment }) => {
        setDateTime(undefined);
        setAppointment(undefined);
        setCurrentStep("form");
      },
    },
    next: {
      show: () => true,
      isEnabled: ({ dateTime, isEditor }) => !!dateTime && !isEditor,
      action: ({ setCurrentStep }) => setCurrentStep("review"),
    },
    Content: CalendarCard,
    icon: Calendar,
  },
  review: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: ({ setCurrentStep, setAppointment, type }) => {
        if (type === "cancel") {
          setCurrentStep("form");
          setAppointment(undefined);
          return;
        }
        setCurrentStep("calendar");
      },
    },
    next: {
      show: () => true,
      isEnabled: () => true,
      action: (ctx) => {
        handleGoToPayment(ctx);
      },
      text: "modification.review.confirm",
    },
    Content: ReviewCard,
    icon: CheckCircle2,
  },
  payment: {
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
    icon: CreditCard,
  },
};
