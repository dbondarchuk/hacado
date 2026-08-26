import * as z from "zod";

// import { icons } from "lucide-react";

export const ButtonSizes = [
  "none",
  "default",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "icon",
] as const;
export const ButtonVariants = [
  "default",
  "primary",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
  "link-underline",
  "link-dashed",
] as const;
export const LinkSizes = ["none", "xs", "sm", "md", "lg", "xl"] as const;
export const LinkVariants = [
  "none",
  "default",
  "underline",
  "standalone",
  "dashed",
] as const;
export const TextFonts = [
  "default",
  "primary",
  "secondary",
  "tertiary",
] as const;
export const TextSizes = ["default", "sm", "md", "lg", "xl"] as const;
export const TextWeights = [
  "default",
  "light",
  "thin",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
  "extralight",
] as const;

// const [firstIcon, ...restIcons] = Object.keys(icons);
// const iconsEnum = z.enum([firstIcon, ...restIcons], {
//   error: "configuration.styling.menuItem.icon.required",
// });

export const menuItemTypes = [
  "icon",
  "link",
  "button",
  "submenu",
  "spacer",
] as const;
export const menuItemTypesEnum = z.enum(menuItemTypes);
export type MenuItemType = (typeof menuItemTypes)[number];

const [firstLinkVariant, ...restLinkVariants] = LinkVariants;
const [firstLinkSize, ...restLinkSizes] = LinkSizes;
const [firstButtonVariant, ...restButtonVariants] = ButtonVariants;
const [firstButtonSize, ...restButtonSizes] = ButtonSizes;
const [firstFont, ...restFonts] = TextFonts;
const [firstTextSize, ...restTextSizes] = TextSizes;
const [firstTextWeight, ...restTextWeights] = TextWeights;

export const baseMenuItemSchema = z.object({
  url: z
    .string({ error: "validation.common.url.invalid" })
    .min(1, "validation.common.url.invalid")
    .max(2048, "validation.common.url.max"),
  label: z.union([
    z
      .string({
        error: "validation.configuration.styling.menuItem.label.required",
      })
      .min(1, "validation.configuration.styling.menuItem.label.required")
      .max(256, "validation.configuration.styling.menuItem.label.max"),
    z.array(z.any()).optional(),
  ]),
  className: z.string().optional(),
});

export type BaseMenuItem = z.infer<typeof baseMenuItemSchema>;

export const iconMenuItemSchema = z.object({
  ...baseMenuItemSchema.shape,
  // icon: iconsEnum,
  icon: z.string(),
  type: menuItemTypesEnum.extract(["icon"]),
});

export type IconMenuItem = z.infer<typeof iconMenuItemSchema>;

const textStyleSchema = z.object({
  ...baseMenuItemSchema.shape,
  font: z
    .enum([firstFont, ...restFonts])
    .nullable()
    .optional(),
  fontSize: z
    .enum([firstTextSize, ...restTextSizes])
    .nullable()
    .optional(),
  fontWeight: z
    .enum([firstTextWeight, ...restTextWeights])
    .nullable()
    .optional(),
});

export type TextStyle = z.infer<typeof textStyleSchema>;

export const linkMenuItemSchema = z.object({
  ...textStyleSchema.shape,
  prefixIcon: z.string().optional(),
  suffixIcon: z.string().optional(),
  variant: z
    .enum([firstLinkVariant, ...restLinkVariants])
    .nullable()
    .optional(),
  size: z
    .enum([firstLinkSize, ...restLinkSizes])
    .nullable()
    .optional(),
  type: menuItemTypesEnum.extract(["link"]),
});

export type LinkMenuItem = z.infer<typeof linkMenuItemSchema>;

export const buttonMenuItemSchema = z.object({
  ...linkMenuItemSchema.shape,
  variant: z
    .enum([firstButtonVariant, ...restButtonVariants])
    .nullable()
    .optional(),
  size: z
    .enum([firstButtonSize, ...restButtonSizes])
    .nullable()
    .optional(),
  type: menuItemTypesEnum.extract(["button"]),
});

export type ButtonMenuItem = z.infer<typeof buttonMenuItemSchema>;

export const spacerMenuItemSchema = z.object({
  type: menuItemTypesEnum.extract(["spacer"]),
});

export type SpacerMenuItem = z.infer<typeof spacerMenuItemSchema>;

export const subMenuItemSchema = linkMenuItemSchema;

export type SubMenuItem = z.infer<typeof subMenuItemSchema>;

export const subMenuMenuItemSchema = z.object({
  ...linkMenuItemSchema.omit({ url: true }).shape,
  children: subMenuItemSchema
    .array()
    .min(1, "configuration.styling.menuItem.submenu.min"),
  twoColumns: z.coerce.boolean<boolean>().optional(),
  hideChevron: z.coerce.boolean<boolean>().optional(),
  type: menuItemTypesEnum.extract(["submenu"]),
});

export type SubMenuMenuItem = z.infer<typeof subMenuMenuItemSchema>;

export const menuItemSchema = z.discriminatedUnion("type", [
  iconMenuItemSchema,
  linkMenuItemSchema,
  buttonMenuItemSchema,
  spacerMenuItemSchema,
]);

export type MenuItem = z.infer<typeof menuItemSchema>;

export const menuItemWithSubMenuSchema = z.discriminatedUnion("type", [
  ...menuItemSchema.options,
  subMenuMenuItemSchema,
]);

export type MenuItemWithSubMenu = z.infer<typeof menuItemWithSubMenuSchema>;

export const menuItemsSchema = z.array(menuItemSchema);
export type MenuItems = z.infer<typeof menuItemsSchema>;

export const menuItemsWithSubMenuSchema = z.array(menuItemWithSubMenuSchema);
export type MenuItemsWithSubMenus = z.infer<typeof menuItemsWithSubMenuSchema>;
