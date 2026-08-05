import { TranslationKeys } from "@hacado/i18n";
import {
  ApplyGiftCardsSuccessResponse,
  Availability,
  CollectPayment,
  DateTime,
  ModifyAppointmentInformation,
  ModifyAppointmentType,
} from "@hacado/types";
import { DateTime as LuxonDateTime } from "luxon";
import { createContext, FC, ReactNode, useContext } from "react";
import { ModifyAppointmentFields } from "../../types";
import {
  CANCELLATIION_STEPS,
  CancelOrRescheduleSteps,
  RESCHEDULE_STEPS,
} from "./steps";

export type StepType =
  | "type"
  | "otp"
  | "form"
  | "calendar"
  | "review"
  | "payment";

export type StepDirectionButton = {
  action: (ctx: ModifyAppointmentFormContextProps) => void | Promise<void>;
  isEnabled: (ctx: ModifyAppointmentFormContextProps) => boolean;
  show: (ctx: ModifyAppointmentFormContextProps) => boolean;
  text?: TranslationKeys;
};

export type Step = {
  next: StepDirectionButton;
  prev: StepDirectionButton;
  Content: FC | (() => ReactNode);
  icon: React.ComponentType<{ className?: string }>;
};

export type ModifyAppointmentFormContextProps = {
  dateTime?: DateTime;
  setDateTime: (dateTime?: DateTime) => void;

  newDateTime?: LuxonDateTime;

  type: ModifyAppointmentType;
  setType: (type: ModifyAppointmentType) => void;

  appointment?: ModifyAppointmentInformation;
  setAppointment: (appointment?: ModifyAppointmentInformation) => void;
  fetchAppointment: () => Promise<ModifyAppointmentInformation | undefined>;

  fields: ModifyAppointmentFields;
  setFields: (fields: ModifyAppointmentFields) => void;

  isFormValid: boolean;
  setIsFormValid: (isValid: boolean) => void;

  availability: Availability;
  fetchAvailability: (
    appointment: ModifyAppointmentInformation | undefined,
  ) => Promise<void>;

  currentStep: StepType;
  setCurrentStep: (step: StepType) => void;

  // confirmedByUser: boolean;
  // setConfirmedByUser: (confirmedByUser: boolean) => void;

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

  searchError?: "notFound" | "notAllowed";
  setSearchError: (searchError?: "notFound" | "notAllowed") => void;

  isOtpVerified: boolean;
  setIsOtpVerified: (verified: boolean) => void;
};

export const ModifyAppointmentFormContext =
  createContext<ModifyAppointmentFormContextProps>(null as any);

export const useModifyAppointmentFormContext = () => {
  const ctx = useContext(ModifyAppointmentFormContext);
  const steps = ctx.type === "cancel" ? CANCELLATIION_STEPS : RESCHEDULE_STEPS;
  const currentStepIndex = steps.indexOf(ctx.currentStep);
  const step = CancelOrRescheduleSteps[ctx.currentStep];

  return {
    ...ctx,
    step,
    currentStepIndex,
    steps,
  };
};
