"use client";

import { clientApi, ClientApiError } from "@hacado/api-sdk";
import { TranslationKeys, useI18n } from "@hacado/i18n/client";
import type {
  ApplyGiftCardsSuccessResponse,
  Availability,
  CollectPayment,
  CreateOrUpdatePaymentIntentRequest,
  DateTime,
  ModifyAppointmentInformation,
  ModifyAppointmentReason,
  ModifyAppointmentRequest,
  ModifyAppointmentType,
} from "@hacado/types";
import { AutoSkeleton, Button, cn, toast } from "@hacado/ui";
import { DateTime as LuxonDateTime } from "luxon";
import React, { useMemo } from "react";
import {
  getAppointmentByIdAction,
  getModifyInformationAction,
  SessionExpiredError,
} from "../../actions";
import { useCustomerProfile } from "../../customer-profile-context";
import { useOnSessionExpired } from "../../session-expired-context";
import { CabinetModifyContext, StepType } from "./context";
import { CabinetModifyLayout } from "./layout";

export type CabinetModifyScreenProps = {
  appId: string;
  appointmentId: string;
  action: ModifyAppointmentType;
  scrollToTop?: boolean;
  className?: string;
  isEditor?: boolean;
};

export const CabinetModifyScreen: React.FC<CabinetModifyScreenProps> = ({
  appId,
  appointmentId,
  action,
  scrollToTop,
  className,
  isEditor,
}) => {
  const i18n = useI18n("translation");

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
      submitTitle: i18n(`modification.submitFailed.${action}.title`),
      submitDescription: i18n(
        `modification.submitFailed.${action}.description`,
      ),
      timeNotAvailableDescription: i18n(
        "booking.submitEvent.timeNotAvailableDescription",
      ),
    }),
    [i18n, action],
  );

  const {
    customer: customerProfile,
    timezone,
    setTimeZone,
  } = useCustomerProfile();
  const onSessionExpired = useOnSessionExpired();

  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [notAllowedReason, setNotAllowedReason] =
    React.useState<ModifyAppointmentReason | null>(null);

  const [currentStep, setCurrentStep] = React.useState<StepType>(
    action === "reschedule" ? "calendar" : "review",
  );
  const [dateTime, setDateTime] = React.useState<DateTime | undefined>(
    undefined,
  );
  const [appointment, setAppointment] = React.useState<
    ModifyAppointmentInformation | undefined
  >(undefined);

  const [appointmentEmail, setAppointmentEmail] = React.useState<
    string | undefined
  >(undefined);
  const [availability, setAvailability] = React.useState<Availability>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [paymentInformation, setPaymentInformation] =
    React.useState<CollectPayment | null>();
  const [giftCards, setGiftCards] =
    React.useState<ApplyGiftCardsSuccessResponse["giftCards"]>();
  const [isModificationConfirmed, setIsModificationConfirmed] =
    React.useState(false);

  const newDateTime = useMemo(
    () =>
      !!dateTime
        ? LuxonDateTime.fromObject(
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
        : undefined,
    [dateTime],
  );

  const fetchAvailability = async (
    appt: ModifyAppointmentInformation | undefined,
  ) => {
    if (!appt || !appt.allowed || !appt.duration) return;
    setIsLoading(true);
    try {
      const data = await clientApi.availability.getAvailability({
        duration: appt.duration,
      });
      setAvailability(data);
    } catch (e) {
      console.error(e);
      setAvailability([]);
      toast.error(errors.fetchTitle, { description: errors.fetchDescription });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const apptRes = await getAppointmentByIdAction(appId, appointmentId);

        if (!mounted) return;

        const appt = apptRes.appointment;

        const modifyInfo = await getModifyInformationAction({
          type: action,
          appointmentId,
        });

        if (!mounted) return;

        if (!modifyInfo.allowed) {
          setNotAllowedReason(modifyInfo.reason);
          return;
        }

        setAppointment(modifyInfo);
        setAppointmentEmail(appt.fields.email);

        if (action === "reschedule") {
          await fetchAvailability(modifyInfo);
        }
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          onSessionExpired();
          return;
        }
        if (mounted) {
          toast.error(errors.fetchTitle, {
            description: errors.fetchDescription,
          });
        }
      } finally {
        if (mounted) setIsInitialLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [appId, appointmentId, action]);

  const applyGiftCards = async (
    codes: string[],
    amount: number,
  ): Promise<ApplyGiftCardsSuccessResponse["giftCards"] | undefined> => {
    const data = await clientApi.giftCards.applyGiftCards({ codes, amount });
    if (data.success) {
      setGiftCards(data.giftCards);
      return data.giftCards;
    }
    throw new Error(data.error);
  };

  const fetchPaymentInformation = async (): Promise<CollectPayment | null> => {
    if (!appointment) throw new Error("Appointment not available");
    const intentId = paymentInformation?.intent?._id;

    try {
      let request: ModifyAppointmentRequest;
      if (action === "reschedule") {
        if (!newDateTime) throw new Error("Date time is required");
        request = {
          dateTime: newDateTime.toUTC().toJSDate(),
          type: action,
          giftCards: giftCards?.map((g) => g.code),
        } satisfies ModifyAppointmentRequest;
      } else {
        request = {
          type: action,
          giftCards: giftCards?.map((g) => g.code),
        } satisfies ModifyAppointmentRequest;
      }

      const body = {
        appointmentId: appointment.id,
        request,
        type: action === "reschedule" ? "rescheduleFee" : "cancellationFee",
      } satisfies CreateOrUpdatePaymentIntentRequest;

      setIsLoading(true);
      const response = await (intentId
        ? clientApi.payments.updatePaymentIntent(intentId, body)
        : clientApi.payments.createPaymentIntent(body));

      return response;
    } catch (e) {
      toast.error(errors.fetchPaymentInformationTitle, {
        description: errors.fetchPaymentInformationDescription,
      });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (paymentIntentId?: string) => {
    if (!appointment || !appointment.allowed) return;

    setIsLoading(true);
    try {
      await clientApi.booking.modifyAppointment(appointment.id, {
        type: action,
        dateTime: newDateTime?.toUTC().toJSDate() as Date,
        paymentIntentId: paymentIntentId ?? paymentInformation?.intent?._id,
        giftCards: giftCards?.map((g) => g.code),
      } satisfies ModifyAppointmentRequest);

      setIsModificationConfirmed(true);
    } catch (e: any) {
      if (e instanceof ClientApiError && e.status === 400) {
        const error = await e.response.json();
        if (error.error === "time_not_available") {
          toast.error(errors.submitTitle, {
            description: errors.timeNotAvailableDescription,
          });
          await fetchAvailability(appointment);
          setDateTime(undefined);
          setCurrentStep(action === "reschedule" ? "calendar" : "review");
          return;
        }
      }

      console.error(e);
      toast.error(errors.submitTitle, {
        description: errors.submitDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (notAllowedReason) {
    const reasonKey =
      `modification.form.searchError.notAllowed.reason.${notAllowedReason}` as TranslationKeys;
    const reasonText = i18n.has(reasonKey) ? i18n(reasonKey) : notAllowedReason;
    return (
      <div
        className={cn(
          "max-w-3xl mx-auto text-center py-12 space-y-4 modify-not-allowed-container",
          className,
        )}
      >
        <h2 className="text-lg font-bold text-foreground modify-not-allowed-title">
          {i18n(`modification.form.notAllowed.${action}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground modify-not-allowed-reason">
          {reasonText}
        </p>
        <Button
          type="button"
          className="modify-not-allowed-back"
          variant="link-underline"
          size="md"
          onClick={() => {
            window.location.hash = "";
          }}
        >
          {i18n("common.buttons.back")}
        </Button>
      </div>
    );
  }

  return (
    <AutoSkeleton loading={isInitialLoading}>
      <CabinetModifyContext.Provider
        value={{
          appId,
          type: action,
          appointment,
          appointmentEmail,
          setAppointment,
          currentStep,
          setCurrentStep,
          fetchAvailability,
          dateTime,
          setDateTime,
          newDateTime,
          availability,
          onSubmit,
          paymentInformation,
          setPaymentInformation,
          fetchPaymentInformation,
          isModificationConfirmed,
          isLoading,
          setIsLoading,
          giftCards,
          setGiftCards,
          applyGiftCards,
          timeZone: timezone,
          setTimeZone,
          className,
          isEditor,
        }}
      >
        <CabinetModifyLayout scrollToTop={scrollToTop} className={className} />
      </CabinetModifyContext.Provider>
    </AutoSkeleton>
  );
};
