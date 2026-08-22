"use client";
import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { GetAppointmentOptionsResponse } from "@hacado/types";
import { Skeleton } from "@hacado/ui";
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

  const loadOptions = React.useCallback(async () => {
    const data = await clientApi.booking.getBookingOptions();
    setResponse(data);
  }, []);

  React.useEffect(() => {
    if (!isEditor) {
      void loadOptions();
    } else {
      setResponse(demoBookingOptionsResponse);
    }
  }, [isEditor, loadOptions]);

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
      catalog={response.catalog}
      packages={response.packages}
      isEditor={isEditor}
      appId={appId}
      isOnlyWaitlist={isOnlyWaitlist ?? false}
      requireCustomerOtp={response.requireCustomerOtp}
      hasActiveCustomerPackages={response.hasActiveCustomerPackages}
      refreshBookingOptions={isEditor ? undefined : loadOptions}
    />
  );
};
