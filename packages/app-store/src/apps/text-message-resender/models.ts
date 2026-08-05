import { asOptionalField, zObjectId } from "@hacado/types";
import * as z from "zod";

export const textMessageResenderConfigurationSchema = z.object({
  defaultMemberId: asOptionalField(zObjectId()),
});

export type TextMessageResenderConfiguration = z.infer<
  typeof textMessageResenderConfigurationSchema
>;
