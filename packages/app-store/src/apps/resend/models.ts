import { asOptionalField } from "@hacado/types/utils";
import * as z from "zod";
import { ResendAdminAllKeys } from "./translations/types";

export const resendFromSettingsSchema = z.object({
  fromEmail: z.email(
    "app_resend_admin.validation.fromEmail.invalid" satisfies ResendAdminAllKeys,
  ),
  fromName: asOptionalField(
    z
      .string()
      .max(
        256,
        "app_resend_admin.validation.fromName.max" satisfies ResendAdminAllKeys,
      ),
  ),
});

export type ResendFromSettings = z.infer<typeof resendFromSettingsSchema>;

/** Persisted connected-app `data` (from settings optional until configured). */
export type ResendAppData = {
  fromEmail?: string;
  fromName?: string;
  /** Encrypted PKCE code_verifier stored only during OAuth authorization. */
  pkceCodeVerifier?: string;
};
