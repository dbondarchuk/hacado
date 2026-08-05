"use client";

import { authClient } from "@/app/auth-client";
import { AddOrUpdateAppButton } from "@/components/admin/apps/add-or-update-app-dialog";
import { DeleteAppButton } from "@/components/admin/apps/delete-app-button";
import { AppInstallUpgradeHint } from "@/components/admin/apps/store/app-install-upgrade-hint";
import { saveInstallPreferences } from "@/components/install/actions";
import { useInstallWizard } from "@/components/install/install-wizard-context";
import { FeatureUpgradeHint } from "@/lib/billing/feature-upgrade-hint";
import { getSessionPlanTier } from "@/lib/billing/subscription-plan-access";
import {
  APPOINTMENT_NOTIFICATIONS_APP_NAME,
  AvailableApps,
  BLOG_APP_NAME,
  CALDAV_APP_NAME,
  canInstallApp,
  CUSTOMER_EMAIL_NOTIFICATION_APP_NAME,
  CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME,
  FORMS_APP_NAME,
  GIFT_CARD_STUDIO_APP_NAME,
  GOOGLE_CALENDAR_APP_NAME,
  ICS_APP_NAME,
  MY_CABINET_APP_NAME,
  OUTLOOK_APP_NAME,
  WAITLIST_APP_NAME,
  WAITLIST_NOTIFICATIONS_APP_NAME,
} from "@hacado/app-store";
import { useI18n } from "@hacado/i18n/client";
import type { ConnectedApp } from "@hacado/types";
import { BillingPlanTier } from "@hacado/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  cn,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  toast,
} from "@hacado/ui";
import { ConnectedAppNameAndLogo } from "@hacado/ui-admin";
import { Unplug } from "lucide-react";
import { useEffect, useMemo } from "react";

function pickCalendarAppRow(
  apps: ConnectedApp[],
  appName: string,
): ConnectedApp | undefined {
  const matches = apps.filter((a) => a.name === appName);
  if (!matches.length) return undefined;
  return (
    matches.find((a) => a.status === "connected") ??
    matches.find((a) => a.status === "pending") ??
    matches[0]
  );
}

type CalendarCardProps = {
  appName: string;
  description: string;
  hint: string;
  connected: ConnectedApp | undefined;
  canConnect: boolean;
};

function CalendarIntegrationCard({
  appName,
  description,
  hint,
  connected,
  canConnect,
}: CalendarCardProps) {
  const t = useI18n("install");
  const tApps = useI18n("apps");
  const meta = AvailableApps[appName];
  const blockNewConnect = Boolean(
    meta && "dontAllowMultiple" in meta && meta.dontAllowMultiple && connected,
  );
  const connectBlocked = !canConnect || blockNewConnect;

  const statusLabel = connected
    ? tApps(`status.${connected.status}`)
    : t("wizard.integrations.notConnected");

  const statusClass =
    connected?.status === "connected"
      ? "bg-green-500"
      : connected?.status === "pending"
        ? "bg-amber-500"
        : connected
          ? "bg-destructive"
          : "bg-muted-foreground/40";

  return (
    <Card>
      <CardHeader className="space-y-2">
        <ConnectedAppNameAndLogo
          appName={appName}
          nameClassName="text-lg font-semibold"
          logoClassName="size-9 shrink-0"
        />
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{hint}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-base">
            <span
              className={`size-2 shrink-0 rounded-full ${statusClass}`}
              aria-hidden
            />
            <span>{statusLabel}</span>
          </div>
          {connected ? (
            <div className="flex items-center gap-2">
              <AddOrUpdateAppButton
                app={connected}
                refreshOnClose
                dontAskToSetDefault
              >
                <Button size="sm" variant="secondary">
                  {tApps("common.updateApp")}
                </Button>
              </AddOrUpdateAppButton>
              {connected.status === "connected" ||
              connected.status === "pending" ? (
                <DeleteAppButton appId={connected._id}>
                  <Button size="sm" variant="outline-destructive">
                    <Unplug />
                    {tApps("common.disconnect.label")}
                  </Button>
                </DeleteAppButton>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <AddOrUpdateAppButton
                appType={appName}
                refreshOnClose
                dontAskToSetDefault
                installBlocked={connectBlocked}
              >
                <Button size="sm" variant="default" disabled={connectBlocked}>
                  {t("wizard.integrations.connect")}
                </Button>
              </AddOrUpdateAppButton>
              {!canConnect ? <AppInstallUpgradeHint /> : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const OPTIONAL_INTEGRATIONS = [
  {
    key: "optCustomerEmailNotifications" as const,
    appName: CUSTOMER_EMAIL_NOTIFICATION_APP_NAME,
  },
  {
    key: "optCustomerTextMessageNotifications" as const,
    appName: CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME,
  },
  {
    key: "optAppointmentNotifications" as const,
    appName: APPOINTMENT_NOTIFICATIONS_APP_NAME,
  },
  {
    key: "optWaitlist" as const,
    appName: WAITLIST_APP_NAME,
  },
  {
    key: "optBlog" as const,
    appName: BLOG_APP_NAME,
  },
  {
    key: "optForms" as const,
    appName: FORMS_APP_NAME,
  },
  {
    key: "optGiftCardStudio" as const,
    appName: GIFT_CARD_STUDIO_APP_NAME,
  },
  {
    key: "optMyCabinet" as const,
    appName: MY_CABINET_APP_NAME,
  },
];

export function StepIntegrations() {
  const t = useI18n("install");
  const { p, setP, setStep, calendarApps } = useInstallWizard();
  const { data: session } = authClient.useSession();
  const planTier = getSessionPlanTier({
    user: (session?.user ?? {}) as Parameters<
      typeof getSessionPlanTier
    >[0]["user"],
  });

  const canConnectApp = (appName: string) => canInstallApp(planTier, appName);

  useEffect(() => {
    if (planTier !== BillingPlanTier.Free) return;

    setP((prev) => {
      const updates: Partial<typeof prev> = {};

      for (const row of OPTIONAL_INTEGRATIONS) {
        if (prev[row.key] && !canInstallApp(planTier, row.appName)) {
          updates[row.key] = false;
        }
      }

      if (
        prev.optWaitlistNotifications &&
        !canInstallApp(planTier, WAITLIST_NOTIFICATIONS_APP_NAME)
      ) {
        updates.optWaitlistNotifications = false;
      }

      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [planTier, setP]);

  const googleApp = useMemo(
    () => pickCalendarAppRow(calendarApps, GOOGLE_CALENDAR_APP_NAME),
    [calendarApps],
  );
  const icsApp = useMemo(
    () => pickCalendarAppRow(calendarApps, ICS_APP_NAME),
    [calendarApps],
  );
  const outlookApp = useMemo(
    () => pickCalendarAppRow(calendarApps, OUTLOOK_APP_NAME),
    [calendarApps],
  );
  const caldavApp = useMemo(
    () => pickCalendarAppRow(calendarApps, CALDAV_APP_NAME),
    [calendarApps],
  );
  const writableCalendarApps = useMemo(
    () =>
      calendarApps.filter(
        (a) =>
          a.status === "connected" &&
          a.name !== ICS_APP_NAME &&
          AvailableApps[a.name]?.scope.includes("calendar-write"),
      ),
    [calendarApps],
  );
  const calendarWriterDisabled = writableCalendarApps.length === 0;

  const onContinue = async () => {
    if (
      p.inviteMode === "calendar_writer" &&
      (!p.inviteCalendarWriterAppId ||
        !writableCalendarApps.find(
          (a) =>
            a._id === p.inviteCalendarWriterAppId && a.status === "connected",
        ))
    ) {
      toast.error(t("wizard.integrations.calendarWriterSelectRequired"));
      return;
    }

    const r = await saveInstallPreferences({
      inviteMode: p.inviteMode,
      inviteCalendarWriterAppId: p.inviteCalendarWriterAppId,
      optCustomerEmailNotifications: p.optCustomerEmailNotifications,
      optCustomerTextMessageNotifications:
        p.optCustomerTextMessageNotifications,
      optAppointmentNotifications: p.optAppointmentNotifications,
      optWaitlist: p.optWaitlist,
      optWaitlistNotifications: p.optWaitlistNotifications,
      optBlog: p.optBlog,
      optForms: p.optForms,
      optGiftCardStudio: p.optGiftCardStudio,
      optMyCabinet: p.optMyCabinet,
      autoConfirmBookings: p.autoConfirmBookings,
      allowCancelReschedule: p.allowCancelReschedule,
      acceptPayments: p.acceptPayments,
      depositEnabled: p.depositEnabled,
      depositPercent: p.depositPercent,
    });
    if (!r.ok) {
      toast.error(t("wizard.integrations.saveError"));
      return;
    }
    setStep(6);
    setP((prev) => ({ ...prev, step: 6 }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {t("wizard.integrations.title")}
        </h2>
        <p className="text-base text-muted-foreground">
          {t("wizard.integrations.subtitle")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CalendarIntegrationCard
          appName={GOOGLE_CALENDAR_APP_NAME}
          description={t("wizard.integrations.googleDesc")}
          hint={t("wizard.integrations.googleLimit")}
          connected={googleApp}
          canConnect={canConnectApp(GOOGLE_CALENDAR_APP_NAME)}
        />
        <CalendarIntegrationCard
          appName={ICS_APP_NAME}
          description={t("wizard.integrations.appleDesc")}
          hint={t("wizard.integrations.appleLimit")}
          connected={icsApp}
          canConnect={canConnectApp(ICS_APP_NAME)}
        />
        <CalendarIntegrationCard
          appName={OUTLOOK_APP_NAME}
          description={t("wizard.integrations.outlookDesc")}
          hint={t("wizard.integrations.outlookLimit")}
          connected={outlookApp}
          canConnect={canConnectApp(OUTLOOK_APP_NAME)}
        />
        <CalendarIntegrationCard
          appName={CALDAV_APP_NAME}
          description={t("wizard.integrations.caldavDesc")}
          hint={t("wizard.integrations.caldavLimit")}
          connected={caldavApp}
          canConnect={canConnectApp(CALDAV_APP_NAME)}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("wizard.integrations.inviteHow")}</Label>
        <Select
          value={p.inviteMode}
          onValueChange={(v: "none" | "email" | "calendar_writer") =>
            setP((prev) => ({
              ...prev,
              inviteMode: v,
              ...(v !== "calendar_writer"
                ? { inviteCalendarWriterAppId: "" }
                : {}),
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t("wizard.integrations.inviteNone")}
            </SelectItem>
            <SelectItem value="email">
              {t("wizard.integrations.inviteEmail")}
            </SelectItem>
            <SelectItem
              value="calendar_writer"
              disabled={calendarWriterDisabled}
            >
              {t("wizard.integrations.inviteCalendarWriter")}
            </SelectItem>
          </SelectContent>
        </Select>
        {calendarWriterDisabled ? (
          <p className="text-sm text-muted-foreground">
            {t("wizard.integrations.calendarWriterDisabled")}
          </p>
        ) : null}
        {p.inviteMode === "calendar_writer" ? (
          <div className="space-y-2">
            <Label>{t("wizard.integrations.calendarWriterTarget")}</Label>
            <Select
              value={p.inviteCalendarWriterAppId}
              onValueChange={(v) =>
                setP((prev) => ({ ...prev, inviteCalendarWriterAppId: v }))
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("wizard.integrations.calendarWriterPickApp")}
                />
              </SelectTrigger>
              <SelectContent>
                {writableCalendarApps
                  .filter((a) => a.status === "connected")
                  .map((app) => (
                    <SelectItem key={app._id} value={app._id}>
                      <ConnectedAppNameAndLogo
                        appName={app.name}
                        logoClassName="size-3.5"
                        nameClassName="text-sm leading-[normal]"
                      />
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <div className="space-y-3">
        <Label>{t("wizard.integrations.optionalApps")}</Label>
        {[
          {
            key: "optCustomerEmailNotifications" as const,
            appName: CUSTOMER_EMAIL_NOTIFICATION_APP_NAME,
            label: t("wizard.integrations.customerEmailNotifications"),
            desc: t("wizard.integrations.customerEmailNotificationsDesc"),
          },
          {
            key: "optCustomerTextMessageNotifications" as const,
            appName: CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME,
            label: t("wizard.integrations.customerTextNotifications"),
            desc: t("wizard.integrations.customerTextNotificationsDesc"),
          },
          {
            key: "optAppointmentNotifications" as const,
            appName: APPOINTMENT_NOTIFICATIONS_APP_NAME,
            label: t("wizard.integrations.appointmentNotifications"),
            desc: t("wizard.integrations.appointmentNotificationsDesc"),
          },
          {
            key: "optWaitlist" as const,
            appName: WAITLIST_APP_NAME,
            label: t("wizard.integrations.waitlist"),
            desc: t("wizard.integrations.waitlistDesc"),
          },
          {
            key: "optBlog" as const,
            appName: BLOG_APP_NAME,
            label: t("wizard.integrations.blog"),
            desc: t("wizard.integrations.blogDesc"),
          },
          {
            key: "optForms" as const,
            appName: FORMS_APP_NAME,
            label: t("wizard.integrations.forms"),
            desc: t("wizard.integrations.formsDesc"),
          },
          {
            key: "optGiftCardStudio" as const,
            appName: GIFT_CARD_STUDIO_APP_NAME,
            label: t("wizard.integrations.giftCardStudio"),
            desc: t("wizard.integrations.giftCardStudioDesc"),
          },
          {
            key: "optMyCabinet" as const,
            appName: MY_CABINET_APP_NAME,
            label: t("wizard.integrations.myCabinet"),
            desc: t("wizard.integrations.myCabinetDesc"),
          },
        ].map((row) => {
          const allowed = canConnectApp(row.appName);
          return (
            <label
              key={row.key}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                allowed ? "cursor-pointer" : "cursor-not-allowed opacity-70",
              )}
            >
              <Switch
                checked={p[row.key]}
                disabled={!allowed}
                onCheckedChange={(c) => {
                  if (!allowed) return;
                  setP((prev) => ({ ...prev, [row.key]: Boolean(c) }));
                }}
              />
              <span>
                <span className="font-medium">{row.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {row.desc}
                </span>
                {!allowed ? (
                  <span className="mt-2 block">
                    <FeatureUpgradeHint showLink={false} />
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
        {p.optWaitlist && canConnectApp(WAITLIST_APP_NAME) ? (
          <label
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              canConnectApp(WAITLIST_NOTIFICATIONS_APP_NAME)
                ? "cursor-pointer"
                : "cursor-not-allowed opacity-70",
            )}
          >
            <Switch
              checked={p.optWaitlistNotifications}
              disabled={!canConnectApp(WAITLIST_NOTIFICATIONS_APP_NAME)}
              onCheckedChange={(c) => {
                if (!canConnectApp(WAITLIST_NOTIFICATIONS_APP_NAME)) return;
                setP((prev) => ({
                  ...prev,
                  optWaitlistNotifications: Boolean(c),
                }));
              }}
            />
            <span>
              <span className="font-medium">
                {t("wizard.integrations.waitlistNotifications")}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {t("wizard.integrations.waitlistNotificationsDesc")}
              </span>
              {!canConnectApp(WAITLIST_NOTIFICATIONS_APP_NAME) ? (
                <span className="mt-2 block">
                  <FeatureUpgradeHint showLink={false} />
                </span>
              ) : null}
            </span>
          </label>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {t("wizard.integrations.skipHint")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setStep(4);
            setP((prev) => ({ ...prev, step: 4 }));
          }}
        >
          {t("wizard.common.back")}
        </Button>
        <Button onClick={() => void onContinue()}>
          {t("wizard.common.continue")}
        </Button>
      </div>
    </div>
  );
}
