import { BaseAllKeys, languages } from "@hacado/i18n";
import {
  asOptionalField,
  calendarSourcesConfigurationSchema,
  zAssetName,
  zNonEmptyString,
  zObjectId,
  zPhone,
} from "@hacado/types";
import { z } from "zod";

export const userUpdateSchema = z.object({
  name: zNonEmptyString(
    "admin.users.validation.name.required" satisfies BaseAllKeys,
    2,
    256,
    "admin.users.validation.name.max" satisfies BaseAllKeys,
  ),
  //   email: zEmail,
  phone: zPhone,
  language: z.enum(languages, {
    error: "admin.users.validation.language.invalid" satisfies BaseAllKeys,
  }),
  image: asOptionalField(zAssetName).nullable(),
  bio: asOptionalField(
    z
      .string()
      .max(1024, "admin.users.validation.bio.max" satisfies BaseAllKeys),
  ).nullable(),
  calendarSources: calendarSourcesConfigurationSchema,
  meetingUrlProviderAppId: asOptionalField(zObjectId()).nullable(),
});

export type UserUpdate = z.infer<typeof userUpdateSchema>;
