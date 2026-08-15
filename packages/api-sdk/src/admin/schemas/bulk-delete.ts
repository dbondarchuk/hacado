import { zNonEmptyString } from "@hacado/types";
import * as z from "zod";

export const bulkDeleteSchema = z.object({
  ids: z
    .array(zNonEmptyString("ID is required"))
    .min(1, "At least one ID is required"),
});
