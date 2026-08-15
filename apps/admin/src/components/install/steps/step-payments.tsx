"use client";

import { authClient } from "@/app/auth-client";
import { AddOrUpdateAppButton } from "@/components/admin/apps/add-or-update-app-dialog";
import { DeleteAppButton } from "@/components/admin/apps/delete-app-button";
import { saveInstallPreferences } from "@/components/install/actions";
import { useInstallWizard } from "@/components/install/install-wizard-context";
import {
  getSessionPlanTier,
  sessionCanUseFeature,
} from "@/lib/billing/subscription-plan-access";
import {
  PAYPAL_APP_NAME,
  SQUARE_APP_NAME,
  STRIPE_APP_NAME,
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
  Slider,
  Switch,
  toast,
} from "@hacado/ui";
import { ConnectedAppNameAndLogo } from "@hacado/ui-admin";
import { Unplug } from "lucide-react";
import { useEffect, useMemo } from "react";

const INSTALL_PAYMENT_APP_NAMES = [
  PAYPAL_APP_NAME,
  SQUARE_APP_NAME,
  STRIPE_APP_NAME,
] as const;

function pickPaymentApp(
  apps: ConnectedApp[],
  name: (typeof INSTALL_PAYMENT_APP_NAMES)[number],
): ConnectedApp | undefined {
  const matches = apps.filter((a) => a.name === name);
  if (!matches.length) return undefined;
  return (
    matches.find((a) => a.status === "connected") ??
    matches.find((a) => a.status === "pending") ??
    matches[0]
  );
}

function isPaymentAppSlotTaken(app: ConnectedApp | undefined): boolean {
  return app?.status === "connected" || app?.status === "pending";
}

export function StepPayments() {
  const t = useI18n("install");
  const tApps = useI18n("apps");
  const { p, setP, setStep, paymentApps } = useInstallWizard();
  const { data: session } = authClient.useSession();
  const sessionUser = {
    user: (session?.user ?? {}) as Parameters<
      typeof getSessionPlanTier
    >[0]["user"],
  };
  const planTier = getSessionPlanTier(sessionUser);
  const canAcceptPayments = sessionCanUseFeature(sessionUser, "payments");

  useEffect(() => {
    if (planTier !== BillingPlanTier.Free) return;

    setP((prev) => {
      if (!prev.acceptPayments && !prev.depositEnabled) return prev;
      return {
        ...prev,
        acceptPayments: false,
        depositEnabled: false,
      };
    });
  }, [planTier, setP]);

  const paypalApp = useMemo(
    () => pickPaymentApp(paymentApps, PAYPAL_APP_NAME),
    [paymentApps],
  );
  const squareApp = useMemo(
    () => pickPaymentApp(paymentApps, SQUARE_APP_NAME),
    [paymentApps],
  );
  const stripeApp = useMemo(
    () => pickPaymentApp(paymentApps, STRIPE_APP_NAME),
    [paymentApps],
  );
  const paypalConnected = paypalApp?.status === "connected";
  const squareConnected = squareApp?.status === "connected";
  const stripeConnected = stripeApp?.status === "connected";
  const paypalSlotTaken = isPaymentAppSlotTaken(paypalApp);
  const squareSlotTaken = isPaymentAppSlotTaken(squareApp);
  const stripeSlotTaken = isPaymentAppSlotTaken(stripeApp);
  const canContinue =
    !p.acceptPayments || paypalConnected || squareConnected || stripeConnected;

  const onContinue = async () => {
    if (!canContinue) {
      toast.error(t("wizard.payments.paymentAppRequired"));
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
      allowCancelReschedule: p.allowCancelReschedule,
      autoConfirmBookings: p.autoConfirmBookings,
      acceptPayments: p.acceptPayments,
      depositEnabled: p.depositEnabled,
      depositPercent: p.depositPercent,
    });
    if (!r.ok) {
      toast.error(t("wizard.integrations.saveError"));
      return;
    }
    setStep(7);
    setP((prev) => ({ ...prev, step: 7 }));
  };

  const renderPaymentCard = (
    appName: (typeof INSTALL_PAYMENT_APP_NAMES)[number],
    descriptionKey:
      | "wizard.payments.paypalDesc"
      | "wizard.payments.squareDesc"
      | "wizard.payments.stripeDesc",
    app: ConnectedApp | undefined,
  ) => {
    const connected = app?.status === "connected";
    const thisSlotTaken = isPaymentAppSlotTaken(app);
    const otherSlotTaken =
      (appName !== PAYPAL_APP_NAME && paypalSlotTaken) ||
      (appName !== SQUARE_APP_NAME && squareSlotTaken) ||
      (appName !== STRIPE_APP_NAME && stripeSlotTaken);
    const blockConnectOrUpdate = otherSlotTaken && !thisSlotTaken;
    return (
      <Card>
        <CardHeader>
          <ConnectedAppNameAndLogo
            appName={appName}
            nameClassName="text-lg font-semibold"
            logoClassName="size-9 shrink-0"
          />
          <CardDescription className="mt-2">
            {t(descriptionKey)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base">
              {connected
                ? t("wizard.integrations.connected")
                : t("wizard.integrations.notConnected")}
            </span>
            {app ? (
              <div className="flex items-center gap-2">
                <AddOrUpdateAppButton
                  app={app}
                  refreshOnClose
                  dontAskToSetDefault
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={blockConnectOrUpdate}
                    title={
                      blockConnectOrUpdate
                        ? t("wizard.payments.onePaymentAppHint")
                        : undefined
                    }
                  >
                    {tApps("common.updateApp")}
                  </Button>
                </AddOrUpdateAppButton>
                {(app.status === "connected" || app.status === "pending") && (
                  <DeleteAppButton appId={app._id}>
                    <Button size="sm" variant="outline-destructive">
                      <Unplug />
                      {tApps("common.disconnect.label")}
                    </Button>
                  </DeleteAppButton>
                )}
              </div>
            ) : (
              <AddOrUpdateAppButton
                appType={appName}
                refreshOnClose
                dontAskToSetDefault
              >
                <Button
                  size="sm"
                  disabled={blockConnectOrUpdate}
                  title={
                    blockConnectOrUpdate
                      ? t("wizard.payments.onePaymentAppHint")
                      : undefined
                  }
                >
                  {t("wizard.integrations.connect")}
                </Button>
              </AddOrUpdateAppButton>
            )}
          </div>
          {blockConnectOrUpdate ? (
            <p className="text-sm text-muted-foreground">
              {t("wizard.payments.onePaymentAppHint")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("wizard.payments.title")}</h2>
        <p className="text-base text-muted-foreground">
          {t("wizard.payments.subtitle")}
        </p>
      </div>
      <label
        className={cn(
          "flex items-center justify-between rounded-lg border p-4",
          canAcceptPayments
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-70",
        )}
      >
        <div>
          <span className="font-medium">
            {t("wizard.payments.acceptPayments")}
          </span>
          <p className="text-sm text-muted-foreground">
            {t("wizard.payments.acceptPaymentsHint")}
          </p>
          {!canAcceptPayments ? (
            <span className="mt-2 block text-sm">
              {t("wizard.payments.acceptPaymentsUpgradeHint")}
            </span>
          ) : null}
        </div>
        <Switch
          checked={p.acceptPayments}
          disabled={!canAcceptPayments}
          onCheckedChange={(c) => {
            if (!canAcceptPayments) return;
            setP((prev) => ({ ...prev, acceptPayments: Boolean(c) }));
          }}
        />
      </label>
      {p.acceptPayments && canAcceptPayments ? (
        <div className="grid gap-4">
          {renderPaymentCard(
            PAYPAL_APP_NAME,
            "wizard.payments.paypalDesc",
            paypalApp,
          )}
          {renderPaymentCard(
            SQUARE_APP_NAME,
            "wizard.payments.squareDesc",
            squareApp,
          )}
          {renderPaymentCard(
            STRIPE_APP_NAME,
            "wizard.payments.stripeDesc",
            stripeApp,
          )}
          <div>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
              <span className="font-medium">
                {t("wizard.payments.deposit")}
              </span>
              <Switch
                checked={p.depositEnabled}
                onCheckedChange={(c) =>
                  setP((prev) => ({
                    ...prev,
                    depositEnabled: Boolean(c),
                  }))
                }
              />
            </label>
            {p.depositEnabled ? (
              <div className="mt-3 space-y-2">
                <Label>
                  {t("wizard.payments.depositPercent")} {p.depositPercent}%
                </Label>
                <Slider
                  min={10}
                  max={100}
                  step={1}
                  value={[Number.parseInt(p.depositPercent || "25", 10) || 25]}
                  onValueChange={(v) =>
                    setP((prev) => ({
                      ...prev,
                      depositPercent: String(v[0] ?? 25),
                    }))
                  }
                ></Slider>
                <p className="text-sm text-muted-foreground">
                  {t("wizard.payments.depositHelp")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
        <div>
          <span className="font-medium">
            {t("wizard.payments.autoConfirmBookings")}
          </span>
          <p className="text-sm text-muted-foreground">
            {t("wizard.payments.autoConfirmBookingsHint")}
          </p>
        </div>
        <Switch
          checked={p.autoConfirmBookings}
          onCheckedChange={(c) =>
            setP((prev) => ({ ...prev, autoConfirmBookings: Boolean(c) }))
          }
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
        <div>
          <span className="font-medium">
            {t("wizard.payments.cancelPolicy")}
          </span>
          <p className="text-sm text-muted-foreground">
            {t("wizard.payments.cancelHelp")}
          </p>
        </div>
        <Switch
          checked={p.allowCancelReschedule}
          onCheckedChange={(c) =>
            setP((prev) => ({
              ...prev,
              allowCancelReschedule: Boolean(c),
            }))
          }
        />
      </label>
      <p className="text-sm text-muted-foreground">
        {t("wizard.payments.flex")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setStep(5);
            setP((prev) => ({ ...prev, step: 5 }));
          }}
        >
          {t("wizard.common.back")}
        </Button>
        <Button onClick={onContinue} disabled={!canContinue}>
          {t("wizard.common.finish")}
        </Button>
      </div>
    </div>
  );
}
