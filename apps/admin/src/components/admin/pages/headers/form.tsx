"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { EditableText, richTextToString } from "@hacado/rte-inline";
import {
  getPageHeaderSchemaWithUniqueNameCheck,
  LinkMenuItem,
  pageHeaderLogoNameFontSize,
  pageHeaderLogoNameFontWeight,
  pageHeaderLogoSize,
  pageHeaderShadowType,
  PageHeaderUpdateModel,
} from "@hacado/types";
import {
  Breadcrumbs,
  Button,
  Checkbox,
  cn,
  Combobox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Heading,
  InfoTooltip,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton, Sortable } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { MenuItemCard } from "../../menu-item/menu-item-card";

export const PageHeaderForm: React.FC<{
  initialData?: PageHeaderUpdateModel & { _id?: string };
}> = ({ initialData }) => {
  const t = useI18n("admin");

  const headerShadowValues = pageHeaderShadowType.map((value) => ({
    value,
    label: t(`pages.headers.shadowType.${value}`),
  }));

  const cachedUniqueSlugCheck = useDebounceCacheFn(
    adminApi.pageHeaders.checkUniquePageHeaderName,
    300,
  );

  const formSchema = getPageHeaderSchemaWithUniqueNameCheck(
    (slug) => cachedUniqueSlugCheck(slug, initialData?._id),
    "pages.headers.name.unique",
  );

  type PageFormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = useState(false);
  const [customLogoTextEditorKey, setCustomLogoTextEditorKey] = useState(0);
  const router = useRouter();
  const form = useForm<PageFormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {},
  });

  const breadcrumbItems = useMemo(
    () => [
      { title: t("assets.dashboard"), link: "/dashboard" },
      { title: t("pages.title"), link: "/dashboard/pages" },
      { title: t("pages.headers.title"), link: "/dashboard/pages/headers" },
      {
        title: initialData?._id ? initialData.name : t("pages.headers.new"),
        link: initialData?._id
          ? `/dashboard/pages/headers/${initialData._id}`
          : "/dashboard/pages/headers/new",
      },
    ],
    [initialData?._id, initialData?.name, t],
  );

  const onSubmit = async (data: PageFormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } = await adminApi.pageHeaders.createPageHeader(data);
          router.push(`/dashboard/pages/headers/${_id}`);
        } else {
          await adminApi.pageHeaders.updatePageHeader(initialData._id, data);

          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t("pages.headers.toasts.changesSaved"),
        error: t("common.toasts.error"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { fields, append, remove, swap, update } = useFieldArray({
    control: form.control,
    name: "menu",
  });

  const ids = useMemo(() => fields.map((x) => x.id), [fields]);

  const sort = (activeId: string, overId: string) => {
    const activeIndex = fields.findIndex((x) => x.id === activeId);
    const overIndex = fields.findIndex((x) => x.id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swap(activeIndex, overIndex);
  };

  const addNew = () => {
    append({
      type: "link",
    } as Partial<LinkMenuItem> as LinkMenuItem);
  };

  return (
    <Form {...form}>
      <Breadcrumbs items={breadcrumbItems} />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-8 relative"
      >
        <Heading
          title={t(
            initialData?._id ? "pages.headers.edit" : "pages.headers.new",
          )}
          description={t(
            initialData?._id
              ? "pages.headers.managePageHeader"
              : "pages.headers.addNewPageHeader",
          )}
        />

        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("pages.headers.form.name")}</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    disabled={loading}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4 flex-col md:flex-row-reverse">
            <div className="gap-2 flex flex-col flex-grow-1">
              <FormField
                control={form.control}
                name="showLogo"
                render={({ field }) => (
                  <FormItem className="">
                    <div className="flex flex-row items-start gap-2">
                      <FormControl>
                        <Checkbox
                          id="showLogo"
                          disabled={loading}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex flex-col gap-1">
                        <FormLabel
                          htmlFor="showLogo"
                          className="cursor-pointer"
                        >
                          {t("pages.headers.form.showLogo")}
                        </FormLabel>
                        <FormDescription>
                          {t("pages.headers.form.showLogoDescription")}
                        </FormDescription>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.headers.form.logoSize.label")}{" "}
                      <InfoTooltip>
                        {t("pages.headers.form.logoSize.tooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        allowClear
                        values={pageHeaderLogoSize.map((size) => ({
                          label: t(
                            `pages.headers.form.logoSize.values.${size}`,
                          ),
                          value: size,
                        }))}
                        className="w-full"
                        value={field.value}
                        onItemSelect={(val) => {
                          field.onChange(val);
                          field.onBlur();
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoNameFontSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.headers.form.logoNameFontSize.label")}{" "}
                      <InfoTooltip>
                        {t("pages.headers.form.logoNameFontSize.tooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        allowClear
                        values={pageHeaderLogoNameFontSize.map((size) => ({
                          label: t(
                            `pages.headers.form.logoNameFontSize.values.${size}`,
                          ),
                          value: size,
                        }))}
                        className="w-full"
                        value={field.value}
                        onItemSelect={(val) => {
                          field.onChange(val);
                          field.onBlur();
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoNameFontWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.headers.form.logoNameFontWeight.label")}{" "}
                      <InfoTooltip>
                        {t("pages.headers.form.logoNameFontWeight.tooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        allowClear
                        values={pageHeaderLogoNameFontWeight.map((size) => ({
                          label: t(
                            `pages.headers.form.logoNameFontWeight.values.${size}`,
                          ),
                          value: size,
                        }))}
                        className="w-full"
                        value={field.value}
                        onItemSelect={(val) => {
                          field.onChange(val);
                          field.onBlur();
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customLogoText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.headers.form.customLogoText.label")}{" "}
                      <InfoTooltip>
                        {t("pages.headers.form.customLogoText.tooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput>
                          <EditableText
                            key={customLogoTextEditorKey}
                            value={field.value ?? ""}
                            onChange={(value) => {
                              field.onChange(
                                richTextToString(value).trim()
                                  ? value
                                  : undefined,
                              );
                            }}
                            className={cn(
                              "w-full border border-input rounded-md p-2 text-base sm:text-sm h-9 block",
                              InputGroupInputClasses({ variant: "suffix" }),
                            )}
                            disabled={loading}
                            inline
                          />
                        </InputGroupInput>
                        <InputGroupAddon>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            className={cn(
                              InputGroupAddonClasses({
                                variant: "suffix",
                              }),
                            )}
                            onClick={() => {
                              field.onChange(undefined);
                              setCustomLogoTextEditorKey((key) => key + 1);
                              field.onBlur();
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sticky"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row items-start gap-2">
                      <FormControl>
                        <Checkbox
                          id="sticky"
                          disabled={loading}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex flex-col gap-1">
                        <FormLabel htmlFor="sticky" className="cursor-pointer">
                          {t("pages.headers.form.stickyHeader")}
                        </FormLabel>
                        <FormDescription>
                          {t("pages.headers.form.stickyHeaderDescription")}
                        </FormDescription>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("sticky") && (
                <FormField
                  control={form.control}
                  name="backdropBlur"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-row items-start gap-2">
                        <FormControl>
                          <Checkbox
                            id="backdropBlur"
                            disabled={loading}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="flex flex-col gap-1">
                          <FormLabel
                            htmlFor="backdropBlur"
                            className="cursor-pointer"
                          >
                            {t("pages.headers.form.backdropBlur")}
                          </FormLabel>
                          <FormDescription>
                            {t("pages.headers.form.backdropBlurDescription")}
                          </FormDescription>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="shadow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.headers.form.headerShadow")}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        allowClear
                        values={headerShadowValues}
                        disabled={loading}
                        className="flex w-full font-normal text-lg"
                        searchLabel={t("pages.headers.form.selectShadowType")}
                        value={field.value}
                        onItemSelect={(value) => {
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Sortable
              title={t("pages.headers.form.menu")}
              ids={ids}
              onSort={sort}
              onAdd={addNew}
            >
              <div className="flex flex-grow flex-col gap-4">
                {fields.map((item, index) => {
                  return (
                    <MenuItemCard
                      supportsSubmenus
                      form={form}
                      item={item}
                      key={item.id}
                      name={`menu.${index}`}
                      disabled={loading}
                      remove={() => remove(index)}
                      update={(newValue) => update(index, newValue)}
                    />
                  );
                })}
              </div>
            </Sortable>
          </div>
        </div>
        <SaveButton form={form} disabled={loading} ignoreDirty />
      </form>
    </Form>
  );
};
