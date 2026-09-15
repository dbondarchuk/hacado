import * as z from "zod";
import { menuItemsWithSubMenuSchema } from "../configuration/styling/menu-item";
import {
  zThemeColor,
  zThemeColorWithTransparent,
} from "../configuration/styling/styling";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { asOptionalField, Prettify } from "../utils";

export const pageHeaderPositionType = ["static", "sticky", "fixed"] as const;
export type PageHeaderPosition = (typeof pageHeaderPositionType)[number];

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

/** System color, transparent, or custom HSL `"H S% L%"`. */
export const zPageHeaderBackgroundColor = zThemeColorWithTransparent;

/** System color or custom HSL `"H S% L%"` (no transparent). */
export const zPageHeaderTextColor = zThemeColor;

const pageHeaderScrolledStyleSchema = z.object({
  backgroundColor: zPageHeaderBackgroundColor.optional().nullable(),
  textColor: zPageHeaderTextColor.optional().nullable(),
  hideName: z.coerce.boolean<boolean>().optional(),
  showLogo: z.coerce.boolean<boolean>().optional(),
  logoSize: z.enum(pageHeaderLogoSize).optional().nullable(),
  logoNameFontSize: z.enum(pageHeaderLogoNameFontSize).optional().nullable(),
  logoNameFontWeight: z
    .enum(pageHeaderLogoNameFontWeight)
    .optional()
    .nullable(),
  customLogoText: asOptionalField(z.union([z.string(), z.array(z.any())])),
  shadow: z.coerce.boolean<boolean>().optional().nullable(),
  backdropBlur: z.coerce.boolean<boolean>().optional(),
});

export type PageHeaderScrolledStyle = z.infer<
  typeof pageHeaderScrolledStyleSchema
>;

export const pageHeaderSchema = z.object({
  name: z
    .string("validation.page.headers.name.required")
    .min(2, "validation.page.headers.name.min")
    .max(256, "validation.page.headers.name.max"),
  menu: menuItemsWithSubMenuSchema,
  position: z.enum(pageHeaderPositionType).optional(),
  backgroundColor: zPageHeaderBackgroundColor.optional().nullable(),
  textColor: zPageHeaderTextColor.optional().nullable(),
  hideName: z.coerce.boolean<boolean>().optional(),
  showLogo: z.coerce.boolean<boolean>().default(false).optional(),
  logoSize: z.enum(pageHeaderLogoSize).optional(),
  logoNameFontSize: z.enum(pageHeaderLogoNameFontSize).optional(),
  logoNameFontWeight: z.enum(pageHeaderLogoNameFontWeight).optional(),
  customLogoText: asOptionalField(z.union([z.string(), z.array(z.any())])),
  sticky: z.coerce.boolean<boolean>().default(false).optional(),
  backdropBlur: z.coerce.boolean<boolean>().optional(),
  shadow: z.coerce.boolean<boolean>().optional().nullable(),
  /** When true, header content spans the full viewport width instead of the page container. */
  fullWidth: z.coerce.boolean<boolean>().optional(),
  scrolled: pageHeaderScrolledStyleSchema.optional(),
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

export const resolvePageHeaderPosition = (
  config: Pick<PageHeaderUpdateModel, "position" | "sticky">,
): PageHeaderPosition =>
  config.position ?? (config.sticky ? "sticky" : "static");
