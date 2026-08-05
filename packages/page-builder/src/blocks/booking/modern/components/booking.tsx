"use client";
import { clientApi } from "@hacado/api-sdk";
import { GetAppointmentOptionsResponse } from "@hacado/types";
import React from "react";
import { demoBookingOptionsResponse } from "../../utils/fixtures";
import { FlowOrder } from "./context";
import { Schedule } from "./schedule";

export type BookingProps = {
  successPage?: string | null;
  className?: string;
  scrollToTop?: boolean | null;
  hideTitle?: boolean | null;
  hideSteps?: boolean | null;
  flowOrder?: FlowOrder | null;
};

export const Booking: React.FC<
  BookingProps & {
    id?: string;
    isEditor?: boolean;
  } & React.HTMLAttributes<HTMLDivElement>
> = ({
  successPage,
  className,
  id,
  isEditor,
  scrollToTop,
  hideTitle,
  hideSteps,
  flowOrder,
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
      className={className}
      scrollToTop={scrollToTop ?? false}
      hideTitle={hideTitle ?? false}
      hideSteps={hideSteps ?? false}
      bookingRestriction={response?.bookingRestriction}
    />
  );
};
