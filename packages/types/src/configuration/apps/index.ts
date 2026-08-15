import * as z from "zod";
import type { MappedAppScope } from "../../apps/app-scope-usage";
import { zObjectId } from "../../utils";

export const defaultAppsConfigurationSchema = z.object({
  paymentAppId: zObjectId().optional(),
  emailSenderAppId: zObjectId().optional(),
  textMessageSenderAppId: zObjectId().optional(),
  textMessageResponderAppId: zObjectId().optional(),
});

export type DefaultAppsConfiguration = z.infer<
  typeof defaultAppsConfigurationSchema
>;

/** Company-usage scopes that map to org `defaultApps` fields. */
export const defaultAppScopes = [
  "payment",
  "mail-send",
  "text-message-send",
  "text-message-respond",
] as const satisfies readonly MappedAppScope[];

/** Member-usage scopes that map to member `calendarSources`. */
export const calendarSourceScopes = [
  "calendar-read",
] as const satisfies readonly MappedAppScope[];

/** Member-usage scopes that map to member `meetingUrlProviderAppId`. */
export const meetingUrlProviderScopes = [
  "meeting-url-provider",
] as const satisfies readonly MappedAppScope[];

/** Company-usage scopes that map to booking configuration. */
export const bookingProviderScopes = [
  "schedule",
  "availability-provider",
] as const satisfies readonly MappedAppScope[];

export type DefaultAppScope = (typeof defaultAppScopes)[number];
export type CalendarSourceScope = (typeof calendarSourceScopes)[number];
export type MeetingUrlProviderScope = (typeof meetingUrlProviderScopes)[number];
export type BookingProviderScope = (typeof bookingProviderScopes)[number];

export const defaultAppToInstallScopes = [
  ...defaultAppScopes,
  ...calendarSourceScopes,
  ...meetingUrlProviderScopes,
  ...bookingProviderScopes,
] as const;

export type DefaultAppToInstallScope =
  (typeof defaultAppToInstallScopes)[number];
