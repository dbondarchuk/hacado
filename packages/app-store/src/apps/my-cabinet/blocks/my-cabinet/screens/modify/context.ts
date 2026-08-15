import type {
  ApplyGiftCardsSuccessResponse,
  Availability,
  CollectPayment,
  DateTime,
  ModifyAppointmentInformation,
  ModifyAppointmentType,
} from "@hacado/types";
import { DateTime as LuxonDateTime } from "luxon";
import { createContext, FC, ReactNode, useContext } from "react";
import { CabinetModifySteps, CANCEL_STEPS, RESCHEDULE_STEPS } from "./steps";

export type StepType = "calendar" | "review" | "payment";

export type StepDirectionButton = {
  action: (ctx: CabinetModifyContextProps) => void | Promise<void>;
  isEnabled: (ctx: CabinetModifyContextProps) => boolean;
  show: (ctx: CabinetModifyContextProps) => boolean;
  text?: string;
};

export type Step = {
  next: StepDirectionButton;
  prev: StepDirectionButton;
  Content: FC | (() => ReactNode);
  icon: React.ComponentType<{ className?: string }>;
};

export type CabinetModifyContextProps = {
  appId: string;
  type: ModifyAppointmentType;

  appointmentEmail?: string;

  dateTime?: DateTime;
  setDateTime: (dateTime?: DateTime) => void;
  newDateTime?: LuxonDateTime;

  appointment?: ModifyAppointmentInformation;
  setAppointment: (appointment?: ModifyAppointmentInformation) => void;

  availability: Availability;
  fetchAvailability: (
    appointment: ModifyAppointmentInformation | undefined,
  ) => Promise<void>;

  currentStep: StepType;
  setCurrentStep: (step: StepType) => void;

  paymentInformation?: CollectPayment | null;
  setPaymentInformation: (form?: CollectPayment | null) => void;
  fetchPaymentInformation: () => Promise<CollectPayment | null>;

  giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
  setGiftCards: (
    giftCards: ApplyGiftCardsSuccessResponse["giftCards"] | undefined,
  ) => void;
  applyGiftCards: (
    codes: string[],
    amount: number,
  ) => Promise<ApplyGiftCardsSuccessResponse["giftCards"] | undefined>;

  onSubmit: () => void;
  isModificationConfirmed: boolean;

  className?: string;
  isEditor?: boolean;

  timeZone: string;
  setTimeZone: (timeZone: string) => void;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

export const CabinetModifyContext = createContext<CabinetModifyContextProps>(
  null as any,
);

export const useCabinetModifyContext = () => {
  const ctx = useContext(CabinetModifyContext);
  const steps = ctx.type === "cancel" ? CANCEL_STEPS : RESCHEDULE_STEPS;
  const currentStepIndex = steps.indexOf(ctx.currentStep);
  const step = CabinetModifySteps[ctx.currentStep];

  return {
    ...ctx,
    step,
    currentStepIndex,
    steps,
  };
};
