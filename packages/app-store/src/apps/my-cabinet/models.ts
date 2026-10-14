import { asOptionalField, zObjectId } from "@hacado/types";
import * as z from "zod";

export const myCabinetSettingsSchema = z.object({
  headerId: asOptionalField(zObjectId()),
  footerId: asOptionalField(zObjectId()),
});

export type MyCabinetSettings = z.infer<typeof myCabinetSettingsSchema>;
