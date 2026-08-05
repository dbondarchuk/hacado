import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type WaitlistAdminKeys = Leaves<typeof adminKeys>;
export const waitlistAdminNamespace = "app_waitlist_admin" as const;

export type WaitlistAdminNamespace = typeof waitlistAdminNamespace;

export type WaitlistPublicKeys = Leaves<typeof publicKeys>;
export const waitlistPublicNamespace = "app_waitlist_public" as const;

export type WaitlistPublicNamespace = typeof waitlistPublicNamespace;

export type WaitlistAdminAllKeys = AllKeys<
  WaitlistAdminNamespace,
  WaitlistAdminKeys
>;

export type WaitlistPublicAllKeys = AllKeys<
  WaitlistPublicNamespace,
  WaitlistPublicKeys
>;
