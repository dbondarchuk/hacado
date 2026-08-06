"use client";

import { authClient } from "@/app/auth-client";
import type { ConnectedApp } from "@hacado/types";
import type { Dispatch, SetStateAction } from "react";
import { createContext, useContext } from "react";
import type {
  InstallPreferencesServerState,
  PersistedState,
  WizardStep,
} from "./types";

export type SlugCheckState = "idle" | "checking" | "available" | "taken";

export type InstallWizardContextValue = {
  email: string;
  publicDomain: string;
  initialVerified: boolean;
  hydrated: boolean;
  verified: boolean;
  session: { user?: { name?: string } } | null;
  refetch: () => void;
  step: WizardStep;
  setStep: Dispatch<SetStateAction<WizardStep>>;
  p: PersistedState;
  setP: Dispatch<SetStateAction<PersistedState>>;
  slugCheck: SlugCheckState;
  setSlugCheck: Dispatch<SetStateAction<SlugCheckState>>;
  scheduleSlugCheck: (slug: string) => void;
  organizationId: string | undefined;
  calendarApps: ConnectedApp[];
  paymentApps: ConnectedApp[];
  preferencesFromServer: InstallPreferencesServerState | null;
};

const InstallWizardContext = createContext<InstallWizardContextValue | null>(
  null,
);

export const InstallWizardProvider = InstallWizardContext.Provider;

export function useInstallWizard() {
  const ctx = useContext(InstallWizardContext);
  if (!ctx) {
    throw new Error(
      "useInstallWizard must be used within InstallWizardProvider",
    );
  }
  return ctx;
}

export function useOptionalSession() {
  return authClient.useSession();
}
