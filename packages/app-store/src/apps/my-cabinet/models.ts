import { asOptionalField, zObjectId } from "@hacado/types/utils";
import * as z from "zod";

export const myCabinetSettingsSchema = z.object({
  /** When true, `/my-cabinet` is not claimed by the app (CMS/block page can be used instead). */
  publicPageDisabled: z.boolean().optional(),
  headerId: asOptionalField(zObjectId()),
  footerId: asOptionalField(zObjectId()),
});

export type MyCabinetSettings = z.infer<typeof myCabinetSettingsSchema>;

export function isMyCabinetPublicPageEnabled(
  settings: MyCabinetSettings | null | undefined,
): boolean {
  return settings?.publicPageDisabled !== true;
}
