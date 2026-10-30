"use client";

import { adminApi } from "@hacado/api-sdk";
import { languages, type Language } from "@hacado/i18n";
import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui/cn";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@hacado/ui/form";
import { Link } from "@hacado/ui/link";
import { Skeleton } from "@hacado/ui/skeleton";
import {
  appendSharedPoolSuffix,
  template as renderTemplate,
} from "@hacado/utils";
import React from "react";
import { TemplateSelector } from "./template-selector";

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
          typeof record.service?.name === "string"
            ? record.service.name
            : "Cut";

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
          waitlistEntry: {
            name: customerName,
            service: { name: optionName },
          },
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

function withSmsFooter(body: string, shared = false) {
  const trimmed = body.trim();
  if (!trimmed) return undefined;
  const text = shared ? appendSharedPoolSuffix(trimmed) : trimmed;
  if (text.endsWith(PLATFORM_SMS_FOOTER)) return text;

  return `${text}\n${PLATFORM_SMS_FOOTER}`;
}

export function renderBuiltInSms(
  body: string,
  args?: Record<string, unknown>,
  shared = false,
) {
  if (!args) return undefined;

  try {
    return withSmsFooter(renderTemplate(body, args, true), shared);
  } catch {
    return undefined;
  }
}

export function SmsExample({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  if (!text) return null;

  return (
    <p
      className={cn(
        "text-sm text-muted-foreground whitespace-pre-wrap border-l-2 border-border pl-2 overflow-hidden",
        className,
      )}
    >
      {text}
    </p>
  );
}

export function CustomTextTemplateSelect({
  value,
  onChange,
  disabled,
  loading,
  className,
}: {
  value?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const t = useI18n("admin");

  return (
    <FormItem className={className}>
      <FormLabel>{t("settings.textMessaging.customTemplate.label")}</FormLabel>
      <FormControl>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <TemplateSelector
            type="text-message"
            allowClear
            disabled={disabled}
            value={value}
            onItemSelect={onChange}
          />
        )}
      </FormControl>
      <FormDescription>
        {t("settings.textMessaging.customTemplate.tooltip")}
      </FormDescription>
    </FormItem>
  );
}

export function SmsMessagePreview({
  templateId,
  allowCustom,
  args,
  fallback,
  className,
}: {
  templateId?: string;
  allowCustom: boolean;
  args?: Record<string, unknown>;
  fallback?: string;
  className?: string;
}) {
  const t = useI18n("admin");
  const customId = allowCustom && templateId ? templateId : undefined;
  const [preview, setPreview] = React.useState<
    | { status: "ready"; text: string }
    | { status: "failed" }
    | { status: "loading" }
  >({ status: "loading" });

  React.useEffect(() => {
    if (!customId) return;

    let active = true;
    setPreview({ status: "loading" });
    adminApi.templates
      .getTemplate(customId)
      .then((stored) => {
        if (!active) return;
        if (!args) {
          setPreview({ status: "loading" });
          return;
        }

        if (
          stored.type !== "text-message" ||
          typeof stored.value !== "string"
        ) {
          setPreview({ status: "failed" });
          return;
        }

        try {
          const text = withSmsFooter(renderTemplate(stored.value, args, true));
          setPreview(text ? { status: "ready", text } : { status: "failed" });
        } catch {
          setPreview({ status: "failed" });
        }
      })
      .catch(() => {
        if (active) setPreview({ status: "failed" });
      });

    return () => {
      active = false;
    };
  }, [args, customId]);

  if (!customId) {
    return <SmsExample text={fallback} className={className} />;
  }

  if (preview.status === "failed") {
    return (
      <p className={cn("text-sm text-destructive overflow-hidden", className)}>
        {t.rich("settings.textMessaging.customTemplate.renderFailed", {
          link: (chunks: React.ReactNode) => (
            <Link
              href={`/dashboard/templates/${customId}`}
              variant="underline"
              className="text-destructive hover:text-destructive"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    );
  }

  if (preview.status === "ready") {
    return <SmsExample text={preview.text} className={className} />;
  }

  return null;
}
