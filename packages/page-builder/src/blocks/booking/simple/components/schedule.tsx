"use client";

import { clientApi, handleBookingSubmitError } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import type {
  ApplyGiftCardsSuccessResponse,
  AppointmentAddon,
  AppointmentChoice,
  AppointmentFields,
  AppointmentPackage,
  AppointmentRequest,
  CollectPayment,
  CreateOrUpdatePaymentIntentRequest,
  DateTime,
  FieldSchema,
  PublicStaffMember,
} from "@hacado/types";
import {
  ApplyDiscountResponse,
  Availability,
  BookingRestriction,
  CheckDuplicateAppointmentsResponse,
  effectiveAddonDuration,
  getActiveStaffForAssignments,
  isAddonAvailableForMember,
  isBookingLimitRestriction,
} from "@hacado/types";
import { Spinner, toast, useTimeZone } from "@hacado/ui";
import { DateTime as LuxonDateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { BookingRestrictionBanner } from "../../components/booking-restriction-banner";
import { BookingOtpDialog } from "../../components/otp-dialog";
import { FlowOrder, ScheduleContext, StepType } from "./context";
import { StepCard } from "./step-card";

export type ScheduleProps = {
  appointmentOption: AppointmentChoice;
  goBack?: () => void;
  successPage?: string;
  fieldsSchema: Record<string, FieldSchema>;
  showPromoCode?: boolean;
  bookingRestriction?: BookingRestriction;
  className?: string;
  id?: string;
  isEditor?: boolean;
  members: PublicStaffMember[];
  flowOrder: FlowOrder;
  /** Set when a specialist was already chosen before the service (specialist-first flow). */
  preselectedMemberId?: string | null;
  purchasePackageId?: string;
  customerPackageId?: string;
  isCustomerPackageLocked?: boolean;
  initialFields?: AppointmentFields;
  initialOtpVerified?: boolean;
  packages?: AppointmentPackage[];
  requireCustomerOtp?: boolean;
};

export const Schedule: React.FC<
  ScheduleProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  appointmentOption,
  goBack,
  successPage,
  fieldsSchema,
  showPromoCode,
  bookingRestriction,
  className,
  id,
  isEditor,
  members,
  flowOrder,
  preselectedMemberId,
  purchasePackageId,
  customerPackageId,
  isCustomerPackageLocked,
  initialFields,
  initialOtpVerified,
  packages,
  requireCustomerOtp,
  ...props
}) => {
  const i18n = useI18n("translation");
  const isBookingRestricted = isBookingLimitRestriction(bookingRestriction);
  const timeZone = useTimeZone();

  const errors = React.useMemo(
    () => ({
      fetchTitle: i18n("booking.availability.fetchFailedTitle"),
      fetchDescription: i18n("booking.availability.fetchFailedDescription"),
      fetchPaymentInformationTitle: i18n(
        "booking.payment.informationFetchFailedTitle",
      ),
      fetchPaymentInformationDescription: i18n(
        "booking.payment.informationFetchFailedDescription",
      ),
      submitTitle: i18n("booking.submitEvent.failedTitle"),
      submitDescription: i18n("booking.submitEvent.failedDescription"),
      timeNotAvailableDescription: i18n(
        "booking.submitEvent.timeNotAvailableDescription",
      ),
      limitReachedTitle: i18n("booking.submitEvent.limitReachedTitle"),
      limitReachedDescription: i18n(
        "booking.submitEvent.limitReachedDescription",
      ),
    }),
    [i18n],
  );

  const topRef = React.createRef<HTMLDivElement>();

  const appointmentOptionDuration =
    appointmentOption.durationType === "fixed"
      ? appointmentOption.duration
      : appointmentOption.durationMin;
  const [duration, setDuration] = React.useState<number | undefined>(
    appointmentOptionDuration,
  );
  const [otpVerified, setOtpVerified] = React.useState(!!initialOtpVerified);
  const [otpDialogOpen, setOtpDialogOpen] = React.useState(false);

  const [closestDuplicateAppointment, _setClosestDuplicateAppointment] =
    React.useState<LuxonDateTime | undefined>(undefined);

  const setClosestDuplicateAppointment = React.useCallback(
    (closestAppointment?: Date) => {
      _setClosestDuplicateAppointment(
        closestAppointment
          ? LuxonDateTime.fromJSDate(closestAppointment).setZone(timeZone)
          : undefined,
      );
    },
    [timeZone],
  );

  const [
    duplicateAppointmentDoNotAllowScheduling,
    setDuplicateAppointmentDoNotAllowScheduling,
  ] = React.useState<boolean | undefined>(undefined);

  const [promoCode, setPromoCode] = React.useState<ApplyDiscountResponse>();
  const [giftCards, setGiftCards] = React.useState<
    ApplyGiftCardsSuccessResponse["giftCards"]
  >([]);
  const [paymentInformation, setPaymentInformation] =
    React.useState<CollectPayment | null>();

  const optionBasePrice =
    appointmentOption.durationType === "fixed"
      ? appointmentOption.price
      : appointmentOption.pricePerHour;
  const optionBaseDuration =
    appointmentOption.durationType === "fixed"
      ? appointmentOption.duration
      : undefined;

  const activeStaff = React.useMemo(
    () =>
      getActiveStaffForAssignments(
        appointmentOption.staff,
        members,
        optionBasePrice,
        optionBaseDuration,
      ),
    [appointmentOption.staff, members, optionBasePrice, optionBaseDuration],
  );

  const showSpecialistStep = activeStaff.length > 1 && !preselectedMemberId;

  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(
    preselectedMemberId ??
      (activeStaff.length === 1 ? activeStaff[0].member.id : null),
  );

  const flexibleDurationMin =
    appointmentOption.durationType === "flexible"
      ? appointmentOption.durationMin
      : undefined;
  const fixedDuration =
    appointmentOption.durationType === "fixed"
      ? appointmentOption.duration
      : undefined;

  React.useEffect(() => {
    if (flexibleDurationMin == null) return;
    setDuration(flexibleDurationMin);
  }, [appointmentOption._id, flexibleDurationMin, setDuration]);

  React.useEffect(() => {
    if (appointmentOption.durationType !== "fixed") return;

    const selectedStaff = selectedMemberId
      ? activeStaff.find((s) => s.member.id === selectedMemberId)
      : undefined;

    setDuration(selectedStaff?.effectiveDuration ?? fixedDuration);
  }, [
    appointmentOption.durationType,
    fixedDuration,
    selectedMemberId,
    activeStaff,
    setDuration,
  ]);

  let initialStep: StepType = "duration";
  if (appointmentOption.durationType === "fixed" && showSpecialistStep) {
    initialStep = "specialist";
  } else if (
    appointmentOption.addons &&
    appointmentOption.addons.length &&
    !purchasePackageId &&
    !customerPackageId
  ) {
    initialStep = "addons";
  } else if (appointmentOption.durationType === "fixed")
    initialStep = "calendar";

  const [step, setStep] = React.useState<StepType>(initialStep);
  const [dateTime, setDateTime] = React.useState<DateTime | undefined>(
    undefined,
  );

  const [selectedAddons, setSelectedAddons] = React.useState<
    AppointmentAddon[]
  >([]);

  React.useEffect(() => {
    if (!selectedAddons.length) return;
    const filtered = selectedAddons.filter((addon) =>
      isAddonAvailableForMember(addon.staff, selectedMemberId),
    );
    if (filtered.length !== selectedAddons.length) {
      setSelectedAddons(filtered);
    }
    // Only re-filter when the selected specialist changes.
  }, [selectedMemberId]);

  const addonsFields =
    selectedAddons?.flatMap((addon) => addon.fields || []) || [];
  const allFormFields = [...(appointmentOption.fields || []), ...addonsFields];
  const fieldsIdsRequired = [...allFormFields].reduce(
    (map, field) => ({
      ...map,
      [field.id]: !!map[field.id] || !!field.required,
    }),
    {} as Record<string, boolean>,
  );

  const formFields = Object.entries(fieldsIdsRequired)
    .filter(([id]) => !!fieldsSchema[id])
    .map(([id, required]) => ({
      ...fieldsSchema[id],
      required: !!fieldsSchema[id].required || required,
    }));

  const [availability, setAvailability] = React.useState<Availability>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fields, setFields] = React.useState<AppointmentFields>(
    initialFields ?? {
      name: "",
      email: "",
      phone: "",
    },
  );

  React.useEffect(() => {
    if (customerPackageId) return;
    setOtpVerified(false);
  }, [fields.email, fields.phone, customerPackageId]);

  const [isFormValid, setIsFormValid] = React.useState(false);
  const [confirmDuplicateAppointment, setConfirmDuplicateAppointment] =
    React.useState(false);

  const router = useRouter();

  const getTotalDuration = () => {
    if (!duration) return undefined;

    return (
      duration +
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

  const fetchAvailability = async (memberIdOverride?: string | null) => {
    const totalDuration = getTotalDuration();
    if (!totalDuration) return;
    if (errors.fetchTitle === "booking.availability.fetchFailedTitle") return;

    const resolvedMemberId =
      memberIdOverride ??
      selectedMemberId ??
      preselectedMemberId ??
      (activeStaff.length === 1 ? activeStaff[0].member.id : null);

    if (resolvedMemberId && resolvedMemberId !== selectedMemberId) {
      setSelectedMemberId(resolvedMemberId);
    }

    setIsLoading(true);

    try {
      const data = await clientApi.availability.getAvailability({
        duration: totalDuration,
        memberId: resolvedMemberId ?? undefined,
      });

      setAvailability(data);
    } catch (e) {
      console.error(e);

      setAvailability([]);
      toast.error(errors.fetchTitle, {
        description: errors.fetchDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDuplicateAppointments =
    async (): Promise<CheckDuplicateAppointmentsResponse> => {
      const request = getAppointmentRequest();
      if (!request) throw new Error("Failed to build appointment request");

      setIsLoading(true);

      try {
        const data =
          await clientApi.booking.checkDuplicateAppointments(request);
        return data;
      } catch (e) {
        console.error(e);
        toast.error(errors.fetchTitle, {
          description: errors.fetchDescription,
        });

        throw e;
      } finally {
        setIsLoading(false);
      }
    };

  const getAppointmentRequest = (): AppointmentRequest | null => {
    if (!dateTime || !duration) return null;
    return {
      dateTime: LuxonDateTime.fromObject(
        {
          year: dateTime.date.getFullYear(),
          month: dateTime.date.getMonth() + 1,
          day: dateTime.date.getDate(),
          hour: dateTime.time.hour,
          minute: dateTime.time.minute,
          second: 0,
        },
        { zone: dateTime.timeZone },
      )
        .toUTC()
        .toJSDate(),
      timeZone: dateTime.timeZone,
      duration: duration,
      optionId: appointmentOption._id,
      memberId: selectedMemberId ?? undefined,
      addonsIds: selectedAddons?.map((addon) => addon._id),
      promoCode: promoCode?.code,
      paymentIntentId: paymentInformation?.intent?._id,
      giftCards: giftCards?.map((giftCard) => giftCard.code),
      purchasePackageId,
      customerPackageId,
      fields: Object.entries(fields)
        .filter(([_, value]) => !((value as any) instanceof File))
        .reduce(
          (obj, cur) => ({
            ...obj,
            [cur[0]]: cur[1],
          }),
          {} as AppointmentFields,
        ),
    };
  };

  React.useEffect(() => {
    if (initialStep === "calendar") {
      fetchAvailability();
    }
  }, [initialStep, i18n]);

  const applyGiftCards = async (codes: string[], amount: number) => {
    try {
      const data = await clientApi.giftCards.applyGiftCards({
        codes,
        amount,
      });

      if (data.success) {
        setGiftCards(data.giftCards);
        return data.giftCards;
      }

      throw new Error(data.error);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const fetchPaymentInformation = async (): Promise<CollectPayment | null> => {
    const request = getAppointmentRequest();
    if (!request) throw new Error("Failed to build appointment request");

    const intentId = paymentInformation?.intent?._id;
    const body = {
      request,
      type: "deposit",
    } satisfies CreateOrUpdatePaymentIntentRequest;

    try {
      setIsLoading(true);
      const data = await (intentId
        ? clientApi.payments.updatePaymentIntent(intentId, body)
        : clientApi.payments.createPaymentIntent(body));

      return data;
    } catch (e) {
      toast.error(errors.fetchPaymentInformationTitle, {
        description: errors.fetchPaymentInformationDescription,
      });

      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async () => {
    if (isEditor) return;
    if (isBookingRestricted) {
      toast.error(errors.limitReachedTitle, {
        description: errors.limitReachedDescription,
      });
      return;
    }
    setIsLoading(true);

    try {
      const eventBody = getAppointmentRequest();
      if (!eventBody) return;

      const files = Object.fromEntries(
        Object.entries(fields).filter(
          ([_, value]) => (value as any) instanceof File,
        ),
      );

      const { id } = await clientApi.booking.createAppointment(
        eventBody,
        files,
      );

      if (successPage) {
        const expireDate = LuxonDateTime.now().plus({ minutes: 1 });

        document.cookie = `appointment_id=${encodeURIComponent(
          id,
        )}; expires=${expireDate.toJSDate().toUTCString()};`;

        router.push(successPage);
      } else {
        setStep("confirmation");
      }
    } catch (e: any) {
      const { handled, kind } = await handleBookingSubmitError(
        e,
        errors,
        (title, description) => {
          toast.error(title, { description });
        },
      );

      if (handled) {
        if (kind === "time_not_available") {
          setDateTime(undefined);
          setStep("calendar");
          await fetchAvailability();
        }
        return;
      }

      if (step === "payment") {
        setStep("form");
      }

      toast.error(errors.submitTitle, {
        description: errors.submitDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    topRef?.current?.scrollIntoView();
  }, [step]);

  return (
    <div className="relative" id={id} {...props}>
      <div ref={topRef} />
      <ScheduleContext.Provider
        value={{
          selectedAddons,
          appointmentOption,
          members,
          flowOrder,
          selectedMemberId,
          setSelectedMemberId,
          preselectedMemberId,
          activeStaff,
          showSpecialistStep,
          duration,
          setDiscount: setPromoCode,
          discount: promoCode,
          step,
          setStep,
          fetchAvailability,
          fields,
          setFields,
          onSubmit,
          setDateTime,
          setDuration,
          setSelectedAddons,
          dateTime,
          goBack,
          showPromoCode,
          formFields,
          timeZone,
          availability,
          giftCards,
          setGiftCards,
          applyGiftCards,
          paymentInformation,
          setPaymentInformation,
          fetchPaymentInformation,
          checkDuplicateAppointments,
          confirmDuplicateAppointment,
          setConfirmDuplicateAppointment,
          closestDuplicateAppointment,
          setClosestDuplicateAppointment,
          duplicateAppointmentDoNotAllowScheduling,
          setDuplicateAppointmentDoNotAllowScheduling,
          isFormValid,
          setIsFormValid,
          className,
          isEditor,
          isBookingRestricted,
          purchasePackageId,
          customerPackageId,
          isCustomerPackageLocked,
          packages,
          requireCustomerOtp,
          otpVerified,
          setOtpVerified,
          otpDialogOpen,
          setOtpDialogOpen,
        }}
      >
        {isBookingRestricted ? (
          <BookingRestrictionBanner className="mb-4" />
        ) : (
          <StepCard />
        )}
        <BookingOtpDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          fields={fields}
          onVerified={async (result) => {
            setOtpVerified(true);
            setFields({
              ...fields,
              name: result.name || fields.name,
              email: result.email || fields.email,
              phone: result.phone || fields.phone,
            });
            const payment = await fetchPaymentInformation();
            setPaymentInformation(payment);
            if (!payment || payment.intent?.status === "paid") {
              onSubmit();
            } else {
              clientApi.booking.trackPaymentReached(payment.intent?.amount);
              setStep("payment");
            }
          }}
        />
      </ScheduleContext.Provider>

      {isLoading && (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-white opacity-50">
          <div role="status">
            <Spinner className="w-20 h-20" />
            <span className="sr-only">Please wait...</span>
          </div>
        </div>
      )}
    </div>
  );
};
