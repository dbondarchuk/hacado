import { zObjectId } from "@timelish/types";
import * as z from "zod";
import { CalendarWriterAdminAllKeys } from "./translations/types";

export const calendarWriterConfigurationSchema = z.object({
  appId: zObjectId(
    "app_calendar-writer_admin.validation.appId.required" satisfies CalendarWriterAdminAllKeys,
  ),
  processOtherMembersAppointments: z.boolean().optional(),
});

export type CalendarWriterConfiguration = z.infer<
  typeof calendarWriterConfigurationSchema
>;

export type CalendarWriterStoredConfiguration = {
  appId: string | null;
  processOtherMembersAppointments?: boolean;
};
