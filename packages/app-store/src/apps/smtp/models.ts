import { asOptionalField, zNonEmptyString } from "@hacado/types";
import * as z from "zod";
import { SmtpAdminAllKeys } from "./translations/types";

export const smtpConfigurationSchema = z.object({
  host: zNonEmptyString(
    "app_smtp_admin.validation.host.required" satisfies SmtpAdminAllKeys,
    3,
    256,
    "app_smtp_admin.validation.host.max" satisfies SmtpAdminAllKeys,
  ),
  port: z.coerce
    .number<number>(
      "app_smtp_admin.validation.port.integer" satisfies SmtpAdminAllKeys,
    )
    .int("app_smtp_admin.validation.port.integer" satisfies SmtpAdminAllKeys)
    .min(1, {
      message: "app_smtp_admin.validation.port.min" satisfies SmtpAdminAllKeys,
    })
    .max(99999, {
      message: "app_smtp_admin.validation.port.max" satisfies SmtpAdminAllKeys,
    }),
  secure: z.coerce.boolean<boolean>(),
  email: z.email(
    "app_smtp_admin.validation.email.invalid" satisfies SmtpAdminAllKeys,
  ),
  auth: z.object({
    user: asOptionalField(
      z
        .string()
        .max(
          256,
          "app_smtp_admin.validation.auth.user.max" satisfies SmtpAdminAllKeys,
        ),
    ),
    pass: asOptionalField(
      z
        .string()
        .max(
          256,
          "app_smtp_admin.validation.auth.pass.max" satisfies SmtpAdminAllKeys,
        ),
    ),
  }),
});

export type SmtpConfiguration = z.infer<typeof smtpConfigurationSchema>;
