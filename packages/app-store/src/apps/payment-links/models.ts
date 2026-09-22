import * as z from "zod";

export const paymentLinksVerificationModes = [
  "none",
  "contact-match",
  "otp",
] as const;

export type PaymentLinksVerificationMode =
  (typeof paymentLinksVerificationModes)[number];

export const paymentLinksTipPresetSchema = z.coerce
  .number<number>()
  .min(1)
  .max(100);

export const paymentLinksSettingsSchema = z.object({
  verification: z.enum(paymentLinksVerificationModes),
  emailTemplateId: z.string().optional(),
  smsTemplateId: z.string().optional(),
  headerId: z.string().optional(),
  footerId: z.string().optional(),
  linkExpiryDays: z.coerce.number<number>().int().min(1).max(365).optional(),
  tipsEnabled: z.boolean().optional(),
  /** Percentage presets (1–100). Max 4. */
  tipPresets: z.array(paymentLinksTipPresetSchema).max(4).optional(),
});

export type PaymentLinksSettings = z.infer<typeof paymentLinksSettingsSchema>;
