import * as z from "zod";

/** Page HTML id/className on blocks — page-builder only, not core builder. */
export const PageBaseBlockPropsSchema = z
  .object({
    id: z
      .string()
      .regex(/^(?:|-?[_a-zA-Z][_a-zA-Z0-9-]*)$/, "pageBuilder.base.idInvalid")
      .optional(),
    className: z.string().optional(),
  })
  .optional();
