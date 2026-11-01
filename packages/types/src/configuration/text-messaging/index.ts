import * as z from "zod";

const optionalPageId = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.string().max(64).optional(),
);

export const textMessagingConfigurationSchema = z
  .object({
    enabled: z.boolean().optional().default(false),
    privacyPageId: optionalPageId,
    termsPageId: optionalPageId,
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;

    if (!value.privacyPageId) {
      ctx.addIssue({
        code: "custom",
        path: ["privacyPageId"],
        message: "configuration.textMessaging.privacyPage.required",
      });
    }

    if (!value.termsPageId) {
      ctx.addIssue({
        code: "custom",
        path: ["termsPageId"],
        message: "configuration.textMessaging.termsPage.required",
      });
    }
  });

export type TextMessagingConfiguration = z.infer<
  typeof textMessagingConfigurationSchema
>;
