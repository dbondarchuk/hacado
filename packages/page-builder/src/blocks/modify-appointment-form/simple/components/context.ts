import {
  ApplyGiftCardsSuccessResponse,
  Availability,
  CollectPayment,
  DateTime,
  ModifyAppointmentInformation,
} from "@hacado/types";
import { DateTime as LuxonDateTime } from "luxon";
import { createContext, FC, ReactNode, useContext } from "react";
import { ModifyAppointmentFields, ModifyAppointmentType } from "../../types";

export type StepType =
  | "form"
  | "type"
  | "otp"
  | "calendar"
  | "confirmation"
  | "success"
  | "payment"
  | "notAllowed";

export type StepDirectionButton = {
  action: (ctx: ModifyAppointmentFormContextProps) => void | Promise<void>;
  isEnabled: (ctx: ModifyAppointmentFormContextProps) => boolean;
  show: (ctx: ModifyAppointmentFormContextProps) => boolean;
};

export type Step = {
  next: StepDirectionButton;
  prev: StepDirectionButton;
  Content: FC | (() => ReactNode);
};

export type ModifyAppointmentFormContextProps = {
  dateTime?: DateTime;
  setDateTime: (dateTime?: DateTime) => void;

  newDateTime?: LuxonDateTime;

  type: ModifyAppointmentType;
  setType: (type: ModifyAppointmentType) => void;

  appointment?: ModifyAppointmentInformation;
  setAppointment: (appointment?: ModifyAppointmentInformation) => void;
  fetchAppointment: () => Promise<ModifyAppointmentInformation>;

  fields: ModifyAppointmentFields;
  setFields: (fields: ModifyAppointmentFields) => void;

  isFormValid: boolean;
  setIsFormValid: (isValid: boolean) => void;

  availability: Availability;
  fetchAvailability: (
    appointment: ModifyAppointmentInformation | undefined,
  ) => Promise<void>;

  step: StepType;
  setStep: (step: StepType) => void;

  confirmedByUser: boolean;
  setConfirmedByUser: (confirmedByUser: boolean) => void;

  timeZone: string;
  setTimeZone: (timeZone: string) => void;

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

  goBack?: () => void;

  /** Optional paymentIntentId avoids stale state right after a paid intent is reused. */
  onSubmit: (paymentIntentId?: string) => void;

  className?: string;

  isEditor?: boolean;

  isOtpVerified: boolean;
  setIsOtpVerified: (verified: boolean) => void;
};

export const ModifyAppointmentFormContext =
  createContext<ModifyAppointmentFormContextProps>(null as any);

export const useModifyAppointmentFormContext = () => {
  return useContext(ModifyAppointmentFormContext);
};
