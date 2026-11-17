"use client";

import { bookingApi } from "@hacado/api-sdk/client/booking";
import { GetAppointmentOptionsResponse } from "@hacado/types/booking";
import React from "react";
import { loadEditorBookingOptions } from "../../../../../waitlist/components/fixtures";
import { Schedule } from "./schedule";

export type CabinetBookScreenProps = {
  waitlistAppId?: string;
  lockCustomerPackageId?: string;
  scrollToTop?: boolean;
  className?: string;
  isEditor?: boolean;
};

export const CabinetBookScreen: React.FC<
  CabinetBookScreenProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  waitlistAppId,
  lockCustomerPackageId,
  scrollToTop,
  className,
  isEditor,
  ...props
}) => {
  const [response, setResponse] =
    React.useState<GetAppointmentOptionsResponse | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        const data = isEditor
          ? await loadEditorBookingOptions()
          : await bookingApi.getBookingOptions();

        if (!cancelled) setResponse(data);
      } catch (error) {
        console.error(error);
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [isEditor]);

  return (
    <Schedule
      {...props}
      appointmentOptions={response?.options ?? []}
      areAppointmentOptionsLoading={!response}
      members={response?.members ?? []}
      flowOrder="service-first"
      fieldsSchema={response?.fieldsSchema ?? {}}
      showPromoCode={response?.showPromoCode ?? false}
      smsText={response?.smsText}
      isEditor={isEditor}
      waitlistAppId={waitlistAppId}
      isOnlyWaitlist={false}
      className={className}
      scrollToTop={scrollToTop ?? true}
      hideTitle
      bookingRestriction={response?.bookingRestriction}
      catalog={response?.catalog}
      packages={response?.packages}
      lockCustomerPackageId={lockCustomerPackageId}
    />
  );
};
