"use client";

import { clientApi } from "@hacado/api-sdk";
import { GetAppointmentOptionsResponse } from "@hacado/types";
import React from "react";
import { demoBookingOptionsResponse } from "../../../../../waitlist/components/fixtures";
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

  return (
    <Schedule
      {...props}
      appointmentOptions={response?.options ?? []}
      areAppointmentOptionsLoading={!response}
      members={response?.members ?? []}
      flowOrder="service-first"
      fieldsSchema={response?.fieldsSchema ?? {}}
      showPromoCode={response?.showPromoCode ?? false}
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
