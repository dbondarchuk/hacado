import * as z from "zod";
import {
  postalAddressSchema,
  type PostalAddress,
} from "../utils/postal-address";
import { zEmail, zPhone, zUrl } from "../utils/schema";

export const smsEntityTypes = [
  "PRIVATE_PROFIT",
  "SOLE_PROPRIETOR",
  "NON_PROFIT",
] as const;

export type SmsEntityType = (typeof smsEntityTypes)[number];

export const smsRegistrationStatuses = [
  "draft",
  "pending",
  "verified",
  "rejected",
] as const;

export type SmsRegistrationStatus = (typeof smsRegistrationStatuses)[number];

export type SmsMessagingAccess = {
  customVerified: boolean;
  canCustomize: boolean;
  platformBusiness: boolean;
};

export const smsRegistrationInputSchema = z.object({
  enabled: z.boolean(),
  resubmit: z.boolean().optional(),
  entityType: z.enum(smsEntityTypes).optional(),
  legalName: z.string().trim().max(128).optional(),
  doingBusinessAs: z.string().trim().max(128).optional(),
  businessRegistrationNumber: z.string().trim().max(32).optional(),
  website: z.string().trim().max(2048).optional(),
  address: postalAddressSchema.optional(),
  contactFirstName: z.string().trim().max(64).optional(),
  contactLastName: z.string().trim().max(64).optional(),
  contactEmail: z.string().trim().max(256).optional(),
  contactPhone: z.string().trim().max(32).optional(),
});

export type SmsRegistrationInput = z.infer<typeof smsRegistrationInputSchema>;

const requiredText = (
  value: string | undefined,
  path: (string | number)[],
  message: string,
  ctx: z.RefinementCtx,
) => {
  if (!value?.trim()) {
    ctx.addIssue({ code: "custom", path, message });
  }
};

export const smsRegistrationFormSchema = (requiresVerification: boolean) =>
  smsRegistrationInputSchema.superRefine((value, ctx) => {
    if (!requiresVerification || !value.enabled) return;

    if (!value.entityType) {
      ctx.addIssue({
        code: "custom",
        path: ["entityType"],
        message: "configuration.textMessaging.entityType.required",
      });
    }

    requiredText(
      value.legalName,
      ["legalName"],
      "configuration.textMessaging.legalName.required",
      ctx,
    );

    requiredText(
      value.website,
      ["website"],
      "configuration.textMessaging.website.required",
      ctx,
    );

    if (
      value.website?.trim() &&
      !zUrl.safeParse(value.website.trim()).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["website"],
        message: "validation.common.url.invalid",
      });
    }

    requiredText(
      value.address?.streetAddress,
      ["address", "streetAddress"],
      "configuration.textMessaging.streetAddress.required",
      ctx,
    );

    requiredText(
      value.address?.addressLocality,
      ["address", "addressLocality"],
      "configuration.textMessaging.city.required",
      ctx,
    );

    requiredText(
      value.address?.addressRegion,
      ["address", "addressRegion"],
      "configuration.textMessaging.state.required",
      ctx,
    );

    requiredText(
      value.address?.postalCode,
      ["address", "postalCode"],
      "configuration.textMessaging.postalCode.required",
      ctx,
    );

    requiredText(
      value.contactFirstName,
      ["contactFirstName"],
      "configuration.textMessaging.contactFirstName.required",
      ctx,
    );

    requiredText(
      value.contactLastName,
      ["contactLastName"],
      "configuration.textMessaging.contactLastName.required",
      ctx,
    );

    requiredText(
      value.contactEmail,
      ["contactEmail"],
      "configuration.textMessaging.contactEmail.required",
      ctx,
    );

    if (
      value.contactEmail?.trim() &&
      !zEmail.safeParse(value.contactEmail.trim()).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["contactEmail"],
        message: "validation.common.email.invalid",
      });
    }

    requiredText(
      value.contactPhone,
      ["contactPhone"],
      "configuration.textMessaging.contactPhone.required",
      ctx,
    );
    if (
      value.contactPhone?.trim() &&
      !zPhone.safeParse(value.contactPhone.trim()).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "validation.common.phone.invalid",
      });
    }

    if (
      value.entityType &&
      value.entityType !== "SOLE_PROPRIETOR" &&
      !value.businessRegistrationNumber?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["businessRegistrationNumber"],
        message: "configuration.textMessaging.registrationNumber.required",
      });
    }
  });

export type SmsRegistrationView = {
  enabled: boolean;
  status: SmsRegistrationStatus;
  entityType: SmsEntityType;
  legalName: string;
  doingBusinessAs: string;
  businessRegistrationNumber: string;
  website: string;
  address: PostalAddress;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  rejectionReason?: string;
  blockedReason?: "number_preparing";
};

export type SmsRegistrationSaveResponse = {
  outcome: "saved" | "submitted" | "preparing";
  registration: SmsRegistrationView;
};
