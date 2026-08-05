"use client";

import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
import { I18nText } from "@hacado/i18n/components";
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
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  Input,
  Link,
} from "@hacado/ui";
import { PageSelectorInput, Sortable } from "@hacado/ui-admin";
import { useMemo } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { IconSelect } from "./icon-select";
import { SubMenuItemCard, SubMenuItemWithId } from "./sub-menu-item-card";

export type MenuItemFieldsProps = {
  type: MenuItemType;
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
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

export const MenuItemFields: React.FC<MenuItemFieldsProps> = ({
  form,
  name,
  disabled,
  type,
}) => {
  const t = useI18n("admin");

  const {
    fields: subMenuItems,
    append: appendSubMenu,
    remove: removeSubMenu,
    swap: swapSubMenus,
    update: updateSubMenu,
  } = useFieldArray({
    control: form.control,
    name: `${name}.children`,
  });

  const subMenusIds = useMemo(
    () => subMenuItems.map((x) => x.id),
    [subMenuItems],
  );

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
                    h="sm"
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
                  className="w-full border border-input rounded-md p-2 text-base sm:text-sm h-8"
                  disabled={disabled}
                  inline
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {type === "icon" && (
          <FormField
            control={form.control}
            name={`${name}.icon`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("menuItem.fields.icon")}</FormLabel>
                <FormControl>
                  <IconSelect field={field} disabled={disabled} />
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
              shouldUnregister
              name={`${name}.variant`}
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
              shouldUnregister
              name={`${name}.size`}
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
              shouldUnregister
              name={`${name}.variant`}
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
              shouldUnregister
              name={`${name}.size`}
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
        {(type === "link" || type === "button") && (
          <>
            <FormField
              control={form.control}
              shouldUnregister
              name={`${name}.font`}
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
              shouldUnregister
              name={`${name}.fontSize`}
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
              shouldUnregister
              name={`${name}.fontWeight`}
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
              name={`${name}.prefixIcon`}
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
              name={`${name}.suffixIcon`}
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
        <FormField
          control={form.control}
          name={`${name}.className`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("menuItem.fields.additionalClasses")}</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder={t(
                    "menuItem.fields.additionalClassesPlaceholder",
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {type === "submenu" && (
        <Sortable
          title={t("menuItem.subMenu.title")}
          ids={subMenusIds}
          onSort={sortSubMenus}
          onAdd={addNewSubMenu}
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
