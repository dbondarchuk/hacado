"use client";

import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
import { I18nText } from "@hacado/i18n/components";
import { ColorExtendedInput } from "@hacado/page-builder-base/style-inputs";
import { EditableText } from "@hacado/rte-inline";
import {
  ButtonSizes,
  ButtonVariants,
  LinkSizes,
  LinkVariants,
  MenuItemType,
  SubMenuItem,
  TextFonts,
  TextSizes,
  TextWeights,
} from "@hacado/types";
import {
  BooleanSelect,
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  InfoTooltip,
  Input,
  Link,
  Switch,
} from "@hacado/ui";
import { PageSelectorInput, Sortable } from "@hacado/ui-admin";
import { useMemo } from "react";
import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import { IconSelect } from "./icon-select";
import { SubMenuItemCard, SubMenuItemWithId } from "./sub-menu-item-card";
import { useCollapsedSortableItems } from "./use-collapsed-sortable-items";

export type MenuItemFieldsProps = {
  type: MenuItemType;
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  enableScrolledOverrides?: boolean;
  enableMobileOverrides?: boolean;
  enableMobileHeaderPin?: boolean;
};

const linkVariantsValues = LinkVariants.map(
  (variant) =>
    ({
      value: variant,
      shortLabel: (
        <I18nText
          text={`admin.menuItem.linkVariants.${variant}` satisfies BaseAllKeys}
        />
      ),
      label: (
        <Link href="#" variant={variant} onClick={(e) => e.preventDefault()}>
          <I18nText
            text={
              `admin.menuItem.linkVariants.${variant}` satisfies BaseAllKeys
            }
          />
        </Link>
      ),
    }) as IComboboxItem,
);

const buttonVariantsValues = ButtonVariants.map(
  (variant) =>
    ({
      value: variant,
      shortLabel: (
        <I18nText
          text={
            `admin.menuItem.buttonVariants.${variant}` satisfies BaseAllKeys
          }
        />
      ),
      label: (
        <Link
          button
          href="#"
          variant={variant}
          size="sm"
          onClick={(e) => e.preventDefault()}
        >
          <I18nText
            text={
              `admin.menuItem.buttonVariants.${variant}` satisfies BaseAllKeys
            }
          />
        </Link>
      ),
    }) as IComboboxItem,
);

const linkSizesValues = LinkSizes.map(
  (size) =>
    ({
      value: size,
      shortLabel: (
        <I18nText text={`admin.menuItem.sizes.${size}` satisfies BaseAllKeys} />
      ),
      label: (
        <Link
          href="#"
          size={size}
          variant="default"
          onClick={(e) => e.preventDefault()}
        >
          <I18nText
            text={`admin.menuItem.sizes.${size}` satisfies BaseAllKeys}
          />
        </Link>
      ),
    }) as IComboboxItem,
);

const buttonSizesValues = ButtonSizes.map(
  (size) =>
    ({
      value: size,
      shortLabel: (
        <I18nText text={`admin.menuItem.sizes.${size}` satisfies BaseAllKeys} />
      ),
      label: (
        <Link
          button
          href="#"
          size={size}
          variant="secondary"
          onClick={(e) => e.preventDefault()}
        >
          <I18nText
            text={`admin.menuItem.sizes.${size}` satisfies BaseAllKeys}
          />
        </Link>
      ),
    }) as IComboboxItem,
);

const textFontValues = TextFonts.map(
  (variant) =>
    ({
      value: variant,
      shortLabel: (
        <I18nText
          text={`admin.menuItem.fonts.${variant}` satisfies BaseAllKeys}
        />
      ),
      label: (
        <Link
          button
          href="#"
          font={variant}
          variant="secondary"
          onClick={(e) => e.preventDefault()}
        >
          <I18nText
            text={`admin.menuItem.fonts.${variant}` satisfies BaseAllKeys}
          />
        </Link>
      ),
    }) as IComboboxItem,
);

const textSizesValues = TextSizes.map(
  (variant) =>
    ({
      value: variant,
      shortLabel: (
        <I18nText
          text={`admin.menuItem.sizes.${variant}` satisfies BaseAllKeys}
        />
      ),
      label: (
        <Link
          button
          href="#"
          fontSize={variant}
          variant="secondary"
          onClick={(e) => e.preventDefault()}
        >
          <I18nText
            text={`admin.menuItem.sizes.${variant}` satisfies BaseAllKeys}
          />
        </Link>
      ),
    }) as IComboboxItem,
);

const textWeightsValues = TextWeights.map(
  (variant) =>
    ({
      value: variant,
      shortLabel: (
        <I18nText
          text={`admin.menuItem.weights.${variant}` satisfies BaseAllKeys}
        />
      ),
      label: (
        <Link
          button
          href="#"
          fontWeight={variant}
          variant="secondary"
          onClick={(e) => e.preventDefault()}
        >
          <I18nText
            text={`admin.menuItem.weights.${variant}` satisfies BaseAllKeys}
          />
        </Link>
      ),
    }) as IComboboxItem,
);

const AppearanceFields: React.FC<{
  form: UseFormReturn<any>;
  prefix: string;
  type: MenuItemType;
  disabled?: boolean;
}> = ({ form, prefix, type, disabled }) => {
  const t = useI18n("admin");

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {(type === "link" ||
        type === "button" ||
        type === "submenu" ||
        type === "icon") && (
        <FormField
          control={form.control}
          name={`${prefix}.textColor`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("menuItem.fields.textColor")}{" "}
                <InfoTooltip>
                  {t("menuItem.fields.textColorDescription")}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <ColorExtendedInput
                  defaultValue={field.value ?? null}
                  nullable
                  allowTransparent={false}
                  onChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {type === "icon" && (
        <FormField
          control={form.control}
          name={`${prefix}.icon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("menuItem.fields.icon")}</FormLabel>
              <FormControl>
                <IconSelect field={field} disabled={disabled} allowClear />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {type === "link" && (
        <>
          <FormField
            control={form.control}
            name={`${prefix}.variant`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.variant")}</FormLabel>
                <FormControl>
                  <Combobox
                    allowClear
                    disabled={disabled}
                    className="flex w-full font-normal text-lg"
                    values={linkVariantsValues}
                    searchLabel={t("menuItem.fields.selectVariant")}
                    value={field.value}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.size`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.size")}</FormLabel>
                <FormControl>
                  <Combobox
                    allowClear
                    disabled={disabled}
                    className="flex w-full font-normal text-lg"
                    values={linkSizesValues}
                    searchLabel={t("menuItem.fields.selectSize")}
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
      {type === "button" && (
        <>
          <FormField
            control={form.control}
            name={`${prefix}.variant`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.variant")}</FormLabel>
                <FormControl>
                  <Combobox
                    allowClear
                    disabled={disabled}
                    className="flex w-full font-normal text-lg"
                    values={buttonVariantsValues}
                    searchLabel={t("menuItem.fields.selectButtonVariant")}
                    value={field.value}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.size`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.size")}</FormLabel>
                <FormControl>
                  <Combobox
                    allowClear
                    disabled={disabled}
                    className="flex w-full font-normal text-lg"
                    values={buttonSizesValues}
                    searchLabel={t("menuItem.fields.selectSize")}
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
      {(type === "link" || type === "button" || type === "submenu") && (
        <>
          <FormField
            control={form.control}
            name={`${prefix}.font`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.textFont")}</FormLabel>
                <FormControl>
                  <Combobox
                    allowClear
                    disabled={disabled}
                    className="flex w-full font-normal text-lg"
                    values={textFontValues}
                    searchLabel={t("menuItem.fields.selectTextFont")}
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.fontSize`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.textSize")}</FormLabel>
                <FormControl>
                  <Combobox
                    allowClear
                    disabled={disabled}
                    className="flex w-full font-normal text-lg"
                    values={textSizesValues}
                    searchLabel={t("menuItem.fields.selectTextSize")}
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.fontWeight`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.textWeight")}</FormLabel>
                <FormControl>
                  <Combobox
                    allowClear
                    disabled={disabled}
                    className="flex w-full font-normal text-lg"
                    values={textWeightsValues}
                    searchLabel={t("menuItem.fields.selectTextWeight")}
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.prefixIcon`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.prefixIcon")}</FormLabel>
                <FormControl>
                  <IconSelect field={field} disabled={disabled} allowClear />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.suffixIcon`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.suffixIcon")}</FormLabel>
                <FormControl>
                  <IconSelect field={field} disabled={disabled} allowClear />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
      {type === "submenu" && (
        <FormField
          control={form.control}
          name={`${prefix}.hideChevron`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("menuItem.subMenu.hideChevron")}{" "}
                <InfoTooltip>
                  {t("menuItem.subMenu.hideChevronDescription")}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  className="w-full"
                  disabled={disabled}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {(type === "link" ||
        type === "button" ||
        type === "submenu" ||
        type === "icon") && (
        <>
          <FormField
            control={form.control}
            name={`${prefix}.doNotCombineClassName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("menuItem.fields.doNotCombineClassName")}{" "}
                  <InfoTooltip>
                    {t("menuItem.fields.doNotCombineClassNameDescription")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <BooleanSelect
                    className="w-full"
                    disabled={disabled}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      field.onBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.className`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.additionalClasses")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={disabled}
                    placeholder={t(
                      "menuItem.fields.additionalClassesPlaceholder",
                    )}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
      {type === "submenu" &&
        !prefix.endsWith(".scrolled") &&
        !prefix.endsWith(".mobile") && (
          <FormField
            control={form.control}
            name={`${prefix}.twoColumns`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("menuItem.subMenu.twoColumns")}{" "}
                  <InfoTooltip>
                    {t("menuItem.subMenu.twoColumnsDescription")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <BooleanSelect
                    className="w-full"
                    disabled={disabled}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      field.onBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
    </div>
  );
};

export const MenuItemFields: React.FC<MenuItemFieldsProps> = ({
  form,
  name,
  disabled,
  type,
  enableScrolledOverrides,
  enableMobileOverrides,
  enableMobileHeaderPin,
}) => {
  const t = useI18n("admin");

  const {
    fields: subMenuItems,
    append: appendSubMenu,
    remove: removeSubMenu,
    swap: swapSubMenus,
  } = useFieldArray({
    control: form.control,
    name: `${name}.children`,
  });

  const menuItems = useWatch({ control: form.control, name: "menu" }) as
    | { type?: string; showOnMobileHeader?: boolean }[]
    | undefined;
  const itemIndex = Number(name.match(/^menu\.(\d+)/)?.[1] ?? -1);
  const showMobileHeaderPin =
    Boolean(enableMobileHeaderPin) && type !== "submenu" && type !== "spacer";

  const subMenusIds = useMemo(
    () => subMenuItems.map((x) => x.id),
    [subMenuItems],
  );

  const {
    allCollapsed: allSubMenusCollapsed,
    toggleAll: toggleAllSubMenus,
    toggleOne: toggleSubMenu,
    isCollapsed: isSubMenuCollapsed,
  } = useCollapsedSortableItems(subMenusIds);

  const sortSubMenus = (activeId: string, overId: string) => {
    const activeIndex = subMenuItems.findIndex((x) => x.id === activeId);
    const overIndex = subMenuItems.findIndex((x) => x.id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swapSubMenus(activeIndex, overIndex);
  };

  const addNewSubMenu = () => {
    appendSubMenu({
      type: "link",
    } as Partial<SubMenuItem> as SubMenuItem);
  };

  if (type === "spacer") {
    return null;
  }

  return (
    <>
      {showMobileHeaderPin && (
        <FormField
          control={form.control}
          name={`${name}.showOnMobileHeader`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">
                  {t("menuItem.fields.showOnMobileHeader")}
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t("menuItem.fields.showOnMobileHeaderDescription")}
                </p>
              </div>
              <FormControl>
                <Switch
                  disabled={disabled}
                  checked={!!field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked && menuItems) {
                      menuItems.forEach((_, index) => {
                        if (index === itemIndex) return;
                        form.setValue(
                          `menu.${index}.showOnMobileHeader`,
                          false,
                          { shouldDirty: true },
                        );
                      });
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {type !== "submenu" && (
          <FormField
            control={form.control}
            name={`${name}.url`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.url")}</FormLabel>
                <FormControl>
                  <PageSelectorInput
                    disabled={disabled}
                    placeholder={t("menuItem.fields.urlPlaceholder")}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name={`${name}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("menuItem.fields.label")}</FormLabel>
              <FormControl>
                <EditableText
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder={t("menuItem.fields.labelPlaceholder")}
                  className="w-full border border-input rounded-md p-2 text-base sm:text-sm h-9"
                  disabled={disabled}
                  inline
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <AppearanceFields
        form={form}
        prefix={name}
        type={type}
        disabled={disabled}
      />
      {enableMobileOverrides && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("pages.headers.form.mobileSection")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("pages.headers.form.mobileSectionDescription")}
            </p>
          </div>
          <AppearanceFields
            form={form}
            prefix={`${name}.mobile`}
            type={type}
            disabled={disabled}
          />
        </div>
      )}
      {enableScrolledOverrides && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("pages.headers.form.onScrollSection")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("pages.headers.form.onScrollSectionDescription")}
            </p>
          </div>
          <AppearanceFields
            form={form}
            prefix={`${name}.scrolled`}
            type={type}
            disabled={disabled}
          />
        </div>
      )}
      {type === "submenu" && (
        <Sortable
          title={t("menuItem.subMenu.title")}
          ids={subMenusIds}
          onSort={sortSubMenus}
          onAdd={addNewSubMenu}
          allCollapsed={allSubMenusCollapsed}
          collapse={toggleAllSubMenus}
        >
          <div className="flex flex-grow flex-col gap-4">
            {subMenuItems.map((item, index) => {
              return (
                <SubMenuItemCard
                  form={form}
                  item={item as SubMenuItemWithId}
                  key={item.id}
                  name={`${name}.children.${index}`}
                  disabled={disabled}
                  collapsed={isSubMenuCollapsed(item.id)}
                  onCollapsedChange={() => toggleSubMenu(item.id)}
                  enableScrolledOverrides={enableScrolledOverrides}
                  enableMobileOverrides={enableMobileOverrides}
                  remove={() => removeSubMenu(index)}
                />
              );
            })}
          </div>
        </Sortable>
      )}
    </>
  );
};
