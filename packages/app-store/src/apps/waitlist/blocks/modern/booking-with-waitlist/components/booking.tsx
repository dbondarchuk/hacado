"use client";
import { clientApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { GetAppointmentOptionsResponse } from "@timelish/types";
import React from "react";
import { demoBookingOptionsResponse } from "../../../../components/fixtures";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import { FlowOrder } from "./context";
import { Schedule } from "./schedule";

export type BookingWithWaitlistProps = {
  successPage?: string | null;
  flowOrder?: FlowOrder | null;
  className?: string;
  scrollToTop?: boolean | null;
  hideTitle?: boolean | null;
  hideSteps?: boolean | null;
};

export const BookingWithWaitlist: React.FC<
  BookingWithWaitlistProps & {
    id?: string;
    isEditor?: boolean;
    appId?: string;
    isOnlyWaitlist?: boolean;
  } & React.HTMLAttributes<HTMLDivElement>
> = ({
  successPage,
  flowOrder,
  className,
  id,
  isEditor,
  appId,
  isOnlyWaitlist,
  scrollToTop,
  hideTitle,
  hideSteps,
  ...props
}) => {
  const [response, setResponse] =
    React.useState<GetAppointmentOptionsResponse | null>(null);

  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  React.useEffect(() => {
    const loadOptions = async () => {
      const data = await clientApi.booking.getBookingOptions();
      setResponse(data);
    };

    if (!isEditor) {
      loadOptions();
    } else {
      setResponse(demoBookingOptionsResponse);
    }
  }, [isEditor]);

  if (!appId && isOnlyWaitlist) {
    return (
      <div className={className} id={id} {...props}>
        <h2 className="text-lg font-bold">
          {t("errors.waitlistAppNotConfigured.title")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("errors.waitlistAppNotConfigured.description")}
        </p>
      </div>
    );
  }

  return (
    <Schedule
      id={id}
      {...props}
      appointmentOptions={response?.options ?? []}
      areAppointmentOptionsLoading={!response}
      members={response?.members ?? []}
      flowOrder={flowOrder ?? "service-first"}
      successPage={successPage ?? undefined}
      fieldsSchema={response?.fieldsSchema ?? {}}
      showPromoCode={response?.showPromoCode ?? false}
      isEditor={isEditor}
      waitlistAppId={appId}
      isOnlyWaitlist={isOnlyWaitlist ?? false}
      className={className}
      scrollToTop={scrollToTop ?? false}
      hideTitle={hideTitle ?? false}
      hideSteps={hideSteps ?? false}
      bookingRestriction={response?.bookingRestriction}
    />
  );
};
