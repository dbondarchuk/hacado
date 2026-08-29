import { asOptionalField, zObjectId } from "@hacado/types";
import * as z from "zod";

export const SLOT_OPENED_COOLDOWN_MINUTES_MIN = 15;
export const SLOT_OPENED_COOLDOWN_MINUTES_MAX = 43_200;
export const SLOT_OPENED_EXCLUSIVE_ACCESS_MINUTES_MIN = 0;
export const SLOT_OPENED_EXCLUSIVE_ACCESS_MINUTES_MAX = 60;

export const customerWaitlistNotificationsConfigurationSchema = z
  .object({
    customerNewEntryTemplateId: asOptionalField(zObjectId()),
    notifyOnSlotOpened: z.boolean().optional(),
    slotOpenedEmailTemplateId: asOptionalField(zObjectId()),
    slotOpenedSmsTemplateId: asOptionalField(zObjectId()),
    leaveWaitlistSmsTemplateId: asOptionalField(zObjectId()),
    bookingPageId: asOptionalField(zObjectId()),
    cooldownMinutes: z.coerce.number<number>().int().optional(),
    exclusiveAccessMinutes: z.coerce.number<number>().int().optional(),
    smsRemoveKeyword: asOptionalField(z.string().trim().min(1).max(64)),
  })
  .superRefine((data, ctx) => {
    if (!data.notifyOnSlotOpened) {
      return;
    }

    if (!data.slotOpenedEmailTemplateId && !data.slotOpenedSmsTemplateId) {
      ctx.addIssue({
        code: "custom",
        path: ["slotOpenedEmailTemplateId"],
        message:
          "app_customer-waitlist-notifications_admin.setup.form.slotOpenedChannel.required",
      });
    }

    if (!data.bookingPageId) {
      ctx.addIssue({
        code: "custom",
        path: ["bookingPageId"],
        message:
          "app_customer-waitlist-notifications_admin.setup.form.bookingPageId.required",
      });
    }

    if (
      data.cooldownMinutes == null ||
      data.cooldownMinutes < SLOT_OPENED_COOLDOWN_MINUTES_MIN ||
      data.cooldownMinutes > SLOT_OPENED_COOLDOWN_MINUTES_MAX
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["cooldownMinutes"],
        message:
          "app_customer-waitlist-notifications_admin.setup.form.cooldownMinutes.required",
      });
    }

    if (
      data.exclusiveAccessMinutes == null ||
      data.exclusiveAccessMinutes < SLOT_OPENED_EXCLUSIVE_ACCESS_MINUTES_MIN ||
      data.exclusiveAccessMinutes > SLOT_OPENED_EXCLUSIVE_ACCESS_MINUTES_MAX
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["exclusiveAccessMinutes"],
        message:
          "app_customer-waitlist-notifications_admin.setup.form.exclusiveAccessMinutes.required",
      });
    }

    if (data.slotOpenedSmsTemplateId) {
      if (!data.smsRemoveKeyword) {
        ctx.addIssue({
          code: "custom",
          path: ["smsRemoveKeyword"],
          message:
            "app_customer-waitlist-notifications_admin.setup.form.smsRemoveKeyword.required",
        });
      }
      if (!data.leaveWaitlistSmsTemplateId) {
        ctx.addIssue({
          code: "custom",
          path: ["leaveWaitlistSmsTemplateId"],
          message:
            "app_customer-waitlist-notifications_admin.setup.form.leaveWaitlistSmsTemplateId.required",
        });
      }
    }
  });

export type CustomerWaitlistNotificationsConfiguration = z.infer<
  typeof customerWaitlistNotificationsConfigurationSchema
>;

export const OFFER_OPENED_SLOT_JOB_TYPE = "offer-opened-slot" as const;
export const SCAN_SCHEDULE_OPENED_SLOTS_JOB_TYPE =
  "scan-schedule-opened-slots" as const;

export type OfferOpenedSlotJobPayload = {
  type: typeof OFFER_OPENED_SLOT_JOB_TYPE;
  memberId: string;
  windowStart: string;
  windowEnd: string;
  afterCreatedAt?: string;
};

export type ScanScheduleOpenedSlotsJobPayload = {
  type: typeof SCAN_SCHEDULE_OPENED_SLOTS_JOB_TYPE;
  memberIds?: string[];
};

export type CustomerWaitlistNotificationsJobPayload =
  | OfferOpenedSlotJobPayload
  | ScanScheduleOpenedSlotsJobPayload;
