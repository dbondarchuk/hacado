import {
  dateRangeSchema,
  querySchema,
  zObjectId,
  zTaggedUnion,
  zUniqueArray,
} from "@hacado/types";
import * as z from "zod";

import { WaitlistAdminAllKeys } from "../translations/types";
import { waitlistRequestDates, waitlistStatus } from "./waitlist";

export const waitlistConfigurationSchema = z.object({
  notifyMemberOnNewEntry: z.coerce.boolean<boolean>().optional(),
  notifyCoordinatorsOnNewEntry: z.coerce.boolean<boolean>().optional(),
});

export type WaitlistConfiguration = z.infer<typeof waitlistConfigurationSchema>;

// Request actions

// Get waitlist entries action

export const getWaitlistEntriesActionSchema = z.object({
  query: querySchema.extend({
    status: z.array(z.enum([...waitlistStatus, "expired"])).optional(),
    optionId: z.array(zObjectId()).or(zObjectId()).optional(),
    customerId: z.array(zObjectId()).or(zObjectId()).optional(),
    memberId: z.array(zObjectId()).or(zObjectId()).optional(),
    range: dateRangeSchema.optional(),
  }),
});

export type GetWaitlistEntriesAction = z.infer<
  typeof getWaitlistEntriesActionSchema
>;
export const GetWaitlistEntriesActionType = "get-waitlist-entries" as const;

// Get waitlist entry action

export const getWaitlistEntryActionSchema = z.object({
  id: zObjectId(),
});

export type GetWaitlistEntryAction = z.infer<
  typeof getWaitlistEntryActionSchema
>;
export const GetWaitlistEntryActionType = "get-waitlist-entry" as const;

// Dismiss waitlist entries action

export const dismissWaitlistEntriesActionSchema = z.object({
  ids: z.array(zObjectId()),
});

export type DismissWaitlistEntriesAction = z.infer<
  typeof dismissWaitlistEntriesActionSchema
>;
export const DismissWaitlistEntriesActionType =
  "dismiss-waitlist-entries" as const;

// Set configuration action

export const setConfigurationActionSchema = z.object({
  configuration: waitlistConfigurationSchema,
});

export type SetConfigurationAction = z.infer<
  typeof setConfigurationActionSchema
>;
export const SetConfigurationActionType = "set-configuration" as const;

// Create waitlist entry action
export const createWaitlistEntryRequestSchema = z
  .object({
    customerId: zObjectId(
      "app_waitlist_admin.validation.createWaitlistEntry.customerId.required" satisfies WaitlistAdminAllKeys,
    ),
    note: z
      .string()
      .max(
        1024,
        "app_waitlist_admin.validation.createWaitlistEntry.note.max" satisfies WaitlistAdminAllKeys,
      )
      .optional(),
    optionId: zObjectId("validation.appointments.request.optionId.required"),
    /** Preferred/assigned staff member; resolved to the owner member when omitted. */
    memberId: zObjectId(
      "validation.appointments.request.memberId.required",
    ).optional(),
    addonsIds: zUniqueArray(
      z.array(zObjectId("validation.appointments.request.addonsIds.required")),
      (x) => x,
      "validation.appointments.request.addonsIds.unique",
    ).optional(),
    duration: z.coerce
      .number<number>({
        error: "validation.appointments.request.duration.required",
      })
      .int("validation.appointments.request.duration.positive")
      .min(1, "validation.appointments.request.duration.positive")
      .max(60 * 24 * 1, "validation.appointments.request.duration.max")
      .optional(),
  })
  .and(
    z
      .object({
        asSoonAsPossible: z.literal(false, {
          error:
            "app_waitlist_admin.validation.createWaitlistEntry.asSoonAsPossible.required" satisfies WaitlistAdminAllKeys,
        }),
        dates: waitlistRequestDates,
      })
      .or(
        z.object({
          asSoonAsPossible: z.literal(true, {
            error:
              "app_waitlist_admin.validation.createWaitlistEntry.asSoonAsPossible.required" satisfies WaitlistAdminAllKeys,
          }),
          dates: z.never().optional(),
        }),
      ),
  );

export type CreateWaitlistEntryRequest = z.infer<
  typeof createWaitlistEntryRequestSchema
>;
export const createWaitlistEntryActionSchema = z.object({
  entry: createWaitlistEntryRequestSchema,
});

export type CreateWaitlistEntryAction = z.infer<
  typeof createWaitlistEntryActionSchema
>;
export const CreateWaitlistEntryActionType = "create-waitlist-entry" as const;
// Request action

export const requestActionSchema = zTaggedUnion([
  { type: GetWaitlistEntriesActionType, data: getWaitlistEntriesActionSchema },
  { type: GetWaitlistEntryActionType, data: getWaitlistEntryActionSchema },
  {
    type: DismissWaitlistEntriesActionType,
    data: dismissWaitlistEntriesActionSchema,
  },
  { type: SetConfigurationActionType, data: setConfigurationActionSchema },
  {
    type: CreateWaitlistEntryActionType,
    data: createWaitlistEntryActionSchema,
  },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;
