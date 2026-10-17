"use client";

import { adminApi } from "@hacado/api-sdk";
import { languages, type Language } from "@hacado/i18n";
import { template } from "@hacado/utils";
import React from "react";

const PLATFORM_SMS_FOOTER = "Txt STOP to unsubscribe";

const previewLanguages = new Set<string>(languages);

let previewArgsRequest: Promise<Record<string, unknown>> | undefined;

function loadSmsPreviewArgs() {
  if (!previewArgsRequest) {
    previewArgsRequest = adminApi.templates
      .getDemoTemplateArguments()
      .then((demo) => {
        const record = demo as Record<string, any>;
        const websiteUrl =
          typeof record.websiteUrl === "string"
            ? record.websiteUrl.replace(/\/$/, "")
            : "https://example.hacado.me";
        const optionName =
          typeof record.option?.name === "string" ? record.option.name : "Cut";
        const customerName =
          typeof record.fields?.name === "string" && record.fields.name.trim()
            ? record.fields.name.trim()
            : "Jessica";

        return {
          ...record,
          customerName,
          manageLink: `${websiteUrl}/my-cabinet`,
          bookingUrl: `${websiteUrl}/book`,
          paymentLinkUrl: `${websiteUrl}/pay`,
          waitlistEntry: { name: customerName, option: { name: optionName } },
          slotDateTime: record.dateTime,
        };
      })
      .catch((error) => {
        previewArgsRequest = undefined;
        throw error;
      });
  }

  return previewArgsRequest;
}

export function useSmsPreviewArgs() {
  const [args, setArgs] = React.useState<Record<string, unknown>>();

  React.useEffect(() => {
    let active = true;
    loadSmsPreviewArgs()
      .then((next) => {
        if (active) setArgs(next);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return args;
}

export function smsPreviewLanguage(args?: Record<string, unknown>): Language {
  const language = (args?.config as { language?: string } | undefined)
    ?.language;
  if (language && previewLanguages.has(language)) {
    return language as Language;
  }

  return "en";
}

export function renderBuiltInSms(body: string, args?: Record<string, unknown>) {
  if (!args) return undefined;

  try {
    const rendered = template(body, args, true).trim();
    if (!rendered) return undefined;

    return `${rendered}\n${PLATFORM_SMS_FOOTER}`;
  } catch {
    return undefined;
  }
}

export function SmsExample({ text }: { text?: string }) {
  if (!text) return null;

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap border-l-2 border-border pl-2">
      {text}
    </p>
  );
}
