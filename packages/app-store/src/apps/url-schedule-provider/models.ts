import { zNonEmptyString, zUniqueArray } from "@hacado/types";
import * as z from "zod";
import { UrlScheduleProviderAdminAllKeys } from "./translations/types";
import { isValidUrlWithPlaceholders } from "./url-placeholders";

export const urlScheduleProviderConfigurationSchema = z.object({
  url: z
    .string()
    .min(
      1,
      "app_url-schedule-provider_admin.validation.form.url.required" satisfies UrlScheduleProviderAdminAllKeys,
    )
    .max(
      2048,
      "app_url-schedule-provider_admin.validation.form.url.max" satisfies UrlScheduleProviderAdminAllKeys,
    )
    .refine(
      isValidUrlWithPlaceholders,
      "app_url-schedule-provider_admin.validation.form.url.url" satisfies UrlScheduleProviderAdminAllKeys,
    ),
  headers: zUniqueArray(
    z.array(
      z.object({
        key: zNonEmptyString(
          "app_url-schedule-provider_admin.validation.form.headers.key.required" satisfies UrlScheduleProviderAdminAllKeys,
          1,
          256,
          "app_url-schedule-provider_admin.validation.form.headers.key.max" satisfies UrlScheduleProviderAdminAllKeys,
        ),
        value: zNonEmptyString(
          "app_url-schedule-provider_admin.validation.form.headers.value.required" satisfies UrlScheduleProviderAdminAllKeys,
          1,
          4096,
          "app_url-schedule-provider_admin.validation.form.headers.value.max" satisfies UrlScheduleProviderAdminAllKeys,
        ),
      }),
    ),
    (header) => header.key,
    "app_url-schedule-provider_admin.validation.form.headers.key.unique" satisfies UrlScheduleProviderAdminAllKeys,
  ).optional(),
});

export type UrlScheduleProviderConfiguration = z.infer<
  typeof urlScheduleProviderConfigurationSchema
>;
