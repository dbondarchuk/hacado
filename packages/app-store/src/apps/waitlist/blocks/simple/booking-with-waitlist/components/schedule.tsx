"use client";

import { clientApi, handleBookingSubmitError } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import type {
  ApplyGiftCardsSuccessResponse,
  AppointmentAddon,
  AppointmentChoice,
  AppointmentFields,
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
import React, { useCallback, useMemo } from "react";
import { BookingRestrictionBanner } from "../../../../components/booking-restriction-banner";
import { WaitlistDate, WaitlistRequest } from "../../../../models/waitlist";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import {
  FlowOrder,
  ScheduleContext,
  ScheduleContextProps,
  StepType,
} from "./context";
import { StepCard } from "./step-card";

export type ScheduleProps = {
  appointmentOption: AppointmentChoice;
  goBack?: () => void;
  members: PublicStaffMember[];
  flowOrder: FlowOrder;
  /** Set when a specialist was already chosen before the service (specialist-first flow). */
  preselectedMemberId?: string | null;
  successPage?: string;
  fieldsSchema: Record<string, FieldSchema>;
  showPromoCode?: boolean;
  bookingRestriction?: BookingRestriction;
  className?: string;
  id?: string;
  isEditor?: boolean;
  waitlistAppId?: string;
  isOnlyWaitlist: boolean;
};

export const Schedule: React.FC<
  ScheduleProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  appointmentOption,
  goBack,
  members,
  flowOrder,
  preselectedMemberId,
  successPage,
  fieldsSchema,
  showPromoCode,
  bookingRestriction,
  className,
  id,
  isEditor,
  waitlistAppId,
  isOnlyWaitlist,
  ...props
}) => {
  const i18n = useI18n("translation");
  const isBookingRestricted =
    !isOnlyWaitlist && isBookingLimitRestriction(bookingRestriction);
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

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
      submitWaitlistTitle: t("block.errors.submit.title"),
      submitWaitlistDescription: t("block.errors.submit.description"),
    }),
    [i18n, t],
  );

  const topRef = React.createRef<HTMLDivElement>();

  const appointmentOptionDuration =
    appointmentOption.durationType === "fixed"
      ? appointmentOption.duration
      : appointmentOption.durationMin;
  const [duration, setDuration] = React.useState<number | undefined>(
    appointmentOptionDuration,
  );

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
  } else if (appointmentOption.addons && appointmentOption.addons.length) {
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
  const [fields, setFields] = React.useState<AppointmentFields>({
    name: "",
    email: "",
    phone: "",
  });

  const [isFormValid, setIsFormValid] = React.useState(false);
  const [confirmDuplicateAppointment, setConfirmDuplicateAppointment] =
    React.useState(false);
  const [waitlistTimes, setWaitlistTimes] = React.useState<{
    asSoonAsPossible: boolean;
    dates?: WaitlistDate[];
  }>({
    asSoonAsPossible: true,
    dates: [],
  });

  const getTotalDuration = useCallback(() => {
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
  }, [duration, selectedAddons, selectedMemberId]);

  const onWaitlistSubmit = useCallback(async () => {
    if (isEditor) return;
    if (!waitlistAppId) return;

    const totalDuration = getTotalDuration();
    if (!totalDuration || !selectedMemberId) return;

    setIsLoading(true);

    try {
      const waitlistBody: WaitlistRequest = {
        dates: waitlistTimes.asSoonAsPossible
          ? (undefined as any)
          : waitlistTimes.dates,
        asSoonAsPossible: waitlistTimes.asSoonAsPossible,
        email: fields.email,
        name: fields.name,
        phone: fields.phone,
        note: fields.note,
        optionId: appointmentOption._id,
        memberId: selectedMemberId,
        addonsIds: selectedAddons?.map((addon) => addon._id),
        duration: totalDuration,
      };

      await clientApi.apps.callAppApi({
        appId: waitlistAppId,
        path: "waitlist",
        method: "POST",
        body: waitlistBody,
      });

      setStep("waitlist-confirmation");
    } catch (e) {
      toast.error(errors.submitWaitlistTitle, {
        description: errors.submitWaitlistDescription,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    isEditor,
    waitlistAppId,
    waitlistTimes,
    fields,
    appointmentOption,
    selectedAddons,
    selectedMemberId,
  ]);
  const getAppointmentRequest = useCallback((): AppointmentRequest | null => {
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
  }, [
    dateTime,
    duration,
    appointmentOption,
    selectedAddons,
    selectedMemberId,
    promoCode,
    paymentInformation,
    fields,
  ]);
  const router = useRouter();

  const fetchAvailability = useCallback(async () => {
    const totalDuration = getTotalDuration();
    if (!totalDuration) return;
    if (errors.fetchTitle === "booking.availability.fetchFailedTitle") return;

    setIsLoading(true);

    try {
      const data = await clientApi.availability.getAvailability({
        duration: totalDuration,
        memberId: selectedMemberId ?? undefined,
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
  }, [
    getTotalDuration,
    errors.fetchTitle,
    errors.fetchDescription,
    selectedMemberId,
  ]);

  const checkDuplicateAppointments =
    useCallback(async (): Promise<CheckDuplicateAppointmentsResponse> => {
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
    }, [getAppointmentRequest, errors.fetchTitle, errors.fetchDescription]);

  const applyGiftCards = useCallback(
    async (codes: string[], amount: number) => {
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
    },
    [],
  );

  React.useEffect(() => {
    if (initialStep === "calendar") {
      fetchAvailability();
    }
  }, [initialStep, i18n]);

  const fetchPaymentInformation =
    useCallback(async (): Promise<CollectPayment | null> => {
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
    }, [
      getAppointmentRequest,
      errors.fetchPaymentInformationTitle,
      errors.fetchPaymentInformationDescription,
      paymentInformation?.intent?._id,
    ]);

  const onSubmit = useCallback(async () => {
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
  }, [
    getAppointmentRequest,
    errors.submitTitle,
    errors.submitDescription,
    errors.timeNotAvailableDescription,
    errors.limitReachedTitle,
    errors.limitReachedDescription,
    successPage,
    isEditor,
    isBookingRestricted,
    router,
    step,
    fields,
    fetchAvailability,
  ]);

  React.useEffect(() => {
    topRef?.current?.scrollIntoView();
  }, [step]);

  const contextValue: ScheduleContextProps = useMemo(
    () => ({
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
      waitlistAppId,
      onWaitlistSubmit,
      waitlistTimes,
      setWaitlistTimes,
      isOnlyWaitlist,
    }),
    [
      selectedAddons,
      appointmentOption,
      members,
      flowOrder,
      selectedMemberId,
      preselectedMemberId,
      activeStaff,
      showSpecialistStep,
      duration,
      setPromoCode,
      promoCode,
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
      waitlistAppId,
      onWaitlistSubmit,
      waitlistTimes,
      setWaitlistTimes,
      isOnlyWaitlist,
    ],
  );
  return (
    <div className="relative" id={id} {...props}>
      <div ref={topRef} />
      <ScheduleContext.Provider value={contextValue}>
        {isBookingRestricted ? (
          <BookingRestrictionBanner className="mb-4" />
        ) : (
          <StepCard />
        )}
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
