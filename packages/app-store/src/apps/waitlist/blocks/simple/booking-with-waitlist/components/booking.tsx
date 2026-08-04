"use client";
import { clientApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { GetAppointmentOptionsResponse } from "@timelish/types";
import { Skeleton } from "@timelish/ui";
import React from "react";
import { demoBookingOptionsResponse } from "../../../../components/fixtures";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import { Appointments } from "./appointments";
import { BookingWithWaitlistProps } from "./types";

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

  if (!response)
    return (
      <div className={className} id={id} {...props}>
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
      </div>
    );

  return (
    <Appointments
      id={id}
      {...props}
      className={className}
      options={response.options}
      members={response.members}
      flowOrder={flowOrder ?? "service-first"}
      successPage={successPage ?? undefined}
      fieldsSchema={response.fieldsSchema}
      showPromoCode={response.showPromoCode}
      bookingRestriction={response.bookingRestriction}
      isEditor={isEditor}
      appId={appId}
      isOnlyWaitlist={isOnlyWaitlist ?? false}
    />
  );
};
