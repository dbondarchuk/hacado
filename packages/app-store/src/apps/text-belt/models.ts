import { zNonEmptyString } from "@hacado/types";
import * as z from "zod";
import { TextBeltAdminAllKeys } from "./translations/types";

export const textBeltConfigurationSchema = z.object({
  apiKey: zNonEmptyString(
    "app_text-belt_admin.validation.apiKey.required" satisfies TextBeltAdminAllKeys,
    3,
    256,
    "app_text-belt_admin.validation.apiKey.max" satisfies TextBeltAdminAllKeys,
  ),
});

export type TextBeltConfiguration = z.infer<typeof textBeltConfigurationSchema>;
