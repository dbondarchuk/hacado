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
  BookingCatalogNode,
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
  creditsPerRedemptionForItem,
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
import {
  WaitlistDate,
  WaitlistRequest,
} from "../../../../../waitlist/models/waitlist";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../../waitlist/translations/types";
import { useCustomerProfile } from "../../customer-profile-context";
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
  catalog?: BookingCatalogNode[];
  packages?: AppointmentPackage[];
  lockPurchasePackageId?: string;
  lockCustomerPackageId?: string;
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
  catalog,
  packages,
  lockPurchasePackageId,
  lockCustomerPackageId,
  ...props
}) => {
  const i18n = useI18n("translation");
  const isBookingRestricted = isBookingLimitRestriction(bookingRestriction);
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const timeZone = useTimeZone();
  const { customer } = useCustomerProfile();

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

  const [catalogPath, setCatalogPath] = React.useState<string[]>([]);
  const [purchasePackageId, setPurchasePackageId] = React.useState<
    string | undefined
  >(lockPurchasePackageId);
  const [customerPackageId, setCustomerPackageId] = React.useState<
    string | undefined
  >(lockCustomerPackageId);
  const [otpVerified, setOtpVerified] = React.useState(true);
  const lockedPackageBootstrappedForId = React.useRef<string | null>(null);

  const initialStep: StepType = isSpecialistFirst ? "specialist" : "option";
  const [currentStep, setCurrentStep] = React.useState<StepType>(
    lockCustomerPackageId ? "calendar" : initialStep,
  );
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
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
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

  const getAppointmentRequest = useCallback(
    (paymentIntentIdOverride?: string): AppointmentRequest | null => {
      if (!dateTime || !duration || !selectedAppointmentOption?._id)
        return null;
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
        paymentIntentId:
          paymentIntentIdOverride ?? paymentInformation?.intent?._id,
        giftCards: giftCards?.map((giftCard) => giftCard.code),
        customerPackageId,
        purchasePackageId,
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
    },
    [
      dateTime,
      duration,
      selectedAppointmentOption,
      selectedAddons,
      selectedMemberId,
      giftCards,
      fields,
      paymentInformation,
      customerPackageId,
      purchasePackageId,
    ],
  );

  const router = useRouter();

  const fetchAvailability = useCallback(
    async (memberIdOverride?: string | null) => {
      const totalDuration = getTotalDuration();
      if (!totalDuration) return;
      if (errors.fetchTitle === "booking.availability.fetchFailedTitle") return;

      const resolvedMemberId =
        memberIdOverride ??
        selectedMemberId ??
        (activeStaff.length === 1 ? activeStaff[0].member.id : null);

      if (resolvedMemberId && resolvedMemberId !== selectedMemberId) {
        setSelectedMemberId(resolvedMemberId);
      }

      setIsLoading(true);
      setAvailability([]);
      setDateTime(undefined);

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
    },
    [
      getTotalDuration,
      errors.fetchTitle,
      errors.fetchDescription,
      selectedMemberId,
      activeStaff,
    ],
  );

  React.useEffect(() => {
    if (
      !lockCustomerPackageId ||
      areAppointmentOptionsLoading ||
      lockedPackageBootstrappedForId.current === lockCustomerPackageId ||
      !appointmentOptions.length
    ) {
      return;
    }

    let cancelled = false;

    const bootstrapLockedPackage = async () => {
      setIsLoading(true);
      try {
        const packagesRes = await clientApi.customerAuth.getMyPackages();
        if (cancelled) return;

        const customerPackage = packagesRes.items?.find(
          (pkg) => pkg._id === lockCustomerPackageId,
        );
        if (!customerPackage || customerPackage.remainingCredits <= 0) {
          window.location.hash = "";
          return;
        }

        const redeemableItem = customerPackage.items.find((item) => {
          const remaining = customerPackage.remainingByItem[item._id] ?? 0;
          const needed = creditsPerRedemptionForItem(item);
          return (
            remaining >= needed &&
            appointmentOptions.some((option) => option._id === item.optionId)
          );
        });

        const option = redeemableItem
          ? appointmentOptions.find(
              (item) => item._id === redeemableItem.optionId,
            )
          : undefined;

        if (!option) {
          window.location.hash = "";
          return;
        }

        setCustomerPackageId(customerPackage._id);
        setPurchasePackageId(undefined);
        setSelectedAddons([]);
        setSelectedAppointmentOption(option);
        setDuration(
          option.durationType === "fixed"
            ? option.duration
            : option.durationMin,
        );
        setCurrentStep("calendar");

        const staff = getActiveStaffForAssignments(
          option.staff,
          members,
          option.durationType === "fixed" ? option.price : option.pricePerHour,
          option.durationType === "fixed" ? option.duration : undefined,
        );
        const memberId = staff.length === 1 ? staff[0].member.id : undefined;
        if (memberId) {
          setSelectedMemberId(memberId);
        }

        const optionDuration =
          option.durationType === "fixed"
            ? option.duration
            : option.durationMin;
        if (!optionDuration) {
          lockedPackageBootstrappedForId.current = lockCustomerPackageId;
          return;
        }

        setAvailability([]);
        setDateTime(undefined);
        const data = await clientApi.availability.getAvailability({
          duration: optionDuration,
          memberId,
        });
        if (cancelled) return;

        setAvailability(data);
        lockedPackageBootstrappedForId.current = lockCustomerPackageId;
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          window.location.hash = "";
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapLockedPackage();

    return () => {
      cancelled = true;
    };
  }, [
    lockCustomerPackageId,
    areAppointmentOptionsLoading,
    appointmentOptions,
    members,
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
    window.location.hash = "";
  }, []);

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

  const onSubmit = useCallback(
    async (paymentIntentId?: string) => {
      if (isEditor) return;
      if (isBookingRestricted) {
        toast.error(errors.limitReachedTitle, {
          description: errors.limitReachedDescription,
        });
        return;
      }
      setIsLoading(true);

      try {
        const eventBody = getAppointmentRequest(paymentIntentId);
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
    },
    [
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
    ],
  );

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
      catalog,
      catalogPath,
      setCatalogPath,
      packages,
      purchasePackageId,
      setPurchasePackageId,
      customerPackageId,
      setCustomerPackageId,
      isCustomerPackageLocked: !!lockCustomerPackageId,
      requireCustomerOtp: false,
      otpVerified,
      setOtpVerified,
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
      catalog,
      catalogPath,
      packages,
      purchasePackageId,
      customerPackageId,
      lockCustomerPackageId,
      otpVerified,
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
