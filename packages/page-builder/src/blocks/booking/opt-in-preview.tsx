"use client";

import { useI18n } from "@hacado/i18n/client";
import type { AppointmentFields } from "@hacado/types/booking";
import { Button } from "@hacado/ui/button";
import {
  ConfigContext,
  TextMessagingProvider,
  useConfig,
  useTimeZone,
  useWebsiteUrl,
} from "@hacado/ui/context";
import { useContext, useMemo, useState } from "react";

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

/** Light theme tokens so html-to-image stays readable when admin is in dark mode. */
const lightThemeStyle = {
  colorScheme: "light",
  backgroundColor: "#ffffff",
  color: "hsl(60 4.9% 12%)",
  ["--background" as string]: "0 0% 100%",
  ["--foreground" as string]: "60 4.9% 12%",
  ["--card" as string]: "0 0% 100%",
  ["--card-foreground" as string]: "60 4.9% 12%",
  ["--popover" as string]: "0 0% 100%",
  ["--popover-foreground" as string]: "60 4.9% 12%",
  ["--primary" as string]: "105 6.1% 12.9%",
  ["--primary-foreground" as string]: "42.9 33.3% 95.9%",
  ["--secondary" as string]: "37.5 42.1% 92.5%",
  ["--secondary-foreground" as string]: "60 4.9% 12%",
  ["--muted" as string]: "42.9 33.3% 95.9%",
  ["--muted-foreground" as string]: "46.7 3.9% 44.9%",
  ["--accent" as string]: "99 31.2% 87.5%",
  ["--accent-foreground" as string]: "109.1 15.3% 28.2%",
  ["--destructive" as string]: "0 72.2% 50.6%",
  ["--destructive-foreground" as string]: "0 0% 100%",
  ["--border" as string]: "48 15.6% 87.5%",
  ["--input" as string]: "48 15.6% 87.5%",
  ["--ring" as string]: "105 6.1% 12.9%",
} as const;

export const SmsOptInPreview = ({
  service,
  formFields,
  businessTitle,
}: SmsOptInPreviewProps) => {
  const t = useI18n("translation");
  const timeZone = useTimeZone();
  const parentConfig = useContext(ConfigContext);
  const config = useConfig();
  const websiteUrl = useWebsiteUrl();
  const title = businessTitle?.trim() || config.name;
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
        style={lightThemeStyle}
      >
        <ConfigContext.Provider
          value={{
            ...parentConfig,
            config: { ...parentConfig.config, name: title },
            websiteUrl,
            textMessaging: { enabled: true },
          }}
        >
          <TextMessagingProvider value={{ enabled: true }}>
            <SmsConsentLookupContext.Provider value={lookupDeclines}>
              <ScheduleContext.Provider value={value as never}>
                {title ? (
                  <p className="mb-3 text-base font-semibold leading-snug text-foreground">
                    {title}
                  </p>
                ) : null}
                <FormCard />
                <div className="mt-4 flex justify-end">
                  <Button type="button" tabIndex={-1} className="next-button">
                    {t("common.buttons.confirmBooking")}
                  </Button>
                </div>
              </ScheduleContext.Provider>
            </SmsConsentLookupContext.Provider>
          </TextMessagingProvider>
        </ConfigContext.Provider>
      </div>
    </div>
  );
};
