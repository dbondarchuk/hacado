"use client";
import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentChoice,
  BookingRestriction,
  FieldSchema,
  getActiveStaffAcrossAssignments,
  isBookingLimitRestriction,
  PublicStaffMember,
} from "@hacado/types";
import { cn } from "@hacado/ui";
import { useSearchParams } from "next/navigation";
import React from "react";
import { BookingRestrictionBanner } from "../../components/booking-restriction-banner";
import { AppointmentsCard } from "./appointments-card";
import { FlowOrder } from "./context";
import { Schedule } from "./schedule";
import { SpecialistList } from "./specialist-card";

export type AppointmentsProps = {
  options: AppointmentChoice[];
  members?: PublicStaffMember[];
  flowOrder?: FlowOrder;
  optionsClassName?: string;
  successPage?: string;
  fieldsSchema: Record<string, FieldSchema>;
  showPromoCode?: boolean;
  bookingRestriction?: BookingRestriction;
  className?: string;
  id?: string;
  isEditor?: boolean;
};

export const Appointments: React.FC<
  AppointmentsProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  options,
  members = [],
  flowOrder = "service-first",
  optionsClassName,
  successPage,
  fieldsSchema,
  showPromoCode,
  bookingRestriction,
  className,
  id,
  isEditor,
  ...props
}) => {
  const i18n = useI18n("translation");
  const fromQuery = useSearchParams().get("option");
  const [option, setOption] = React.useState<string | null>(fromQuery);
  const isBookingRestricted = isBookingLimitRestriction(bookingRestriction);

  const staffAcrossOptions = React.useMemo(
    () =>
      getActiveStaffAcrossAssignments(
        options.map((o) => o.staff),
        members,
      ),
    [options, members],
  );

  const isSpecialistFirst =
    flowOrder === "specialist-first" && staffAcrossOptions.length > 0;

  const [specialistFirstMemberId, setSpecialistFirstMemberId] = React.useState<
    string | null
  >(null);

  const selected = options.find((m) => m._id === option);

  const availableOptions =
    isSpecialistFirst && specialistFirstMemberId
      ? options.filter(
          (o) =>
            !!o.staff?.length &&
            o.staff.some((s) => s.memberId === specialistFirstMemberId),
        )
      : options;

  if (selected) {
    return (
      <Schedule
        className={cn(className)}
        appointmentOption={selected}
        successPage={successPage}
        goBack={() => setOption(null)}
        fieldsSchema={fieldsSchema}
        showPromoCode={showPromoCode}
        bookingRestriction={bookingRestriction}
        id={id}
        isEditor={isEditor}
        members={members}
        flowOrder={flowOrder}
        preselectedMemberId={
          isSpecialistFirst ? specialistFirstMemberId : undefined
        }
        {...props}
      />
    );
  }

  if (isSpecialistFirst && !specialistFirstMemberId) {
    return (
      <div className={cn(className)} id={id}>
        {isBookingRestricted && <BookingRestrictionBanner className="mb-4" />}
        <div className="mb-6 text-center">
          <h2 className="text-xl">{i18n("booking.specialist.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {i18n("booking.specialist.choose")}
          </p>
        </div>
        <SpecialistList
          className={cn(optionsClassName)}
          staff={staffAcrossOptions.map((member) => ({ member }))}
          onSelect={setSpecialistFirstMemberId}
        />
      </div>
    );
  }

  return (
    <>
      {isBookingRestricted && (
        <BookingRestrictionBanner className={cn("mb-4", className)} />
      )}
      <AppointmentsCard
        options={availableOptions}
        members={members}
        onSelectOption={setOption}
        className={cn(className, optionsClassName)}
        id={id}
        isBookingRestricted={isBookingRestricted}
        {...props}
      />
      {isSpecialistFirst && specialistFirstMemberId && (
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => setSpecialistFirstMemberId(null)}
          >
            {i18n("common.buttons.back")}
          </button>
        </div>
      )}
    </>
  );
};
