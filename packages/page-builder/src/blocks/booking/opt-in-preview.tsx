"use client";

import type { AppointmentFields } from "@hacado/types";
import { useTimeZone } from "@hacado/ui";
import { useMemo, useState } from "react";

import { ScheduleContext } from "./modern/components/context";
import { FormCard } from "./modern/components/form-card";
import type { SmsOptInPreviewProps } from "./opt-in-preview-types";
import { SmsConsentLookupContext } from "./sms-consent-lookup";
import { demoBookingOptionsResponse } from "./utils/fixtures";

export type { SmsOptInPreviewProps } from "./opt-in-preview-types";

const sampleFields: AppointmentFields = {
  name: "Alex Rivera",
  email: "alex@example.com",
  phone: "+12025550123",
};

const forcedOffer = {
  notifications: true,
  reminders: true,
  other: false,
};

const lookupDeclines = async () => false;
const fixtureService = demoBookingOptionsResponse.options[0];

export const SmsOptInPreview = ({
  service,
  formFields,
}: SmsOptInPreviewProps) => {
  const timeZone = useTimeZone();
  const [fields, setFields] = useState(sampleFields);
  const dateTime = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(15, 0, 0, 0);
    return {
      date,
      time: { hour: 15, minute: 0 },
      timeZone,
    };
  }, [timeZone]);

  const value = {
    dateTime,
    fields,
    setFields,
    formFields,
    smsText: forcedOffer,
    flowOrder: "service-first",
    currentStep: "form",
    activeStaff: [],
    appointmentOptions: [],
    members: [],
    selectedMemberId: null,
    selectedAddons: [],
    selectedAppointmentOption: service ?? {
      _id: fixtureService._id,
      name: fixtureService.name,
    },
    setDiscount: () => {},
    setIsFormValid: () => {},
    isCustomerPackageLocked: false,
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[-1] opacity-0"
    >
      <div
        data-sms-opt-in-preview
        className="w-[440px] bg-white p-4 text-left text-foreground"
      >
        <SmsConsentLookupContext.Provider value={lookupDeclines}>
          <ScheduleContext.Provider value={value as never}>
            <FormCard />
          </ScheduleContext.Provider>
        </SmsConsentLookupContext.Provider>
      </div>
    </div>
  );
};
