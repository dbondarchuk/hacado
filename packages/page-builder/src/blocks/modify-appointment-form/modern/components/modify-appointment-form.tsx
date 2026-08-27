"use client";

import { clientApi, ClientApiError } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import type {
  ApplyGiftCardsSuccessResponse,
  CollectPayment,
  CreateOrUpdatePaymentIntentRequest,
  DateTime,
  ModifyAppointmentRequest,
} from "@hacado/types";
import { Availability, ModifyAppointmentInformation } from "@hacado/types";
import { toast, useTimeZone, useUseClientTimezone } from "@hacado/ui";
import { DateTime as LuxonDateTime } from "luxon";
import React, { useMemo } from "react";
import { ModifyAppointmentFields, ModifyAppointmentType } from "../../types";
import { ModifyAppointmentFormContext, StepType } from "./context";
import { ModifyAppointmentFormLayout } from "./layout";

export type ModifyAppointmentFormProps = {
  className?: string;
  id?: string;
  isEditor?: boolean;
  scrollToTop?: boolean | null;
  hideTitle?: boolean | null;
  hideSteps?: boolean | null;
};

export const ModifyAppointmentForm: React.FC<
  ModifyAppointmentFormProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  className,
  id,
  isEditor,
  scrollToTop,
  hideTitle,
  hideSteps,
  ...props
}) => {
  const i18n = useI18n("translation");
  const [type, setType] = React.useState<ModifyAppointmentType>();

  const configTimeZone = useTimeZone();
  const useClientTimezone = useUseClientTimezone();
  const [timeZone, setTimeZone] = React.useState<string>(
    useClientTimezone ? LuxonDateTime.now().zoneName! : configTimeZone,
  );

  const errors = React.useMemo(
    () => ({
      fetchTitle: i18n("booking.availability.fetchFailedTitle"),
      fetchDescription: i18n("booking.availability.fetchFailedDescription"),
      fetchAppointmentTitle: i18n("modification.appointmentFetchFailed.title"),
      fetchAppointmentDescription: i18n(
        "modification.appointmentFetchFailed.description",
      ),
      fetchPaymentInformationTitle: i18n(
        "booking.payment.informationFetchFailedTitle",
      ),
      fetchPaymentInformationDescription: i18n(
        "booking.payment.informationFetchFailedDescription",
      ),
      submitTitle: i18n(`modification.submitFailed.${type ?? "cancel"}.title`),
      submitDescription: i18n(
        `modification.submitFailed.${type ?? "cancel"}.description`,
      ),
      timeNotAvailableDescription: i18n(
        "booking.submitEvent.timeNotAvailableDescription",
      ),
    }),
    [i18n, type],
  );

  const [currentStep, setCurrentStep] = React.useState<StepType>("type");
  const [searchError, setSearchError] = React.useState<
    "notFound" | "notAllowed" | undefined
  >(undefined);
  // const [confirmedByUser, setConfirmedByUser] = React.useState(false);
  const [dateTime, setDateTime] = React.useState<DateTime | undefined>(
    undefined,
  );

  const [appointment, setAppointment] = React.useState<
    ModifyAppointmentInformation | undefined
  >(undefined);
  const [availability, setAvailability] = React.useState<Availability>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fields, setFields] = React.useState<ModifyAppointmentFields>({
    dateTime: new Date(),
  });
  const [isOtpVerified, setIsOtpVerified] = React.useState(false);

  React.useEffect(() => {
    clientApi.customerAuth
      .checkSession()
      .then(() => setIsOtpVerified(true))
      .catch(() => setIsOtpVerified(false));
  }, []);

  const [paymentInformation, setPaymentInformation] =
    React.useState<CollectPayment | null>();

  const [giftCards, setGiftCards] =
    React.useState<ApplyGiftCardsSuccessResponse["giftCards"]>();

  const [isFormValid, setIsFormValid] = React.useState(false);
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

  const fetchAppointment = async () => {
    setIsLoading(true);
    try {
      if (!type) {
        throw new Error("Type is required");
      }

      const data = await clientApi.booking.getModifyAppointmentInformation({
        lookup: "dateTime",
        type,
        dateTime: fields.dateTime,
      });

      setAppointment(data);
      setGiftCards(undefined);

      return data;
    } catch (e: any) {
      let notFound = false;
      let message = "";
      if (typeof e === "object" && e && "response" in e) {
        try {
          const error = await e.response.json();
          if (error.error === "appointment_not_found") {
            notFound = true;
            return undefined;
          }

          message = error.response.statusText;
        } catch {}
      } else {
        message = e;
      }

      console.error(e);
      toast.error(notFound ? errors.fetchAppointmentTitle : errors.fetchTitle, {
        description: notFound
          ? errors.fetchAppointmentDescription
          : errors.fetchDescription,
      });

      setAppointment(undefined);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

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
    const intentId = paymentInformation?.intent?._id;
    try {
      let request: ModifyAppointmentRequest;
      if (!type) {
        throw new Error("Type is required");
      }

      if (type === "reschedule") {
        if (!newDateTime) {
          throw new Error("Date time is required");
        }

        request = {
          dateTime: newDateTime.toUTC().toJSDate(),
          type,
          giftCards: giftCards?.map((g) => g.code),
        } satisfies ModifyAppointmentRequest;
      } else {
        request = {
          type,
          giftCards: giftCards?.map((g) => g.code),
        } satisfies ModifyAppointmentRequest;
      }

      if (!appointment?.id) throw new Error("Appointment is required");

      const body = {
        appointmentId: appointment.id,
        request,
        type: type === "reschedule" ? "rescheduleFee" : "cancellationFee",
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

  const fetchAvailability = async (
    appointment: ModifyAppointmentInformation | undefined,
  ) => {
    if (!appointment || !appointment.allowed || !appointment.duration) return;

    if (errors.fetchTitle === "booking.availability.fetchFailedTitle") return;

    setIsLoading(true);

    try {
      const data = await clientApi.availability.getAvailability({
        duration: appointment.duration,
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

  const onSubmit = async (paymentIntentId?: string) => {
    setIsLoading(true);
    if (!appointment || !appointment.allowed) return;

    try {
      if (!type) {
        throw new Error("Type is required");
      }

      if (type === "reschedule" && !newDateTime) {
        throw new Error("Date time is required");
      }

      await clientApi.booking.modifyAppointment(appointment.id, {
        type,
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
          setCurrentStep(type === "reschedule" ? "calendar" : "type");
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

  // React.useEffect(() => {
  //   topRef?.current?.scrollIntoView();
  // }, [step]);

  return (
    <ModifyAppointmentFormContext.Provider
      value={{
        appointment,
        setAppointment,
        type: type as ModifyAppointmentType,
        setType,
        currentStep,
        setCurrentStep,
        fetchAvailability,
        fields,
        setFields,
        onSubmit,
        setDateTime,
        fetchAppointment,
        paymentInformation,
        setPaymentInformation,
        fetchPaymentInformation,
        dateTime,
        newDateTime,
        availability,
        isFormValid,
        setIsFormValid,
        className,
        isEditor,
        isModificationConfirmed,
        isLoading,
        setIsLoading,
        searchError,
        setSearchError,
        giftCards,
        setGiftCards,
        applyGiftCards,
        timeZone,
        setTimeZone,
        isOtpVerified,
        setIsOtpVerified,
      }}
    >
      <ModifyAppointmentFormLayout
        scrollToTop={scrollToTop ?? false}
        hideTitle={hideTitle ?? false}
        hideSteps={hideSteps ?? false}
        className={className}
        {...props}
      />
    </ModifyAppointmentFormContext.Provider>
  );
};
