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
  getActiveStaffAcrossAssignments,
  getActiveStaffForAssignments,
  isBookingLimitRestriction,
} from "@hacado/types";
import { toast, useTimeZone } from "@hacado/ui";
import { DateTime as LuxonDateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { FlowOrder, ScheduleContext, StepType } from "./context";
import { BookingLayout } from "./layout";

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
  scrollToTop,
  hideTitle,
  hideSteps,
  bookingRestriction,
  ...props
}) => {
  const t = useI18n("translation");
  const isBookingRestricted = isBookingLimitRestriction(bookingRestriction);

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

  const timeZone = useTimeZone();

  const errors = React.useMemo(
    () => ({
      fetchTitle: t("booking.availability.fetchFailedTitle"),
      fetchDescription: t("booking.availability.fetchFailedDescription"),
      fetchPaymentInformationTitle: t(
        "booking.payment.informationFetchFailedTitle",
      ),
      fetchPaymentInformationDescription: t(
        "booking.payment.informationFetchFailedDescription",
      ),
      submitTitle: t("booking.submitEvent.failedTitle"),
      submitDescription: t("booking.submitEvent.failedDescription"),
      timeNotAvailableDescription: t(
        "booking.submitEvent.timeNotAvailableDescription",
      ),
      limitReachedTitle: t("booking.submitEvent.limitReachedTitle"),
      limitReachedDescription: t("booking.submitEvent.limitReachedDescription"),
    }),
    [t],
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

  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(
    null,
  );

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

  const router = useRouter();

  const getTotalDuration = () => {
    if (!duration) return undefined;

    return (
      duration +
      (selectedAddons || []).reduce(
        (sum, addon) => sum + (addon.duration || 0),
        0,
      )
    );
  };

  const fetchAvailability = async () => {
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

  const getAppointmentRequest = (): AppointmentRequest | null => {
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
  };

  // React.useEffect(() => {
  //   if (initialStep === "calendar") {
  //     fetchAvailability();
  //   }
  // }, [initialStep, i18n]);

  const handleNewBooking = () => {
    setCurrentStep(isSpecialistFirst ? "specialist" : "option");
    setSelectedAppointmentOption(undefined);
    setSelectedMemberId(null);
    setSelectedAddons([]);
    setDuration(undefined);
    setDateTime(undefined);
    setAvailability([]);
    setIsBookingConfirmed(false);
    setClosestDuplicateAppointment(undefined);
    setDuplicateAppointmentDoNotAllowScheduling(undefined);
    setConfirmDuplicateAppointment(false);
    setPromoCode(undefined);
    setGiftCards([]);
    setPaymentInformation(null);
    setIsFormValid(false);
    setFields({
      name: fields.name || "",
      email: fields.email || "",
      phone: fields.phone || "",
    });
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
  };

  return (
    <ScheduleContext.Provider
      value={{
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
        giftCards,
        setGiftCards,
        applyGiftCards,
        isFormValid,
        setIsFormValid,
        isEditor,
        isBookingRestricted,
        handleNewBooking,
      }}
    >
      <BookingLayout
        scrollToTop={scrollToTop}
        hideTitle={hideTitle}
        hideSteps={hideSteps}
        className={className}
        {...props}
      />
    </ScheduleContext.Provider>
  );
};
