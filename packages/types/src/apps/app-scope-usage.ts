import type { AppScope } from "./app";

export type AppScopeUsage = "company" | "member";

/**
 * Scopes that are selected/configured at company or member level.
 * Unlisted scopes are capability-only (e.g. event-subscriber) and do not
 * classify picker/default routing.
 */
export const APP_SCOPE_USAGE = {
  "calendar-read": "member",
  "mail-send": "company",
  "meeting-url-provider": "member",
  payment: "company",
  "text-message-send": "company",
  "text-message-respond": "company",
  schedule: "company",
  "availability-provider": "company",
} as const satisfies Partial<Record<AppScope, AppScopeUsage>>;

export type MappedAppScope = keyof typeof APP_SCOPE_USAGE;

export function getAppScopeUsage(
  scope: AppScope,
): AppScopeUsage | undefined {
  return APP_SCOPE_USAGE[scope as MappedAppScope];
}

export function isCompanyUsageScope(scope: AppScope): boolean {
  return getAppScopeUsage(scope) === "company";
}

export function isMemberUsageScope(scope: AppScope): boolean {
  return getAppScopeUsage(scope) === "member";
}
