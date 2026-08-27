import { Calendar, CheckCircle2, CreditCard } from "lucide-react";
import { CalendarCard } from "./calendar-card";
import { CabinetModifyContextProps, Step, StepType } from "./context";
import { PaymentCard } from "./payment-card";
import { ReviewCard } from "./review-card";

export const CANCEL_STEPS: StepType[] = ["review", "payment"];
export const RESCHEDULE_STEPS: StepType[] = ["calendar", "review", "payment"];

const handleGoToPayment = async (ctx: CabinetModifyContextProps) => {
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

export const CabinetModifySteps: Record<StepType, Step> = {
  calendar: {
    prev: {
      show: () => true,
      isEnabled: () => true,
      action: () => {
        window.location.hash = "";
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
          window.location.hash = "";
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
