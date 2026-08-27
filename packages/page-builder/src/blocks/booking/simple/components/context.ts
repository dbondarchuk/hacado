import {
  ActiveStaffOption,
  ApplyDiscountResponse,
  ApplyGiftCardsSuccessResponse,
  AppointmentAddon,
  AppointmentChoice,
  AppointmentFields,
  AppointmentPackage,
  Availability,
  CheckDuplicateAppointmentsResponse,
  CollectPayment,
  DateTime,
  effectiveAddonDuration,
  effectiveAddonPrice,
  Fields,
  PublicStaffMember,
  WithLabelFieldData,
} from "@hacado/types";
import { DateTime as LuxonDateTime } from "luxon";
import { createContext, FC, ReactNode, useContext } from "react";

export type FlowOrder = "service-first" | "specialist-first";

export type StepType =
  | "duration"
  | "specialist"
  | "addons"
  | "calendar"
  | "form"
  | "otp"
  | "payment"
  | "confirmation"
  | "duplicate-appointments-confirmation";

export type StepDirectionButton = {
  action: (ctx: ScheduleContextProps) => void | Promise<void>;
  isEnabled: (ctx: ScheduleContextProps) => boolean;
  show: (ctx: ScheduleContextProps) => boolean;
};

export type Step = {
  next: StepDirectionButton;
  prev: StepDirectionButton;
  Content: FC | (() => ReactNode);
};

export type ScheduleContextProps = {
  appointmentOption: AppointmentChoice;
  useClientTimezone?: boolean;

  /** Active org staff members, for resolving `appointmentOption.staff` assignments. */
  members: PublicStaffMember[];
  flowOrder: FlowOrder;

  selectedMemberId: string | null;
  setSelectedMemberId: (memberId: string | null) => void;
  /**
   * Whether the specialist was already chosen before this service (specialist-first
   * flow), in which case the in-schedule "specialist" step is skipped entirely.
   */
  preselectedMemberId?: string | null;
  activeStaff: ActiveStaffOption[];
  showSpecialistStep: boolean;

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

  availability: Availability;
  /** Optional memberId override avoids stale state right after setSelectedMemberId. */
  fetchAvailability: (memberId?: string | null) => Promise<void>;

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

  step: StepType;
  setStep: (step: StepType) => void;

  goBack?: () => void;

  /** Optional paymentIntentId avoids stale state right after a paid intent is reused. */
  onSubmit: (paymentIntentId?: string) => void;

  timeZone: string;

  paymentInformation?: CollectPayment | null;
  setPaymentInformation: (form?: CollectPayment | null) => void;
  fetchPaymentInformation: () => Promise<CollectPayment | null>;

  className?: string;

  isBookingRestricted?: boolean;

  isEditor?: boolean;

  purchasePackageId?: string;
  customerPackageId?: string;
  isCustomerPackageLocked?: boolean;
  packages?: AppointmentPackage[];
  requireCustomerOtp?: boolean;
  otpVerified: boolean;
  setOtpVerified: (verified: boolean) => void;
  otpDialogOpen: boolean;
  setOtpDialogOpen: (open: boolean) => void;
};

export const ScheduleContext = createContext<ScheduleContextProps>(null as any);

const getAppointmentDuration = ({
  duration,
  appointmentOption,
  selectedAddons,
  selectedMemberId,
  activeStaff,
}: ScheduleContextProps) => {
  const selectedStaff = selectedMemberId
    ? activeStaff.find((s) => s.member.id === selectedMemberId)
    : undefined;

  let baseDuration =
    appointmentOption?.durationType === "fixed"
      ? (selectedStaff?.assignment.durationOverride ?? duration)
      : duration;
  if (!baseDuration && appointmentOption) {
    if (appointmentOption.durationType === "fixed") {
      baseDuration = appointmentOption.duration;
    } else {
      baseDuration = appointmentOption.durationMin;
    }
  }

  if (!baseDuration) return 0;

  return (
    baseDuration +
    (selectedAddons || []).reduce(
      (sum, addon) =>
        sum +
        (effectiveAddonDuration(
          addon.duration,
          addon.staff,
          selectedMemberId,
        ) || 0),
      0,
    )
  );
};

const getAppointmentBasePrice = ({
  appointmentOption,
  selectedAddons,
  duration,
  selectedMemberId,
  activeStaff,
  purchasePackageId,
  customerPackageId,
  packages,
}: ScheduleContextProps) => {
  const addonsPrice = (selectedAddons || []).reduce(
    (sum, addon) =>
      sum +
      (effectiveAddonPrice(addon.price, addon.staff, selectedMemberId) || 0),
    0,
  );

  if (purchasePackageId) {
    const pkg = packages?.find((item) => item._id === purchasePackageId);
    return (pkg?.price ?? 0) + addonsPrice;
  }

  if (customerPackageId) {
    return addonsPrice;
  }

  let basePrice = 0;
  if (appointmentOption) {
    const selectedStaff = selectedMemberId
      ? activeStaff.find((s) => s.member.id === selectedMemberId)
      : undefined;

    if (appointmentOption.durationType === "fixed") {
      basePrice = selectedStaff?.effectivePrice ?? appointmentOption.price ?? 0;
    } else {
      const pricePerHour =
        selectedStaff?.effectivePrice ?? appointmentOption.pricePerHour ?? 0;
      basePrice = (pricePerHour / 60) * (duration || 0);
    }
  }

  return basePrice + addonsPrice;
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

export const getAppointmentPrice = (ctx: ScheduleContextProps) => {
  return Math.max(
    0,
    getAppointmentBasePrice(ctx) - getAppointmentDiscountAmount(ctx),
  );
};

export const useScheduleContext = () => {
  const ctx = useContext(ScheduleContext);

  const selectedMember =
    ctx.activeStaff.find((s) => s.member.id === ctx.selectedMemberId) ?? null;

  const baseDuration =
    (ctx.appointmentOption?.durationType === "fixed"
      ? selectedMember?.assignment.durationOverride
      : undefined) ??
    ctx.duration ??
    (ctx.appointmentOption?.durationType === "fixed"
      ? ctx.appointmentOption?.duration
      : ctx.appointmentOption?.durationMin);

  const baseCtx = {
    ...ctx,
    baseDuration,
    duration: getAppointmentDuration(ctx),
  };

  return {
    ...baseCtx,
    basePrice: getAppointmentBasePrice(baseCtx),
    discountAmount: getAppointmentDiscountAmount(baseCtx),
    price: getAppointmentPrice(baseCtx),
    selectedMember,
  };
};
