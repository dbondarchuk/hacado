import { asOptionalField, zObjectId } from "@timelish/types";
import * as z from "zod";

export const textMessageResenderConfigurationSchema = z.object({
  defaultMemberId: asOptionalField(zObjectId()),
});

export type TextMessageResenderConfiguration = z.infer<
  typeof textMessageResenderConfigurationSchema
>;
