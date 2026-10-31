import * as z from "zod";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify } from "../utils";

export const pageFooterSchema = z.object({
  name: z
    .string({ error: "validation.page.footers.name.required" })
    .min(2, "validation.page.footers.name.min")
    .max(256, "validation.page.footers.name.max"),
  content: z.any().optional(),
});

export const getPageFooterSchemaWithUniqueNameCheck = (
  uniqueNameCheckFn: (name: string, id?: string) => Promise<boolean>,
  message: string,
) => {
  return z.object({
    ...pageFooterSchema.shape,
    name: pageFooterSchema.shape.name.refine(
      async (name) => {
        if (!name) return true;

        return uniqueNameCheckFn(name);
      },
      { message },
    ),
  });
};

export type PageFooterUpdateModel = z.infer<typeof pageFooterSchema>;

export type PageFooter = Prettify<
  WithOrganizationId<WithDatabaseId<PageFooterUpdateModel>> & {
    updatedAt: Date;
  }
>;

export type PageFooterListModel = Omit<PageFooter, "content"> & {
  usedCount: number;
};
