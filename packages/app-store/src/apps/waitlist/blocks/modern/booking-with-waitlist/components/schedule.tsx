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
  AvailabilityByMember,
  BookingRestriction,
  catalogPathForOption,
  CheckDuplicateAppointmentsResponse,
  effectiveAddonDuration,
  getActiveStaffAcrossAssignments,
  getActiveStaffForAssignments,
  isAddonAvailableForMember,
  isBookingLimitRestriction,
} from "@hacado/types";
import { toast, useTimeZone } from "@hacado/ui";
import { DateTime as LuxonDateTime } from "luxon";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import { WaitlistDate, WaitlistRequest } from "../../../../models/waitlist";
import type { WaitlistOfferPrefill } from "../../../../models/waitlist-offer";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import {
  isWaitlistOfferSlotAvailable,
  waitlistOfferSlotToDateTime,
} from "../../../../waitlist-offer-prefill";
import { fetchWaitlistOffer } from "../../../fetch-waitlist-offer";
import {
  FlowOrder,
  FlowType,
  ScheduleContext,
  ScheduleContextProps,
  StepType,
} from "./context";
import { BookingWithWaitlistLayout } from "./layout";
import { getInitialBookingStep } from "./steps";

export type ScheduleProps = {
  appointmentOptions: AppointmentChoice[];
  areAppointmentOptionsLoading: boolean;
  members: PublicStaffMember[];
  flowOrder: FlowOrder;
  dontAllowAnySpecialist?: boolean;
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
  requireCustomerOtp?: boolean;
  hasActiveCustomerPackages?: boolean;
  lockPurchasePackageId?: string;
  lockCustomerPackageId?: string;
  lockServiceId?: string | null;
  lockMemberId?: string | null;
  refreshBookingOptions?: () => Promise<void>;
};

export const Schedule: React.FC<
  ScheduleProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  appointmentOptions,
  areAppointmentOptionsLoading,
  members,
  flowOrder,
  dontAllowAnySpecialist = false,
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
  requireCustomerOtp,
  hasActiveCustomerPackages,
  lockPurchasePackageId,
  lockCustomerPackageId,
  lockServiceId,
  lockMemberId,
  refreshBookingOptions,
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
    React.useState<AppointmentChoice | undefined>(() =>
      lockServiceId
        ? appointmentOptions.find((option) => option._id === lockServiceId)
        : undefined,
    );
  const searchParams = useSearchParams();
  const waitlistTokenParam = searchParams.get("w");
  const [waitlistOffer, setWaitlistOffer] =
    React.useState<WaitlistOfferPrefill | null>(null);

  React.useEffect(() => {
    if (!waitlistTokenParam || isEditor || !waitlistAppId) return;
    let cancelled = false;
    void fetchWaitlistOffer(waitlistAppId, waitlistTokenParam).then((offer) => {
      if (cancelled || !offer) return;
      setWaitlistOffer(offer);
      if (lockServiceId) return;
      const selected = appointmentOptions.find((o) => o._id === offer.optionId);
      if (selected) {
        setSelectedAppointmentOption(selected);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    waitlistTokenParam,
    isEditor,
    waitlistAppId,
    appointmentOptions,
    lockServiceId,
  ]);

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
    lockMemberId ?? null,
  );
  const [isAnySpecialist, setIsAnySpecialist] = React.useState(false);

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
    if (waitlistOffer) return;
    if (!selectedAppointmentOption) return;
    if (selectedAppointmentOption.durationType !== "flexible") return;
    setDuration(selectedAppointmentOption.durationMin);
  }, [selectedAppointmentOption?._id, setDuration, waitlistOffer]);

  React.useEffect(() => {
    if (waitlistOffer) return;
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
  }, [
    selectedAppointmentOption,
    selectedMemberId,
    activeStaff,
    setDuration,
    waitlistOffer,
  ]);

  const [catalogPath, setCatalogPath] = React.useState<string[]>([]);
  const appliedOfferCatalogPath = React.useRef(false);

  React.useEffect(() => {
    if (!waitlistOffer || appliedOfferCatalogPath.current) return;
    const path = catalogPathForOption(catalog, waitlistOffer.optionId);
    if (path === undefined) return;
    setCatalogPath(path);
    appliedOfferCatalogPath.current = true;
  }, [waitlistOffer, catalog]);

  const [purchasePackageId, setPurchasePackageId] = React.useState<
    string | undefined
  >(lockPurchasePackageId);
  const [customerPackageId, setCustomerPackageId] = React.useState<
    string | undefined
  >(lockCustomerPackageId);
  const [packageBookingFlow, setPackageBookingFlow] = React.useState(
    !!lockCustomerPackageId,
  );
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [otpReturnStep, setOtpReturnStep] = React.useState<
    "packages" | "review" | "payment"
  >("payment");
  const [otpDialogOpen, setOtpDialogOpen] = React.useState(false);

  const initialStep: StepType = getInitialBookingStep({
    flow,
    flowOrder,
    lockServiceId,
    lockMemberId,
    lockCustomerPackageId,
    selectedOption: lockServiceId
      ? appointmentOptions.find((option) => option._id === lockServiceId)
      : undefined,
    activeStaffCount: getActiveStaffForAssignments(
      (lockServiceId
        ? appointmentOptions.find((option) => option._id === lockServiceId)
        : undefined
      )?.staff,
      members,
      undefined,
      undefined,
    ).length,
  });

  const [currentStep, setCurrentStep] = React.useState<StepType>(initialStep);
  const locksBootstrapped = React.useRef(!lockServiceId && !lockMemberId);

  React.useEffect(() => {
    if (locksBootstrapped.current) return;
    if (areAppointmentOptionsLoading) return;

    const option = lockServiceId
      ? appointmentOptions.find((item) => item._id === lockServiceId)
      : undefined;
    if (option) setSelectedAppointmentOption(option);
    if (lockMemberId) setSelectedMemberId(lockMemberId);

    setCurrentStep(
      getInitialBookingStep({
        flow,
        flowOrder,
        lockServiceId,
        lockMemberId,
        lockCustomerPackageId,
        selectedOption: option,
        activeStaffCount: getActiveStaffForAssignments(
          option?.staff,
          members,
          undefined,
          undefined,
        ).length,
      }),
    );
    locksBootstrapped.current = true;
  }, [
    areAppointmentOptionsLoading,
    appointmentOptions,
    lockServiceId,
    lockMemberId,
    lockCustomerPackageId,
    flowOrder,
    flow,
    members,
  ]);

  const [dateTime, setDateTime] = React.useState<DateTime | undefined>(
    undefined,
  );

  const [selectedAddons, setSelectedAddons] = React.useState<
    AppointmentAddon[]
  >([]);

  React.useEffect(() => {
    if (!selectedAddons.length || !selectedMemberId) return;
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

  const [availabilityByMember, setAvailabilityByMember] =
    React.useState<AvailabilityByMember>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [fields, setFields] = React.useState<AppointmentFields>({
    name: "",
    email: "",
    phone: "",
  });

  React.useEffect(() => {
    if (!waitlistOffer) return;
    if (waitlistOffer.memberId) {
      setSelectedMemberId(waitlistOffer.memberId);
    }

    if (waitlistOffer.duration) {
      setDuration(waitlistOffer.duration);
    }

    setFields((current) => ({ ...current, ...waitlistOffer.fields }));
    const addons = selectedAppointmentOption?.addons?.filter((addon) =>
      waitlistOffer.addonsIds?.includes(addon._id),
    );

    if (addons?.length) {
      setSelectedAddons(addons);
    }

    setDateTime(waitlistOfferSlotToDateTime(waitlistOffer.dateTime, timeZone));
  }, [
    waitlistOffer,
    selectedAppointmentOption?._id,
    selectedAppointmentOption?.addons,
    timeZone,
  ]);

  React.useEffect(() => {
    if (packageBookingFlow) return;
    setOtpVerified(false);
  }, [fields.email, fields.phone, packageBookingFlow]);

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

  const getTotalDurationForMember = useCallback(
    (memberId: string | null) => {
      if (!selectedAppointmentOption) return undefined;

      const selectedStaff = memberId
        ? activeStaff.find((s) => s.member.id === memberId)
        : undefined;

      let baseDuration =
        selectedAppointmentOption.durationType === "fixed"
          ? (selectedStaff?.effectiveDuration ??
            selectedAppointmentOption.duration)
          : duration;
      if (!baseDuration) {
        baseDuration =
          selectedAppointmentOption.durationType === "fixed"
            ? selectedAppointmentOption.duration
            : selectedAppointmentOption.durationMin;
      }
      if (!baseDuration) return undefined;

      const addonsDuration = (selectedAddons || []).reduce((sum, addon) => {
        if (!isAddonAvailableForMember(addon.staff, memberId)) return sum;
        return (
          sum +
          (effectiveAddonDuration(addon.duration, addon.staff, memberId) || 0)
        );
      }, 0);

      return baseDuration + addonsDuration;
    },
    [selectedAppointmentOption, activeStaff, duration, selectedAddons],
  );

  const getTotalDuration = useCallback(
    () => getTotalDurationForMember(selectedMemberId),
    [getTotalDurationForMember, selectedMemberId],
  );

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
    getTotalDuration,
    errors.submitWaitlistTitle,
    errors.submitWaitlistDescription,
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
        data: waitlistTokenParam
          ? { waitlistToken: waitlistTokenParam }
          : undefined,
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
      waitlistTokenParam,
    ],
  );

  const router = useRouter();

  const fetchAvailability = useCallback(
    async (memberIdOverride?: string | null, durationOverride?: number) => {
      if (errors.fetchTitle === "booking.availability.fetchFailedTitle") return;

      const resolvedMemberId =
        memberIdOverride ??
        selectedMemberId ??
        (activeStaff.length === 1 ? activeStaff[0].member.id : null);

      if (resolvedMemberId && resolvedMemberId !== selectedMemberId) {
        setSelectedMemberId(resolvedMemberId);
      }

      // Keep multi-member fetch whenever Any is selected, even if a concrete
      // member was picked on the calendar (back→forward must show the picker again).
      const fetchMulti = isAnySpecialist && activeStaff.length > 1;

      setIsLoading(true);
      setAvailabilityByMember({});
      if (!waitlistOffer) {
        setDateTime(undefined);
      }

      try {
        if (fetchMulti) {
          const requests = activeStaff
            .map((staff) => {
              const memberId = staff.member.id;
              const canFulfillAddons = (selectedAddons || []).every((addon) =>
                isAddonAvailableForMember(addon.staff, memberId),
              );
              if (!canFulfillAddons) return null;
              const memberDuration = getTotalDurationForMember(memberId);
              if (!memberDuration) return null;
              return { memberId, duration: memberDuration };
            })
            .filter((r): r is { memberId: string; duration: number } => !!r);

          if (!requests.length) {
            setAvailabilityByMember({});
            return;
          }

          const data = await clientApi.availability.getAvailability({
            memberIds: requests.map((r) => r.memberId),
            durations: requests.map((r) => r.duration),
          });
          setAvailabilityByMember(data);
          return;
        }

        const totalDuration =
          durationOverride ?? getTotalDurationForMember(resolvedMemberId);
        if (!totalDuration || !resolvedMemberId) return;

        const data = await clientApi.availability.getAvailability({
          memberIds: [resolvedMemberId],
          durations: [totalDuration],
        });

        setAvailabilityByMember(data);
        const slots = data[resolvedMemberId] ?? [];
        if (
          waitlistOffer &&
          !isWaitlistOfferSlotAvailable(slots, waitlistOffer.dateTime)
        ) {
          setDateTime(undefined);
        }
      } catch (e) {
        console.error(e);

        setAvailabilityByMember({});
        toast.error(errors.fetchTitle, {
          description: errors.fetchDescription,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      getTotalDurationForMember,
      errors.fetchTitle,
      errors.fetchDescription,
      selectedMemberId,
      activeStaff,
      waitlistOffer,
      isAnySpecialist,
      selectedAddons,
    ],
  );

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

  const didFetchInitialAvailability = React.useRef(false);
  React.useEffect(() => {
    if (didFetchInitialAvailability.current) return;
    if (currentStep !== "calendar") return;
    if (!selectedAppointmentOption) return;

    const memberId =
      selectedMemberId ??
      (activeStaff.length === 1 ? activeStaff[0].member.id : null);

    if (!memberId && !(isAnySpecialist && activeStaff.length > 1)) return;

    didFetchInitialAvailability.current = true;
    void fetchAvailability(memberId);
  }, [
    currentStep,
    selectedAppointmentOption,
    selectedMemberId,
    activeStaff,
    isAnySpecialist,
    fetchAvailability,
  ]);

  const handleNewBooking = useCallback(() => {
    const option = lockServiceId
      ? appointmentOptions.find((item) => item._id === lockServiceId)
      : undefined;
    setFlow(isOnlyWaitlist ? "waitlist" : "booking");
    setCurrentStep(
      getInitialBookingStep({
        flow: isOnlyWaitlist ? "waitlist" : "booking",
        flowOrder,
        lockServiceId,
        lockMemberId,
        lockCustomerPackageId,
        selectedOption: option,
        activeStaffCount: getActiveStaffForAssignments(
          option?.staff,
          members,
          undefined,
          undefined,
        ).length,
      }),
    );
    setSelectedAppointmentOption(option);
    setSelectedMemberId(lockMemberId ?? null);
    setIsAnySpecialist(false);
    didFetchInitialAvailability.current = false;
    setSelectedAddons([]);
    setDuration(undefined);
    setDateTime(undefined);
    setWaitlistTimes({
      asSoonAsPossible: false,
      dates: [],
    });
    setAvailabilityByMember({});
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
  }, [
    isOnlyWaitlist,
    flowOrder,
    lockServiceId,
    lockMemberId,
    lockCustomerPackageId,
    appointmentOptions,
    members,
  ]);

  const fetchPaymentInformation = useCallback(
    async (tipAmount?: number): Promise<CollectPayment | null> => {
      const request = getAppointmentRequest();
      if (!request) throw new Error("Failed to build appointment request");

      const intentId = paymentInformation?.intent?._id;
      const body = {
        request,
        type: "deposit",
        ...(typeof tipAmount === "number" && tipAmount > 0
          ? { tipAmount }
          : {}),
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
    },
    [
      getAppointmentRequest,
      paymentInformation?.intent?._id,
      errors.fetchPaymentInformationTitle,
      errors.fetchPaymentInformationDescription,
    ],
  );

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
      dontAllowAnySpecialist,
      lockServiceId,
      lockMemberId,
      isAnySpecialist,
      setIsAnySpecialist,
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
      availabilityByMember,
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
      packageBookingFlow,
      setPackageBookingFlow,
      isCustomerPackageLocked: packageBookingFlow && !!customerPackageId,
      requireCustomerOtp,
      hasActiveCustomerPackages: !!hasActiveCustomerPackages && !lockServiceId,
      otpVerified,
      setOtpVerified,
      otpReturnStep,
      setOtpReturnStep,
      otpDialogOpen,
      setOtpDialogOpen,
      refreshBookingOptions,
    }),
    [
      appointmentOptions,
      areAppointmentOptionsLoading,
      members,
      flowOrder,
      dontAllowAnySpecialist,
      lockServiceId,
      lockMemberId,
      isAnySpecialist,
      setIsAnySpecialist,
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
      availabilityByMember,
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
      packageBookingFlow,
      requireCustomerOtp,
      hasActiveCustomerPackages,
      lockServiceId,
      lockMemberId,
      otpVerified,
      otpReturnStep,
      otpDialogOpen,
      refreshBookingOptions,
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
