import { zOptionalOrMaxLengthString, zTaggedUnion } from "@hacado/types";
import * as z from "zod";
import { CaldavAdminAllKeys } from "./translations/types";

export const caldavCalendarSourceSchema = z.object({
  serverUrl: z
    .url(
      "app_caldav_admin.validation.serverUrl.url" satisfies CaldavAdminAllKeys,
    )
    .max(
      4096,
      "app_caldav_admin.validation.serverUrl.max" satisfies CaldavAdminAllKeys,
    ),
  calendarName: z
    .string({
      message:
        "app_caldav_admin.validation.calendarName.required" satisfies CaldavAdminAllKeys,
    })
    .min(
      1,
      "app_caldav_admin.validation.calendarName.required" satisfies CaldavAdminAllKeys,
    )
    .max(
      256,
      "app_caldav_admin.validation.calendarName.max" satisfies CaldavAdminAllKeys,
    ),
  username: zOptionalOrMaxLengthString(
    256,
    "app_caldav_admin.validation.username.max" satisfies CaldavAdminAllKeys,
  ),
  password: zOptionalOrMaxLengthString(
    256,
    "app_caldav_admin.validation.password.max" satisfies CaldavAdminAllKeys,
  ),
});

export type CaldavCalendarSource = z.infer<typeof caldavCalendarSourceSchema>;

export const SaveActionType = "save" as const;
export const FetchActionType = "fetchCalendars" as const;

export const caldavActionSchema = zTaggedUnion([
  { type: SaveActionType, data: caldavCalendarSourceSchema },
  { type: FetchActionType, data: caldavCalendarSourceSchema },
]);

export type CaldavAction = z.infer<typeof caldavActionSchema>;
