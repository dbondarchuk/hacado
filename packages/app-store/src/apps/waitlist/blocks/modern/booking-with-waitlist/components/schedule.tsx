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
  getActiveStaffAcrossAssignments,
  getActiveStaffForAssignments,
  isAddonAvailableForMember,
  isBookingLimitRestriction,
} from "@hacado/types";
import { toast, useTimeZone } from "@hacado/ui";
import { DateTime as LuxonDateTime } from "luxon";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import { WaitlistDate, WaitlistRequest } from "../../../../models/waitlist";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import {
  FlowOrder,
  FlowType,
  ScheduleContext,
  ScheduleContextProps,
  StepType,
} from "./context";
import { BookingWithWaitlistLayout } from "./layout";

export type ScheduleProps = {
  appointmentOptions: AppointmentChoice[];
  areAppointmentOptionsLoading: boolean;
  members: PublicStaffMember[];
  flowOrder: FlowOrder;
  successPage?: string;
  fieldsSchema: Record<string, FieldSchema>;
  showPromoCode?: boolean;
  className?: string;
  id?: string;
  isEditor?: boolean;
  waitlistAppId?: string;
  isOnlyWaitlist: boolean;
  scrollToTop?: boolean;
  hideTitle?: boolean;
  hideSteps?: boolean;
  bookingRestriction?: BookingRestriction;
};

export const Schedule: React.FC<
  ScheduleProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  appointmentOptions,
  areAppointmentOptionsLoading,
  members,
  flowOrder,
  successPage,
  fieldsSchema,
  showPromoCode,
  className,
  id,
  isEditor,
  waitlistAppId,
  isOnlyWaitlist,
  scrollToTop,
  hideTitle,
  hideSteps,
  bookingRestriction,
  ...props
}) => {
  const i18n = useI18n("translation");
  const isBookingRestricted = isBookingLimitRestriction(bookingRestriction);
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

  const [selectedAppointmentOption, setSelectedAppointmentOption] =
    React.useState<AppointmentChoice | undefined>(undefined);

  const appointmentOptionDuration =
    selectedAppointmentOption?.durationType === "fixed"
      ? selectedAppointmentOption?.duration
      : selectedAppointmentOption?.durationMin;

  const [duration, setDuration] = React.useState<number | undefined>(
    appointmentOptionDuration,
  );

  const [flow, setFlow] = React.useState<FlowType>(
    isOnlyWaitlist ? "waitlist" : "booking",
  );

  const staffAcrossOptions = React.useMemo(
    () =>
      getActiveStaffAcrossAssignments(
        appointmentOptions.map((o) => o.staff),
        members,
      ),
    [appointmentOptions, members],
  );

  const isSpecialistFirst =
    flowOrder === "specialist-first" && staffAcrossOptions.length > 0;

  const optionBasePrice =
    selectedAppointmentOption?.durationType === "fixed"
      ? selectedAppointmentOption?.price
      : selectedAppointmentOption?.pricePerHour;
  const optionBaseDuration =
    selectedAppointmentOption?.durationType === "fixed"
      ? selectedAppointmentOption?.duration
      : undefined;

  const activeStaff = React.useMemo(
    () =>
      getActiveStaffForAssignments(
        selectedAppointmentOption?.staff,
        members,
        optionBasePrice,
        optionBaseDuration,
      ),
    [
      selectedAppointmentOption?.staff,
      members,
      optionBasePrice,
      optionBaseDuration,
    ],
  );

  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(
    null,
  );

  const [isBookingConfirmed, setIsBookingConfirmed] = React.useState(false);

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

  React.useEffect(() => {
    if (!selectedAppointmentOption) return;
    if (selectedAppointmentOption.durationType !== "flexible") return;
    setDuration(selectedAppointmentOption.durationMin);
  }, [selectedAppointmentOption?._id, setDuration]);

  React.useEffect(() => {
    if (!selectedAppointmentOption) {
      setDuration(undefined);
      return;
    }

    const selectedStaff = selectedMemberId
      ? activeStaff.find((s) => s.member.id === selectedMemberId)
      : undefined;

    if (selectedAppointmentOption.durationType === "fixed") {
      setDuration(
        selectedStaff?.effectiveDuration ?? selectedAppointmentOption.duration,
      );
    }
  }, [selectedAppointmentOption, selectedMemberId, activeStaff, setDuration]);

  const initialStep: StepType = isSpecialistFirst ? "specialist" : "option";
  const [currentStep, setCurrentStep] = React.useState<StepType>(initialStep);
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
  const allFormFields = [
    ...(selectedAppointmentOption?.fields || []),
    ...addonsFields,
  ];
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
    if (!waitlistAppId || !selectedAppointmentOption?._id) return;

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
        optionId: selectedAppointmentOption._id,
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

      setIsBookingConfirmed(true);
    } catch (e) {
      toast.error(errors.submitWaitlistTitle, {
        description: errors.submitWaitlistDescription,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    waitlistAppId,
    selectedAppointmentOption,
    fields,
    selectedAddons,
    selectedMemberId,
    waitlistTimes,
    isEditor,
  ]);

  const getAppointmentRequest = useCallback((): AppointmentRequest | null => {
    if (!dateTime || !duration || !selectedAppointmentOption?._id) return null;
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
      optionId: selectedAppointmentOption._id,
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
    selectedAppointmentOption,
    selectedAddons,
    selectedMemberId,
    giftCards,
    fields,
    paymentInformation,
  ]);

  const router = useRouter();

  const fetchAvailability = useCallback(async () => {
    const totalDuration = getTotalDuration();
    if (!totalDuration) return;
    if (errors.fetchTitle === "booking.availability.fetchFailedTitle") return;

    setIsLoading(true);
    setAvailability([]);
    setDateTime(undefined);

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

  // React.useEffect(() => {
  //   if (initialStep === "calendar") {
  //     fetchAvailability();
  //   }
  // }, [initialStep, i18n]);

  const handleNewBooking = useCallback(() => {
    setFlow(isOnlyWaitlist ? "waitlist" : "booking");
    setCurrentStep(isSpecialistFirst ? "specialist" : "option");
    setSelectedAppointmentOption(undefined);
    setSelectedMemberId(null);
    setSelectedAddons([]);
    setDuration(undefined);
    setDateTime(undefined);
    setWaitlistTimes({
      asSoonAsPossible: false,
      dates: [],
    });
    setAvailability([]);
    setIsBookingConfirmed(false);
    setClosestDuplicateAppointment(undefined);
    setDuplicateAppointmentDoNotAllowScheduling(undefined);
    setConfirmDuplicateAppointment(false);
    setPromoCode(undefined);
    setPaymentInformation(null);
    setIsFormValid(false);
    setFields({
      name: fields.name || "",
      email: fields.email || "",
      phone: fields.phone || "",
    });
    setGiftCards([]);
  }, [isOnlyWaitlist, isSpecialistFirst]);

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
      paymentInformation?.intent?._id,
      errors.fetchPaymentInformationTitle,
      errors.fetchPaymentInformationDescription,
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
        setIsBookingConfirmed(true);
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
          setCurrentStep("calendar");
          await fetchAvailability();
        }
        return;
      }

      if (currentStep === "payment") {
        setCurrentStep("form");
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
    currentStep,
    fetchAvailability,
    fields,
  ]);

  const contextValue: ScheduleContextProps = useMemo(
    () => ({
      appointmentOptions,
      areAppointmentOptionsLoading,
      members,
      flowOrder,
      selectedMemberId,
      setSelectedMemberId,
      activeStaff,
      isLoading,
      setIsLoading,
      isBookingConfirmed,
      selectedAddons,
      selectedAppointmentOption,
      setSelectedAppointmentOption,
      duration,
      setDiscount: setPromoCode,
      discount: promoCode,
      giftCards,
      setGiftCards,
      applyGiftCards,
      currentStep,
      setCurrentStep,
      fetchAvailability,
      fields,
      setFields,
      onSubmit,
      setDateTime,
      setDuration,
      setSelectedAddons,
      dateTime,
      flow,
      setFlow,
      showPromoCode,
      formFields,
      availability,
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
      isEditor,
      isBookingRestricted,
      waitlistAppId,
      onWaitlistSubmit,
      waitlistTimes,
      setWaitlistTimes,
      isOnlyWaitlist,
      handleNewBooking,
    }),
    [
      appointmentOptions,
      areAppointmentOptionsLoading,
      members,
      flowOrder,
      selectedMemberId,
      activeStaff,
      isLoading,
      setIsLoading,
      isBookingConfirmed,
      selectedAddons,
      selectedAppointmentOption,
      setSelectedAppointmentOption,
      duration,
      setPromoCode,
      promoCode,
      giftCards,
      setGiftCards,
      applyGiftCards,
      currentStep,
      setCurrentStep,
      fetchAvailability,
      fields,
      setFields,
      onSubmit,
      setDateTime,
      setDuration,
      setSelectedAddons,
      dateTime,
      flow,
      setFlow,
      showPromoCode,
      formFields,
      availability,
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
      isEditor,
      isBookingRestricted,
      waitlistAppId,
      onWaitlistSubmit,
      waitlistTimes,
      setWaitlistTimes,
      isOnlyWaitlist,
      handleNewBooking,
    ],
  );
  return (
    <ScheduleContext.Provider value={contextValue}>
      <BookingWithWaitlistLayout
        scrollToTop={scrollToTop}
        hideTitle={hideTitle}
        hideSteps={hideSteps}
        className={className}
        {...props}
      />
    </ScheduleContext.Provider>
  );
};
