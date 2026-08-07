import { zNonEmptyString, zUniqueArray } from "@hacado/types";
import * as z from "zod";
import { UrlBusyEventsAdminAllKeys } from "./translations/types";
import { isValidUrlWithPlaceholders } from "./url-placeholders";

export const urlBusyEventsConfigurationSchema = z.object({
  url: z
    .string()
    .min(
      1,
      "app_url-busy-events_admin.validation.form.url.required" satisfies UrlBusyEventsAdminAllKeys,
    )
    .max(
      2048,
      "app_url-busy-events_admin.validation.form.url.max" satisfies UrlBusyEventsAdminAllKeys,
    )
    .refine(
      isValidUrlWithPlaceholders,
      "app_url-busy-events_admin.validation.form.url.url" satisfies UrlBusyEventsAdminAllKeys,
    ),
  headers: zUniqueArray(
    z.array(
      z.object({
        key: zNonEmptyString(
          "app_url-busy-events_admin.validation.form.headers.key.required" satisfies UrlBusyEventsAdminAllKeys,
          1,
          256,
          "app_url-busy-events_admin.validation.form.headers.key.max" satisfies UrlBusyEventsAdminAllKeys,
        ),
        value: zNonEmptyString(
          "app_url-busy-events_admin.validation.form.headers.value.required" satisfies UrlBusyEventsAdminAllKeys,
          1,
          4096,
          "app_url-busy-events_admin.validation.form.headers.value.max" satisfies UrlBusyEventsAdminAllKeys,
        ),
      }),
    ),
    (header) => header.key,
    "app_url-busy-events_admin.validation.form.headers.key.unique" satisfies UrlBusyEventsAdminAllKeys,
  ).optional(),
});

export type UrlBusyEventsConfiguration = z.infer<
  typeof urlBusyEventsConfigurationSchema
>;
