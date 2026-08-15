"use client";

import { authClient } from "@/app/auth-client";
import { checkOrganizationSlug } from "@/components/admin/auth/actions";
import { STORAGE_KEY } from "@/components/install/constants";
import {
  InstallWizardProvider,
  type SlugCheckState,
} from "@/components/install/install-wizard-context";
import { getOrganizationSlugIssue } from "@/components/install/organization-slug";
import {
  applyInstallCalendarSnapshot,
  sanitizePersisted,
} from "@/components/install/persisted-state";
import { StepBusiness } from "@/components/install/steps/step-business";
import { StepFinish } from "@/components/install/steps/step-finish";
import { StepInstallHeader } from "@/components/install/steps/step-install-header";
import { StepIntegrations } from "@/components/install/steps/step-integrations";
import { StepPayments } from "@/components/install/steps/step-payments";
import { StepPersonalization } from "@/components/install/steps/step-personalization";
import { StepSchedule } from "@/components/install/steps/step-schedule";
import { StepService } from "@/components/install/steps/step-service";
import { StepVerify } from "@/components/install/steps/step-verify";
import type {
  InstallPreferencesServerState,
  InstallServiceServerSnapshot,
  InstallWorkspaceServerState,
  PersistedState,
  WizardStep,
} from "@/components/install/types";
import type { ConnectedApp, Schedule } from "@hacado/types";
import { Spinner } from "@hacado/ui";
import { useCallback, useEffect, useRef, useState } from "react";

export function InstallWizard({
  email,
  emailVerified: initialVerified,
  publicDomain,
  workspaceFromServer,
  servicesFromServer,
  calendarAppsFromServer,
  paymentAppsFromServer,
  preferencesFromServer,
  scheduleFromServer,
}: {
  email: string;
  emailVerified: boolean;
  publicDomain: string;
  workspaceFromServer: InstallWorkspaceServerState | null;
  servicesFromServer: InstallServiceServerSnapshot[];
  calendarAppsFromServer: ConnectedApp[];
  paymentAppsFromServer: ConnectedApp[];
  preferencesFromServer: InstallPreferencesServerState | null;
  scheduleFromServer: Schedule | null;
}) {
  const { data: session, refetch } = authClient.useSession();
  const topRef = useRef<HTMLDivElement>(null);

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<WizardStep>("verify");
  const [p, setP] = useState<PersistedState>(() =>
    sanitizePersisted(
      undefined,
      workspaceFromServer,
      servicesFromServer,
      calendarAppsFromServer,
      preferencesFromServer,
      scheduleFromServer,
    ),
  );

  const [verified, setVerified] = useState(initialVerified);
  const [slugCheck, setSlugCheck] = useState<SlugCheckState>("idle");
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const organizationId = (
    session?.user as { organizationId?: string } | undefined
  )?.organizationId;

  useEffect(() => {
    setVerified(
      Boolean(
        (session?.user as { emailVerified?: boolean } | undefined)
          ?.emailVerified,
      ),
    );
  }, [session]);

  useEffect(() => {
    if (verified) return;
    const iv = setInterval(() => {
      void refetch();
    }, 4000);
    return () => clearInterval(iv);
  }, [refetch, verified]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState> & {
          step?: WizardStep;
        };
        const { step: parsedStep, ...rest } = parsed;
        setP(
          sanitizePersisted(
            rest,
            workspaceFromServer,
            servicesFromServer,
            calendarAppsFromServer,
            preferencesFromServer,
            scheduleFromServer,
          ),
        );
        if (initialVerified) {
          if (parsedStep !== undefined && parsedStep !== "verify") {
            if (typeof parsedStep === "number") {
              let s = parsedStep;
              if (s > 7) s = 7;
              setStep(s >= 1 && s <= 7 ? s : 1);
            } else {
              setStep(parsedStep);
            }
          } else {
            setStep(1);
          }
        } else {
          setStep("verify");
        }
      } else if (initialVerified) {
        setStep(1);
      } else {
        setStep("verify");
      }
    } catch {
      setStep(initialVerified ? 1 : "verify");
    }
    setHydrated(true);
  }, [
    initialVerified,
    workspaceFromServer,
    servicesFromServer,
    calendarAppsFromServer,
    preferencesFromServer,
    scheduleFromServer,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    setP((prev) => {
      const next = { ...prev };
      applyInstallCalendarSnapshot(next, calendarAppsFromServer);
      return next;
    });
  }, [hydrated, calendarAppsFromServer]);

  useEffect(() => {
    if (!hydrated) return;
    if (!verified || step === "verify") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, step }));
  }, [p, step, hydrated, verified]);

  useEffect(() => {
    if (!verified || step !== "verify") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    let next: WizardStep = 1;
    try {
      if (raw) {
        const parsed = JSON.parse(raw) as { step?: WizardStep };
        if (typeof parsed.step === "number") {
          let s = parsed.step;
          if (s > 7) s = 7;
          if (s >= 1 && s <= 7) next = s;
        }
      }
    } catch {
      /* ignore */
    }
    setStep(next);
    setP((prev) => ({ ...prev, step: next }));
  }, [verified, step]);

  const scheduleSlugCheck = useCallback(
    (slug: string) => {
      if (slugTimer.current) clearTimeout(slugTimer.current);
      if (getOrganizationSlugIssue(slug)) {
        setSlugCheck("idle");
        return;
      }
      setSlugCheck("checking");
      slugTimer.current = setTimeout(async () => {
        const ok = await checkOrganizationSlug(slug, organizationId);
        setSlugCheck(ok ? "available" : "taken");
      }, 400);
    },
    [organizationId],
  );

  useEffect(() => {
    if (!hydrated || !verified || !p.slug) return;
    scheduleSlugCheck(p.slug);
  }, [hydrated, verified, organizationId, p.slug, scheduleSlugCheck]);

  useEffect(() => {
    if (!hydrated) return;
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [hydrated, step]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!verified) {
    return <StepVerify email={email} />;
  }

  return (
    <InstallWizardProvider
      value={{
        email,
        publicDomain,
        initialVerified,
        hydrated,
        verified,
        session: session ?? null,
        refetch,
        step,
        setStep,
        p,
        setP,
        slugCheck,
        setSlugCheck,
        scheduleSlugCheck,
        organizationId,
        calendarApps: calendarAppsFromServer,
        paymentApps: paymentAppsFromServer,
        preferencesFromServer,
      }}
    >
      <div ref={topRef} />
      <div className="flex min-h-screen flex-col bg-muted/30">
        <StepInstallHeader stepNum={typeof step === "number" ? step : 1} />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
          {step === 1 ? <StepBusiness /> : null}
          {step === 2 ? <StepPersonalization /> : null}
          {step === 3 ? <StepService /> : null}
          {step === 4 ? <StepSchedule /> : null}
          {step === 5 ? <StepIntegrations /> : null}
          {step === 6 ? <StepPayments /> : null}
          {step === 7 ? <StepFinish /> : null}
        </main>
      </div>
    </InstallWizardProvider>
  );
}
