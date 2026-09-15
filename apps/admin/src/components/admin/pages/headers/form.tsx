"use client";

import { adminApi } from "@hacado/api-sdk";
import { AdminKeys, useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { Header } from "@hacado/page-builder-base";
import { ColorExtendedInput } from "@hacado/page-builder-base/style-inputs";
import { EditableText, richTextToString } from "@hacado/rte-inline";
import {
  getPageHeaderSchemaWithUniqueNameCheck,
  LinkMenuItem,
  pageHeaderLogoNameFontSize,
  pageHeaderLogoNameFontWeight,
  pageHeaderLogoSize,
  pageHeaderPositionType,
  PageHeaderUpdateModel,
  resolvePageHeaderPosition,
} from "@hacado/types";
import {
  BooleanSelect,
  Breadcrumbs,
  Button,
  cn,
  Combobox,
  Form,
  FormControl,
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
  ResponsiveTabsList,
  Tabs,
  TabsContent,
  TabsTrigger,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton, Sortable } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { MenuItemCard } from "../../menu-item/menu-item-card";
import { useCollapsedSortableItems } from "../../menu-item/use-collapsed-sortable-items";

type PageFormValues = PageHeaderUpdateModel;

const RestScrollRow: React.FC<{
  label: React.ReactNode;
  rest: React.ReactNode;
  scrolled: React.ReactNode;
  showScrolled: boolean;
  restLabel: string;
  scrolledLabel: string;
}> = ({ label, rest, scrolled, showScrolled, restLabel, scrolledLabel }) => (
  <div className="flex flex-col gap-2">
    <div className="text-sm font-medium">{label}</div>
    <div
      className={cn(
        "grid gap-3",
        showScrolled ? "md:grid-cols-2" : "grid-cols-1",
      )}
    >
      <div className="flex flex-col gap-1">
        {showScrolled && (
          <span className="text-xs text-muted-foreground">{restLabel}</span>
        )}
        {rest}
      </div>
      {showScrolled && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{scrolledLabel}</span>
          {scrolled}
        </div>
      )}
    </div>
  </div>
);

export const PageHeaderForm: React.FC<{
  initialData?: PageHeaderUpdateModel & { _id?: string };
  brandName: string;
  brandLogo?: string;
}> = ({ initialData, brandName, brandLogo }) => {
  const t = useI18n("admin");

  const positionDescriptionKey = (
    value: (typeof pageHeaderPositionType)[number],
  ) => `pages.headers.form.position.descriptions.${value}` as AdminKeys;

  const positionValues = pageHeaderPositionType.map((value) => ({
    value,
    shortLabel: t(`pages.headers.form.position.values.${value}`),
    label: (
      <div className="flex flex-col gap-0.5 py-0.5 text-sm whitespace-normal">
        <I18nRichText
          namespace="admin"
          text={positionDescriptionKey(value)}
          args={{
            b: (chunks: React.ReactNode) => (
              <span className="font-medium text-foreground">{chunks}</span>
            ),
          }}
        />
      </div>
    ),
  }));

  const cachedUniqueSlugCheck = useDebounceCacheFn(
    adminApi.pageHeaders.checkUniquePageHeaderName,
    300,
  );

  const formSchema = getPageHeaderSchemaWithUniqueNameCheck(
    (slug) => cachedUniqueSlugCheck(slug, initialData?._id),
    "pages.headers.name.unique",
  );

  const [loading, setLoading] = useState(false);
  const [previewScrolled, setPreviewScrolled] = useState(false);
  const [previewMobile, setPreviewMobile] = useState(false);
  const [customLogoTextEditorKey, setCustomLogoTextEditorKey] = useState(0);
  const [scrolledCustomLogoTextEditorKey, setScrolledCustomLogoTextEditorKey] =
    useState(0);
  const router = useRouter();

  const defaultPosition = resolvePageHeaderPosition({
    position: initialData?.position,
    sticky: initialData?.sticky,
  });

  const form = useForm<PageFormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      menu: [],
      showLogo: false,
      hideName: false,
      ...initialData,
      position: initialData?.position ?? defaultPosition,
      sticky:
        (initialData?.position ?? defaultPosition) === "sticky" ||
        Boolean(initialData?.sticky),
    },
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

      const position = resolvePageHeaderPosition(data);
      const payload: PageHeaderUpdateModel = {
        ...data,
        position,
        sticky: position === "sticky",
      };

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } = await adminApi.pageHeaders.createPageHeader(payload);
          router.push(`/dashboard/pages/headers/${_id}`);
        } else {
          await adminApi.pageHeaders.updatePageHeader(initialData._id, payload);
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

  const {
    allCollapsed: allMenuItemsCollapsed,
    toggleAll: toggleAllMenuItems,
    toggleOne: toggleMenuItem,
    isCollapsed: isMenuItemCollapsed,
  } = useCollapsedSortableItems(ids);

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

  const watchedConfig = useWatch({ control: form.control }) as PageFormValues;
  const position = resolvePageHeaderPosition({
    position: watchedConfig?.position,
    sticky: watchedConfig?.sticky,
  });
  const showScrolled = position === "sticky" || position === "fixed";

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

        <div className="flex flex-col gap-2">
          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <FormLabel>{t("pages.headers.form.preview.label")}</FormLabel>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={!previewMobile ? "secondary" : "outline"}
                  onClick={() => setPreviewMobile(false)}
                >
                  {t("pages.headers.form.preview.desktop")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMobile ? "secondary" : "outline"}
                  onClick={() => setPreviewMobile(true)}
                >
                  {t("pages.headers.form.preview.mobile")}
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={!previewScrolled ? "secondary" : "outline"}
                  onClick={() => setPreviewScrolled(false)}
                >
                  {t("pages.headers.form.preview.rest")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewScrolled ? "secondary" : "outline"}
                  disabled={!showScrolled}
                  onClick={() => setPreviewScrolled(true)}
                >
                  {t("pages.headers.form.preview.scrolled")}
                </Button>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border border-border bg-muted/40 min-h-40",
              previewMobile && "mx-auto w-full max-w-sm",
            )}
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/30 via-muted to-secondary/40"
              aria-hidden
            />
            <div className="relative min-h-40 pt-0">
              <Header
                name={brandName}
                logo={brandLogo}
                config={watchedConfig as PageHeaderUpdateModel}
                forceScrolled={showScrolled ? previewScrolled : false}
                forceMobile={previewMobile}
                preview
              />
              <div className="px-6 py-16 text-sm text-muted-foreground pointer-events-none select-none">
                &nbsp;
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="style" className="min-w-0 space-y-4">
          <ResponsiveTabsList className="w-full flex flex-row gap-2">
            <TabsTrigger value="style">
              {t("pages.headers.form.tabs.style")}
            </TabsTrigger>
            <TabsTrigger value="items">
              {t("pages.headers.form.tabs.items")}
            </TabsTrigger>
          </ResponsiveTabsList>

          <TabsContent value="style" className="flex flex-col gap-6">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.headers.form.position.label")}{" "}
                      <InfoTooltip>
                        {t("pages.headers.form.position.tooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        values={positionValues}
                        className="w-full"
                        value={field.value ?? position}
                        onItemSelect={(val) => {
                          field.onChange(val);
                          form.setValue("sticky", val === "sticky");
                          if (val === "static") {
                            setPreviewScrolled(false);
                          }
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
                name="fullWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.headers.form.fullWidth")}{" "}
                      <InfoTooltip>
                        {t("pages.headers.form.fullWidthDescription")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <BooleanSelect
                        className="w-full"
                        disabled={loading}
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
            </div>
            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.backgroundColor.label")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.backgroundColor.tooltip")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ColorExtendedInput
                          defaultValue={field.value ?? null}
                          nullable
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ColorExtendedInput
                          defaultValue={field.value ?? null}
                          nullable
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
              }
            />

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.textColor.label")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.textColor.tooltip")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="textColor"
                  render={({ field }) => (
                    <FormItem>
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.textColor"
                  render={({ field }) => (
                    <FormItem>
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
              }
            />

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.showLogo")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.showLogoDescription")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="showLogo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BooleanSelect
                          className="w-full"
                          disabled={loading}
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.showLogo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BooleanSelect
                          nullable
                          className="w-full"
                          disabled={loading}
                          value={field.value}
                          placeholder={t("pages.headers.form.inheritDefault")}
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
              }
            />

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.logoSize.label")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.logoSize.tooltip")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="logoSize"
                  render={({ field }) => (
                    <FormItem>
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.logoSize"
                  render={({ field }) => (
                    <FormItem>
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
                          value={field.value ?? undefined}
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
              }
            />

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.hideName")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.hideNameDescription")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="hideName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BooleanSelect
                          className="w-full"
                          disabled={loading}
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.hideName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BooleanSelect
                          className="w-full"
                          nullable
                          disabled={loading}
                          value={field.value}
                          placeholder={t("pages.headers.form.inheritDefault")}
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
              }
            />

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.logoNameFontSize.label")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.logoNameFontSize.tooltip")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="logoNameFontSize"
                  render={({ field }) => (
                    <FormItem>
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.logoNameFontSize"
                  render={({ field }) => (
                    <FormItem>
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
                          value={field.value ?? undefined}
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
              }
            />

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.logoNameFontWeight.label")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.logoNameFontWeight.tooltip")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="logoNameFontWeight"
                  render={({ field }) => (
                    <FormItem>
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.logoNameFontWeight"
                  render={({ field }) => (
                    <FormItem>
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
                          value={field.value ?? undefined}
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
              }
            />

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.customLogoText.label")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.customLogoText.tooltip")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="customLogoText"
                  render={({ field }) => (
                    <FormItem>
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.customLogoText"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput>
                            <EditableText
                              key={scrolledCustomLogoTextEditorKey}
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
                                setScrolledCustomLogoTextEditorKey(
                                  (key) => key + 1,
                                );
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
              }
            />

            {showScrolled && (
              <RestScrollRow
                showScrolled
                restLabel={t("pages.headers.form.defaultColumn")}
                scrolledLabel={t("pages.headers.form.onScrollColumn")}
                label={
                  <>
                    {t("pages.headers.form.backdropBlur")}{" "}
                    <InfoTooltip>
                      {t("pages.headers.form.backdropBlurDescription")}
                    </InfoTooltip>
                  </>
                }
                rest={
                  <FormField
                    control={form.control}
                    name="backdropBlur"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <BooleanSelect
                            className="w-full"
                            disabled={loading}
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
                }
                scrolled={
                  <FormField
                    control={form.control}
                    name="scrolled.backdropBlur"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <BooleanSelect
                            className="w-full"
                            disabled={loading}
                            nullable
                            value={field.value}
                            placeholder={t("pages.headers.form.inheritDefault")}
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
                }
              />
            )}

            <RestScrollRow
              showScrolled={showScrolled}
              restLabel={t("pages.headers.form.defaultColumn")}
              scrolledLabel={t("pages.headers.form.onScrollColumn")}
              label={
                <>
                  {t("pages.headers.form.headerShadow")}{" "}
                  <InfoTooltip>
                    {t("pages.headers.form.headerShadowDescription")}
                  </InfoTooltip>
                </>
              }
              rest={
                <FormField
                  control={form.control}
                  name="shadow"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BooleanSelect
                          className="w-full"
                          disabled={loading}
                          value={field.value ?? undefined}
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
              }
              scrolled={
                <FormField
                  control={form.control}
                  name="scrolled.shadow"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BooleanSelect
                          className="w-full"
                          nullable
                          nullableText={t("pages.headers.form.inheritDefault")}
                          disabled={loading}
                          value={field.value ?? undefined}
                          placeholder={t("pages.headers.form.inheritDefault")}
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
              }
            />
          </TabsContent>

          <TabsContent value="items">
            <Sortable
              title={t("pages.headers.form.menu")}
              ids={ids}
              onSort={sort}
              onAdd={addNew}
              allCollapsed={allMenuItemsCollapsed}
              collapse={toggleAllMenuItems}
            >
              <div className="flex flex-grow flex-col gap-4">
                {fields.map((item, index) => {
                  return (
                    <MenuItemCard
                      supportsSubmenus
                      enableScrolledOverrides={showScrolled}
                      enableMobileOverrides
                      form={form}
                      item={item}
                      key={item.id}
                      name={`menu.${index}`}
                      disabled={loading}
                      collapsed={isMenuItemCollapsed(item.id)}
                      onCollapsedChange={() => toggleMenuItem(item.id)}
                      remove={() => remove(index)}
                      update={(newValue) => update(index, newValue)}
                    />
                  );
                })}
              </div>
            </Sortable>
          </TabsContent>
        </Tabs>

        <SaveButton form={form} disabled={loading} ignoreDirty />
      </form>
    </Form>
  );
};
