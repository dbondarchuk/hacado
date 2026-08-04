"use client";

import { useInstallWizard } from "@/components/install/install-wizard-context";
import { useI18n } from "@timelish/i18n/client";
import { Button, cn, Link, Spinner, toast } from "@timelish/ui";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { completeInstallSetup } from "../actions";
import { STORAGE_KEY } from "../constants";

export function StepFinish() {
  const t = useI18n("install");
  const { p, publicDomain } = useInstallWizard();
  const [finishTick, setFinishTick] = useState(-1);
  const [finishDone, setFinishDone] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizingError, setFinalizingError] = useState<string | null>(null);

  const bookingPreview =
    p.slug && publicDomain ? `https://${p.slug}.${publicDomain}` : "/dashboard";

  const finalizeInstall = async () => {
    if (finalizing) return;
    setFinishTick(0);
    setFinishDone(false);
    setFinalizing(true);
    setFinalizingError(null);
    const phases = [2000, 1000, 1500];
    let total = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    phases.forEach((ms) => {
      total += ms;
      timers.push(setTimeout(() => setFinishTick((x) => x + 1), total));
    });

    try {
      const r = await completeInstallSetup({
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
        throw new Error(r.code);
      }
    } catch (error) {
      console.error(error);
      setFinalizingError(
        error instanceof Error ? error.message : "Unknown error",
      );
      toast.error(t("wizard.finish.finalizeError"));
      timers.forEach(clearTimeout);
      setFinalizing(false);
      return;
    }

    timers.push(
      setTimeout(() => {
        setFinishDone(true);
        setFinalizing(false);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }, total + 400),
    );
  };

  useEffect(() => {
    finalizeInstall();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center space-y-8 py-12">
      {!finishDone ? (
        <>
          <p className="text-base text-muted-foreground text-center">
            {t("wizard.finish.buildingExperience")}
          </p>
          {finalizing && <Spinner className="h-12 w-12 text-primary" />}
          <ul className="w-full max-w-md space-y-3 text-base">
            {[
              t("wizard.finish.taskPage"),
              t("wizard.finish.taskAvailability"),
              t("wizard.finish.taskCalendar"),
              t("wizard.finish.taskFinalize"),
            ].map((label, i) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 appear",
                  i < finishTick ? "border-primary/40 bg-primary/5" : "",
                  i === finishTick && finalizingError
                    ? "border-destructive/40 bg-destructive/5"
                    : "",
                  i > finishTick ? "opacity-0" : "",
                )}
              >
                {i < finishTick ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : i === finishTick && finalizingError ? (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                ) : (
                  <Spinner className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {label}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">
            {t("wizard.finish.readyTitle")}
          </h2>
          <p className="text-base text-muted-foreground">
            {t("wizard.finish.readySubtitle")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link button variant="default" href="/dashboard" hardNavigate>
              {t("wizard.finish.ctaDashboard")}
            </Link>
            <Link
              button
              variant="outline"
              href={bookingPreview}
              target={p.slug && publicDomain ? "_blank" : undefined}
            >
              {t("wizard.finish.ctaBooking")}
            </Link>
          </div>
        </div>
      )}
      <Button
        variant="outline"
        onClick={finalizeInstall}
        className={cn("mt-2 appear", finishDone || finalizing ? "hidden" : "")}
      >
        {t("wizard.finish.retry")}
      </Button>
    </div>
  );
}
