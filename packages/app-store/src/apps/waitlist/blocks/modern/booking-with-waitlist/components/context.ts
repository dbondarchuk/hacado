import {
  ActiveStaffOption,
  ApplyDiscountResponse,
  ApplyGiftCardsSuccessResponse,
  AppointmentAddon,
  AppointmentChoice,
  AppointmentFields,
  Availability,
  CheckDuplicateAppointmentsResponse,
  CollectPayment,
  DateTime,
  Fields,
  getActiveStaffAcrossAssignments,
  PublicStaffMember,
  WithLabelFieldData,
} from "@hacado/types";
import { DateTime as LuxonDateTime } from "luxon";
import { createContext, FC, ReactNode, useContext, useMemo } from "react";
import { WaitlistDate } from "../../../../models/waitlist";
import { WaitlistPublicKeys } from "../../../../translations/types";
import { getSteps, ScheduleSteps } from "./steps";

export type StepType =
  | "option"
  | "specialist"
  | "addons"
  | "calendar"
  | "form"
  | "payment"
  | "review"
  // | "duplicate-appointments-confirmation"
  | "waitlist-form"
  | "waitlist-review";

export type FlowType = "booking" | "waitlist";
export type FlowOrder = "service-first" | "specialist-first";

export type StepDirectionButton = {
  action: (ctx: ScheduleContextProps) => void | Promise<void>;
  isEnabled: (ctx: ScheduleContextProps) => boolean;
  show: (ctx: ScheduleContextProps) => boolean;
  text?: WaitlistPublicKeys;
};

export type Step = {
  next: StepDirectionButton;
  prev: StepDirectionButton;
  Content: FC | (() => ReactNode);
  icon: React.ComponentType<{ className?: string }>;
};

export type ScheduleContextProps = {
  appointmentOptions: AppointmentChoice[];
  areAppointmentOptionsLoading: boolean;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  flow: FlowType;
  setFlow: (flow: FlowType) => void;

  /** Active org staff members, for resolving `appointmentOption.staff` assignments. */
  members: PublicStaffMember[];
  flowOrder: FlowOrder;
  selectedMemberId: string | null;
  setSelectedMemberId: (memberId: string | null) => void;
  activeStaff: ActiveStaffOption[];

  selectedAppointmentOption?: AppointmentChoice;
  setSelectedAppointmentOption: (option?: AppointmentChoice) => void;

  selectedAddons: AppointmentAddon[];
  setSelectedAddons: (addons: AppointmentAddon[]) => void;

  duration?: number;
  setDuration: (duration?: number) => void;

  dateTime?: DateTime;
  setDateTime: (dateTime?: DateTime) => void;

  fields: AppointmentFields;
  setFields: (fields: AppointmentFields) => void;
  formFields: Fields<WithLabelFieldData>;

  isFormValid: boolean;
  setIsFormValid: (isValid: boolean) => void;

  waitlistTimes: { asSoonAsPossible: boolean; dates?: WaitlistDate[] };
  setWaitlistTimes: (times: {
    asSoonAsPossible: boolean;
    dates?: WaitlistDate[];
  }) => void;

  availability: Availability;
  fetchAvailability: () => Promise<void>;

  checkDuplicateAppointments: () => Promise<CheckDuplicateAppointmentsResponse>;
  closestDuplicateAppointment?: LuxonDateTime;
  duplicateAppointmentDoNotAllowScheduling?: boolean;
  setClosestDuplicateAppointment: (closestAppointment?: Date) => void;
  setDuplicateAppointmentDoNotAllowScheduling: (
    doNotAllowScheduling: boolean,
  ) => void;

  confirmDuplicateAppointment: boolean;
  setConfirmDuplicateAppointment: (
    confirmDuplicateAppointment: boolean,
  ) => void;

  showPromoCode?: boolean;
  discount?: ApplyDiscountResponse;
  setDiscount: (promoCode?: ApplyDiscountResponse) => void;

  giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
  setGiftCards: (giftCards: ApplyGiftCardsSuccessResponse["giftCards"]) => void;
  applyGiftCards: (
    codes: string[],
    amount: number,
  ) => Promise<ApplyGiftCardsSuccessResponse["giftCards"]>;

  currentStep: StepType;
  setCurrentStep: (step: StepType) => void;

  isBookingConfirmed: boolean;

  onSubmit: () => void;

  waitlistAppId?: string;

  paymentInformation?: CollectPayment | null;
  setPaymentInformation: (form?: CollectPayment | null) => void;
  fetchPaymentInformation: () => Promise<CollectPayment | null>;

  onWaitlistSubmit: () => Promise<void>;

  handleNewBooking: () => void;

  isOnlyWaitlist: boolean;

  isBookingRestricted?: boolean;

  isEditor?: boolean;
};

export const ScheduleContext = createContext<ScheduleContextProps>(null as any);

const getAppointmentDuration = ({
  duration,
  selectedAppointmentOption,
  selectedAddons,
  selectedMemberId,
  activeStaff,
}: ScheduleContextProps) => {
  const selectedStaff = selectedMemberId
    ? activeStaff.find((s) => s.member.id === selectedMemberId)
    : undefined;

  let baseDuration =
    selectedAppointmentOption?.durationType === "fixed"
      ? (selectedStaff?.assignment.durationOverride ?? duration)
      : duration;
  if (!baseDuration && selectedAppointmentOption) {
    if (selectedAppointmentOption.durationType === "fixed") {
      baseDuration = selectedAppointmentOption.duration;
    } else {
      baseDuration = selectedAppointmentOption.durationMin;
    }
  }

  if (!baseDuration) return 0;

  return (
    baseDuration +
    (selectedAddons || []).reduce(
      (sum, addon) => sum + (addon.duration || 0),
      0,
    )
  );
};

const getAppointmentBasePrice = ({
  selectedAppointmentOption,
  selectedAddons,
  duration,
  selectedMemberId,
  activeStaff,
}: ScheduleContextProps) => {
  let basePrice = 0;
  if (selectedAppointmentOption) {
    const selectedStaff = selectedMemberId
      ? activeStaff.find((s) => s.member.id === selectedMemberId)
      : undefined;

    if (selectedAppointmentOption.durationType === "fixed") {
      basePrice =
        selectedStaff?.effectivePrice ?? selectedAppointmentOption.price ?? 0;
    } else {
      const pricePerHour =
        selectedStaff?.effectivePrice ??
        selectedAppointmentOption.pricePerHour ??
        0;
      basePrice = (pricePerHour / 60) * (duration || 0);
    }
  }

  return (
    basePrice +
    (selectedAddons || []).reduce((sum, addon) => sum + (addon.price || 0), 0)
  );
};

const getAppointmentDiscountAmount = ({
  discount: promoCode,
  ...rest
}: ScheduleContextProps) => {
  if (!promoCode) return 0;

  const basePrice = getAppointmentBasePrice(rest);

  switch (promoCode.type) {
    case "amount":
      return Math.min(basePrice, promoCode.value);
    case "percentage":
      return Math.min(
        basePrice,
        parseFloat(((basePrice * promoCode.value) / 100).toFixed(2)),
      );
  }
};

const getAppointmentPrice = (ctx: ScheduleContextProps) => {
  return Math.max(
    0,
    getAppointmentBasePrice(ctx) - getAppointmentDiscountAmount(ctx),
  );
};

export const useScheduleContext = () => {
  const ctx = useContext(ScheduleContext);
  const steps = useMemo(
    () => getSteps(ctx.flow, ctx.flowOrder),
    [ctx.flow, ctx.flowOrder],
  );

  const currentStepIndex = steps.indexOf(ctx.currentStep);
  const step = ScheduleSteps[ctx.currentStep];

  const selectedMember =
    ctx.activeStaff.find((s) => s.member.id === ctx.selectedMemberId) ?? null;

  const baseDuration =
    (ctx.selectedAppointmentOption?.durationType === "fixed"
      ? selectedMember?.assignment.durationOverride
      : undefined) ??
    ctx.duration ??
    (ctx.selectedAppointmentOption?.durationType === "fixed"
      ? ctx.selectedAppointmentOption?.duration
      : ctx.selectedAppointmentOption?.durationMin);

  const baseCtx = {
    ...ctx,
    baseDuration,
    duration: getAppointmentDuration(ctx),
  };

  const price = getAppointmentPrice(baseCtx);

  const staffAcrossOptions: PublicStaffMember[] =
    getActiveStaffAcrossAssignments(
      ctx.appointmentOptions.map((o) => o.staff),
      ctx.members,
    );

  return {
    ...baseCtx,
    basePrice: getAppointmentBasePrice(baseCtx),
    discountAmount: getAppointmentDiscountAmount(baseCtx),
    price,
    currentStepIndex,
    steps,
    step,
    selectedMember,
    staffAcrossOptions,
  };
};
