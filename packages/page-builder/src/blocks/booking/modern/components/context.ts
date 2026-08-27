import { TranslationKeys } from "@hacado/i18n";
import {
  ActiveStaffOption,
  ApplyDiscountResponse,
  ApplyGiftCardsSuccessResponse,
  AppointmentAddon,
  AppointmentChoice,
  AppointmentFields,
  AppointmentPackage,
  Availability,
  BookingCatalogNode,
  CheckDuplicateAppointmentsResponse,
  CollectPayment,
  DateTime,
  effectiveAddonDuration,
  effectiveAddonPrice,
  Fields,
  getActiveStaffAcrossAssignments,
  PublicStaffMember,
  WithLabelFieldData,
} from "@hacado/types";
import { DateTime as LuxonDateTime } from "luxon";
import { createContext, FC, ReactNode, useContext } from "react";
import { getBookingSteps, ScheduleSteps } from "./steps";

export type FlowOrder = "service-first" | "specialist-first";

export type StepType =
  | "option"
  | "specialist"
  | "addons"
  | "calendar"
  | "form"
  | "otp"
  | "payment"
  | "review";

export type StepDirectionButton = {
  action: (ctx: ScheduleContextProps) => void | Promise<void>;
  isEnabled: (ctx: ScheduleContextProps) => boolean;
  show: (ctx: ScheduleContextProps) => boolean;
  text?: TranslationKeys;
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

  availability: Availability;
  /** Optional memberId override avoids stale state right after setSelectedMemberId. */
  fetchAvailability: (
    memberId?: string | null,
    durationOverride?: number,
  ) => Promise<void>;

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

  /** Optional paymentIntentId avoids stale state right after a paid intent is reused. */
  onSubmit: (paymentIntentId?: string) => void;

  paymentInformation?: CollectPayment | null;
  setPaymentInformation: (form?: CollectPayment | null) => void;
  fetchPaymentInformation: () => Promise<CollectPayment | null>;

  handleNewBooking: () => void;

  isBookingRestricted?: boolean;

  isEditor?: boolean;

  catalog?: BookingCatalogNode[];
  catalogPath: string[];
  setCatalogPath: (path: string[]) => void;
  packages?: AppointmentPackage[];
  purchasePackageId?: string;
  setPurchasePackageId: (id?: string) => void;
  customerPackageId?: string;
  setCustomerPackageId: (id?: string) => void;
  /** User chose “book with my package” on the service step. */
  packageBookingFlow: boolean;
  setPackageBookingFlow: (enabled: boolean) => void;
  /** Package redeem path is locked (skip option/addon UI after package pick). */
  isCustomerPackageLocked: boolean;
  requireCustomerOtp?: boolean;
  hasActiveCustomerPackages?: boolean;
  otpVerified: boolean;
  setOtpVerified: (verified: boolean) => void;
  /** Where OTP should return after verify. */
  otpReturnStep: "packages" | "review" | "payment";
  setOtpReturnStep: (step: "packages" | "review" | "payment") => void;
  otpDialogOpen: boolean;
  setOtpDialogOpen: (open: boolean) => void;
  refreshBookingOptions?: () => Promise<void>;
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
  selectedAppointmentOption,
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

const getAppointmentPrice = (ctx: ScheduleContextProps) => {
  return Math.max(
    0,
    getAppointmentBasePrice(ctx) - getAppointmentDiscountAmount(ctx),
  );
};

export const useScheduleContext = () => {
  const ctx = useContext(ScheduleContext);
  const steps = getBookingSteps(ctx.flowOrder);
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

  const staffAcrossOptions: PublicStaffMember[] =
    getActiveStaffAcrossAssignments(
      ctx.appointmentOptions.map((o) => o.staff),
      ctx.members,
    );

  return {
    ...baseCtx,
    basePrice: getAppointmentBasePrice(baseCtx),
    discountAmount: getAppointmentDiscountAmount(baseCtx),
    price: getAppointmentPrice(baseCtx),
    currentStepIndex,
    steps,
    step,
    selectedMember,
    staffAcrossOptions,
  };
};
