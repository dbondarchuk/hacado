import {
  Prettify,
  WithAppId,
  WithDatabaseId,
  WithOrganizationId,
  zNonEmptyString,
} from "@hacado/types";
import * as z from "zod";
import { designSchema } from "../designer/lib/schema";
import { GiftCardStudioAdminAllKeys } from "../translations/types";

export const GIFT_CARD_DESIGNS_COLLECTION_NAME = "gift-card-studio-designs";

export const designSchemaBase = z.object({
  name: zNonEmptyString(
    "app_gift-card-studio_admin.validation.design.name.min" satisfies GiftCardStudioAdminAllKeys,
    1,
  ).max(
    64,
    "app_gift-card-studio_admin.validation.design.name.max" satisfies GiftCardStudioAdminAllKeys,
  ),
  isArchived: z.coerce.boolean<boolean>().optional(),
  design: designSchema,
});

export const getDesignSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean>,
  options: {
    message?: string;
    omitDesign?: boolean;
  } = {
    message:
      "app_gift-card-studio_admin.validation.design.name.unique" satisfies GiftCardStudioAdminAllKeys,
    omitDesign: false,
  },
) => {
  const { message, omitDesign } = options;
  const schema = omitDesign
    ? designSchemaBase.omit({ design: true })
    : designSchemaBase;
  return schema.superRefine(async (args, ctx) => {
    const isUnique = await uniqueNameCheckFn(args.name);
    if (!isUnique) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message,
      });
    }
  });
};

export type DesignUpdateModel = z.infer<typeof designSchemaBase>;

export type DesignModel = Prettify<
  WithOrganizationId<
    WithDatabaseId<WithAppId<DesignUpdateModel>> & {
      createdAt: Date;
      updatedAt: Date;
    }
  >
>;

export type DesignListModel = Omit<DesignModel, "design"> & {
  purchasesCount: number;
};

export const getDesignsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number<number>().optional(),
  offset: z.coerce.number<number>().optional(),
  sort: z
    .array(
      z.object({
        id: z.string(),
        desc: z.coerce.boolean<boolean>().optional(),
      }),
    )
    .optional(),
  isArchived: z.array(z.coerce.boolean<boolean>()).optional(),
  priorityIds: z.array(z.string()).optional(),
});

export type GetDesignsQuery = z.infer<typeof getDesignsQuerySchema>;
