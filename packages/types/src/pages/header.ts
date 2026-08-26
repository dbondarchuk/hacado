import * as z from "zod";
import { menuItemsWithSubMenuSchema } from "../configuration/styling/menu-item";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { asOptionalField, Prettify } from "../utils";

export const pageHeaderShadowType = ["none", "static", "on-scroll"] as const;

export const pageHeaderLogoSize = ["small", "medium", "large"] as const;
export type PageHeaderLogoSize = (typeof pageHeaderLogoSize)[number];

export const pageHeaderLogoNameFontSize = [
  "small",
  "medium",
  "large",
  "x-large",
] as const;
export type PageHeaderLogoNameFontSize =
  (typeof pageHeaderLogoNameFontSize)[number];

export const pageHeaderLogoNameFontWeight = [
  "light",
  "regular",
  "medium",
  "semibold",
  "bold",
] as const;
export type PageHeaderLogoNameFontWeight =
  (typeof pageHeaderLogoNameFontWeight)[number];

export const pageHeaderSchema = z.object({
  name: z
    .string("validation.page.headers.name.required")
    .min(2, "validation.page.headers.name.min")
    .max(256, "validation.page.headers.name.max"),
  menu: menuItemsWithSubMenuSchema,
  showLogo: z.coerce.boolean<boolean>().default(false).optional(),
  logoSize: z.enum(pageHeaderLogoSize).optional(),
  logoNameFontSize: z.enum(pageHeaderLogoNameFontSize).optional(),
  logoNameFontWeight: z.enum(pageHeaderLogoNameFontWeight).optional(),
  customLogoText: asOptionalField(z.union([z.string(), z.array(z.any())])),
  sticky: z.coerce.boolean<boolean>().default(false).optional(),
  backdropBlur: z.coerce.boolean<boolean>().optional(),
  shadow: z.enum(pageHeaderShadowType).optional(),
});

export const getPageHeaderSchemaWithUniqueNameCheck = (
  uniqueNameCheckFn: (name: string, id?: string) => Promise<boolean>,
  message: string,
) => {
  return z.object({
    ...pageHeaderSchema.shape,
    name: pageHeaderSchema.shape.name.refine(uniqueNameCheckFn, { message }),
  });
};

export type PageHeaderUpdateModel = z.infer<typeof pageHeaderSchema>;

export type PageHeader = Prettify<
  WithOrganizationId<WithDatabaseId<PageHeaderUpdateModel>> & {
    updatedAt: Date;
  }
>;

export type PageHeaderListModel = Omit<PageHeader, "menu"> & {
  usedCount: number;
};
