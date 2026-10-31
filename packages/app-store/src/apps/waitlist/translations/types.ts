import type {
  PrefixedKeys as WaitlistAdminAllKeys,
  Keys as WaitlistAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as WaitlistPublicAllKeys,
  Keys as WaitlistPublicKeys,
} from "./en/public.keys";

export type {
  WaitlistAdminAllKeys,
  WaitlistAdminKeys,
  WaitlistPublicAllKeys,
  WaitlistPublicKeys,
};

export const waitlistAdminNamespace = "app_waitlist_admin" as const;

export type WaitlistAdminNamespace = typeof waitlistAdminNamespace;

export const waitlistPublicNamespace = "app_waitlist_public" as const;

export type WaitlistPublicNamespace = typeof waitlistPublicNamespace;
