"use client";

import { pageHeadersApi } from "@hacado/api-sdk/admin/page-headers";
import { AdminKeys, useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { Header } from "@hacado/page-builder-base/reader";
import { ColorExtendedInput } from "@hacado/page-builder-base/style-inputs";
import { EditableText, richTextToString } from "@hacado/rte-inline";
import { LinkMenuItem } from "@hacado/types/configuration/styling";
import {
  getPageHeaderSchemaWithUniqueNameCheck,
  pageHeaderLogoNameFontSize,
  pageHeaderLogoNameFontWeight,
  pageHeaderLogoSize,
  pageHeaderPositionType,
  PageHeaderUpdateModel,
  resolvePageHeaderPosition,
} from "@hacado/types/pages";
import { AssetSelectorInput } from "@hacado/ui-admin/asset-selector-input";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { Sortable } from "@hacado/ui-admin/sortable";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { BooleanSelect } from "@hacado/ui/boolean-select";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { Combobox } from "@hacado/ui/combobox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { Heading } from "@hacado/ui/heading";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { Input } from "@hacado/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui/input-group";
import {
  RadioButtonGroup,
  RadioButtonGroupItem,
} from "@hacado/ui/radio-button-group";
import { toastPromise } from "@hacado/ui/sonner";
import {
  ResponsiveTabsList,
  Tabs,
  TabsContent,
  TabsTrigger,
} from "@hacado/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form";
import { MenuItemCard } from "../../menu-item/menu-item-card";
import { useCollapsedSortableItems } from "../../menu-item/use-collapsed-sortable-items";

type PageFormValues = PageHeaderUpdateModel;

const RestScrollRow: React.FC<{
  label: React.ReactNode;
  description?: React.ReactNode;
  rest: React.ReactNode;
  scrolled: React.ReactNode;
  mobile?: React.ReactNode;
  mobileScrolled?: React.ReactNode;
  showScrolled: boolean;
  restLabel: string;
  scrolledLabel: string;
  mobileLabel?: string;
  mobileScrolledLabel?: string;
}> = ({
  label,
  description,
  rest,
  scrolled,
  mobile,
  mobileScrolled,
  showScrolled,
  restLabel,
  scrolledLabel,
  mobileLabel,
  mobileScrolledLabel,
}) => (
  <div className="flex flex-col gap-2 border rounded-lg p-4">
    <div className="text-sm font-medium">{label}</div>
    {description ? (
      <p className="text-sm text-muted-foreground">{description}</p>
    ) : null}
    <div
      className={cn(
        "grid gap-3",
        showScrolled ? "md:grid-cols-2" : "grid-cols-1",
      )}
    >
      <div className="flex flex-col gap-1">
        {(showScrolled || mobile) && (
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
      {mobile && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{mobileLabel}</span>
          {mobile}
        </div>
      )}
      {showScrolled && mobileScrolled && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {mobileScrolledLabel}
          </span>
          {mobileScrolled}
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
    pageHeadersApi.checkUniquePageHeaderName,
    300,
  );

  const formSchema = getPageHeaderSchemaWithUniqueNameCheck(
    (slug) => cachedUniqueSlugCheck(slug, initialData?._id),
    "pages.headers.name.unique",
  );

  const [loading, setLoading] = useState(false);
  const [previewScrolled, setPreviewScrolled] = useState(false);
  const [previewMobile, setPreviewMobile] = useState(false);
  const [logoTextEditorKeys, setLogoTextEditorKeys] = useState<
    Record<string, number>
  >({});
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
          const { _id } = await pageHeadersApi.createPageHeader(payload);
          router.push(`/dashboard/pages/headers/${_id}`);
        } else {
          await pageHeadersApi.updatePageHeader(initialData._id, payload);
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

  type StyleName = FieldPath<PageFormValues>;

  const colorField = <TName extends StyleName>(
    name: TName,
    allowTransparent = true,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <ColorExtendedInput
              defaultValue={(field.value as string | null) ?? null}
              nullable
              allowTransparent={allowTransparent}
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
  );

  const booleanField = <TName extends StyleName>(
    name: TName,
    nullable = false,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            {nullable ? (
              <BooleanSelect
                className="w-full"
                disabled={loading}
                nullable
                nullableText={t("pages.headers.form.inheritDefault")}
                value={(field.value as boolean | null | undefined) ?? undefined}
                placeholder={t("pages.headers.form.inheritDefault")}
                onValueChange={(value) => {
                  field.onChange(value);
                  field.onBlur();
                }}
              />
            ) : (
              <BooleanSelect
                className="w-full"
                disabled={loading}
                value={(field.value as boolean | null | undefined) ?? undefined}
                onValueChange={(value) => {
                  field.onChange(value);
                  field.onBlur();
                }}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const logoField = (name: StyleName, inherit = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <AssetSelectorInput
              value={field.value as string | null | undefined}
              disabled={loading}
              placeholder={t(
                inherit
                  ? "pages.headers.form.inheritDefault"
                  : "pages.headers.form.logo.placeholder",
              )}
              accept="image/*"
              onChange={(value) => {
                field.onChange(value);
                field.onBlur();
              }}
              onBlur={field.onBlur}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const enumField = (
    name: StyleName,
    options: { label: string; value: string }[],
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Combobox
              allowClear
              values={options}
              className="w-full"
              value={(field.value as string | null | undefined) ?? undefined}
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
  );

  const logoTextField = (name: StyleName) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <InputGroup>
              <InputGroupInput>
                <EditableText
                  key={logoTextEditorKeys[name] ?? 0}
                  value={
                    (Array.isArray(field.value) ||
                    typeof field.value === "string"
                      ? field.value
                      : "") as React.ComponentProps<
                      typeof EditableText
                    >["value"]
                  }
                  onChange={(value) => {
                    field.onChange(
                      richTextToString(value).trim() ? value : undefined,
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
                  className={cn(InputGroupAddonClasses({ variant: "suffix" }))}
                  onClick={() => {
                    field.onChange(undefined);
                    setLogoTextEditorKeys((keys) => ({
                      ...keys,
                      [name]: (keys[name] ?? 0) + 1,
                    }));
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
  );

  const rowLabels = {
    showScrolled,
    restLabel: t("pages.headers.form.defaultColumn"),
    scrolledLabel: t("pages.headers.form.onScrollColumn"),
    mobileLabel: t("pages.headers.form.mobileColumn"),
    mobileScrolledLabel: t("pages.headers.form.mobileOnScrollColumn"),
  };

  const logoSizeOptions = pageHeaderLogoSize.map((size) => ({
    label: t(`pages.headers.form.logoSize.values.${size}`),
    value: size,
  }));
  const logoNameFontSizeOptions = pageHeaderLogoNameFontSize.map((size) => ({
    label: t(`pages.headers.form.logoNameFontSize.values.${size}`),
    value: size,
  }));
  const logoNameFontWeightOptions = pageHeaderLogoNameFontWeight.map(
    (size) => ({
      label: t(`pages.headers.form.logoNameFontWeight.values.${size}`),
      value: size,
    }),
  );

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
              <FormLabelWithRequiredIndicator required>
                {t("pages.headers.form.name")}
              </FormLabelWithRequiredIndicator>
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
              <RadioButtonGroup
                joined
                value={previewMobile ? "mobile" : "desktop"}
                onValueChange={(value) => setPreviewMobile(value === "mobile")}
              >
                <RadioButtonGroupItem value="desktop" size="sm">
                  {t("pages.headers.form.preview.desktop")}
                </RadioButtonGroupItem>
                <RadioButtonGroupItem value="mobile" size="sm">
                  {t("pages.headers.form.preview.mobile")}
                </RadioButtonGroupItem>
              </RadioButtonGroup>
              <RadioButtonGroup
                joined
                value={previewScrolled ? "scrolled" : "rest"}
                onValueChange={(value) =>
                  setPreviewScrolled(value === "scrolled")
                }
              >
                <RadioButtonGroupItem value="rest" size="sm">
                  {t("pages.headers.form.preview.rest")}
                </RadioButtonGroupItem>
                <RadioButtonGroupItem
                  value="scrolled"
                  size="sm"
                  disabled={!showScrolled}
                >
                  {t("pages.headers.form.preview.scrolled")}
                </RadioButtonGroupItem>
              </RadioButtonGroup>
            </div>
          </div>
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border border-border bg-muted/40 min-h-40",
              previewMobile ? "mx-auto w-full max-w-sm" : "overflow-auto",
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
                className={cn(!previewMobile && "max-md:min-w-[1200px]")}
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
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 border rounded-lg p-4">
                  <FormLabel>
                    {t("pages.headers.form.position.label")}
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
                  <FormDescription>
                    {t("pages.headers.form.position.tooltip")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullWidth"
              render={({ field }) => (
                <SwitchCardFormItem
                  label={t("pages.headers.form.fullWidth")}
                  description={t("pages.headers.form.fullWidthDescription")}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={loading}
                />
              )}
            />
            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.backgroundColor.label")}
              description={t("pages.headers.form.backgroundColor.tooltip")}
              rest={colorField("backgroundColor")}
              scrolled={colorField("scrolled.backgroundColor")}
              mobile={colorField("mobile.backgroundColor")}
              mobileScrolled={colorField("mobile.scrolled.backgroundColor")}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.textColor.label")}
              description={t("pages.headers.form.textColor.tooltip")}
              rest={colorField("textColor", false)}
              scrolled={colorField("scrolled.textColor", false)}
              mobile={colorField("mobile.textColor", false)}
              mobileScrolled={colorField("mobile.scrolled.textColor", false)}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.showLogo")}
              description={t("pages.headers.form.showLogoDescription")}
              rest={booleanField("showLogo")}
              scrolled={booleanField("scrolled.showLogo", true)}
              mobile={booleanField("mobile.showLogo", true)}
              mobileScrolled={booleanField("mobile.scrolled.showLogo", true)}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.logo.label")}
              description={t("pages.headers.form.logo.tooltip")}
              rest={logoField("logo")}
              scrolled={logoField("scrolled.logo", true)}
              mobile={logoField("mobile.logo", true)}
              mobileScrolled={logoField("mobile.scrolled.logo", true)}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.logoSize.label")}
              description={t("pages.headers.form.logoSize.tooltip")}
              rest={enumField("logoSize", logoSizeOptions)}
              scrolled={enumField("scrolled.logoSize", logoSizeOptions)}
              mobile={enumField("mobile.logoSize", logoSizeOptions)}
              mobileScrolled={enumField(
                "mobile.scrolled.logoSize",
                logoSizeOptions,
              )}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.hideName")}
              description={t("pages.headers.form.hideNameDescription")}
              rest={booleanField("hideName")}
              scrolled={booleanField("scrolled.hideName", true)}
              mobile={booleanField("mobile.hideName", true)}
              mobileScrolled={booleanField("mobile.scrolled.hideName", true)}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.logoNameFontSize.label")}
              description={t("pages.headers.form.logoNameFontSize.tooltip")}
              rest={enumField("logoNameFontSize", logoNameFontSizeOptions)}
              scrolled={enumField(
                "scrolled.logoNameFontSize",
                logoNameFontSizeOptions,
              )}
              mobile={enumField(
                "mobile.logoNameFontSize",
                logoNameFontSizeOptions,
              )}
              mobileScrolled={enumField(
                "mobile.scrolled.logoNameFontSize",
                logoNameFontSizeOptions,
              )}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.logoNameFontWeight.label")}
              description={t("pages.headers.form.logoNameFontWeight.tooltip")}
              rest={enumField("logoNameFontWeight", logoNameFontWeightOptions)}
              scrolled={enumField(
                "scrolled.logoNameFontWeight",
                logoNameFontWeightOptions,
              )}
              mobile={enumField(
                "mobile.logoNameFontWeight",
                logoNameFontWeightOptions,
              )}
              mobileScrolled={enumField(
                "mobile.scrolled.logoNameFontWeight",
                logoNameFontWeightOptions,
              )}
            />

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.customLogoText.label")}
              description={t("pages.headers.form.customLogoText.tooltip")}
              rest={logoTextField("customLogoText")}
              scrolled={logoTextField("scrolled.customLogoText")}
              mobile={logoTextField("mobile.customLogoText")}
              mobileScrolled={logoTextField("mobile.scrolled.customLogoText")}
            />

            {showScrolled && (
              <RestScrollRow
                {...rowLabels}
                label={t("pages.headers.form.backdropBlur")}
                description={t("pages.headers.form.backdropBlurDescription")}
                rest={booleanField("backdropBlur")}
                scrolled={booleanField("scrolled.backdropBlur", true)}
                mobile={booleanField("mobile.backdropBlur", true)}
                mobileScrolled={booleanField(
                  "mobile.scrolled.backdropBlur",
                  true,
                )}
              />
            )}

            <RestScrollRow
              {...rowLabels}
              label={t("pages.headers.form.headerShadow")}
              description={t("pages.headers.form.headerShadowDescription")}
              rest={booleanField("shadow")}
              scrolled={booleanField("scrolled.shadow", true)}
              mobile={booleanField("mobile.shadow", true)}
              mobileScrolled={booleanField("mobile.scrolled.shadow", true)}
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

        <SaveButton form={form} disabled={loading} />
      </form>
    </Form>
  );
};
