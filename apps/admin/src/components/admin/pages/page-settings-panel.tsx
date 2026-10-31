import { LanguageOptions } from "@/constants/texts";
import { BaseSidebarPanel } from "@hacado/builder/inputs";
import { languages, useI18n } from "@hacado/i18n/client";
import {
  PageFooterListModel,
  PageHeaderListModel,
  pageTagSchema,
} from "@hacado/types/pages";
import { zNonEmptyString } from "@hacado/types/utils";
import { AssetPreview } from "@hacado/ui-admin/asset-preview";
import { AssetSelectorInput } from "@hacado/ui-admin/asset-selector-input";
import { Checkbox } from "@hacado/ui/checkbox";
import { Combobox } from "@hacado/ui/combobox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { use12HourFormat } from "@hacado/ui/hooks";
import { TagInput } from "@hacado/ui/tag-input";
import { Textarea } from "@hacado/ui/textarea";
import { DateTimePicker } from "@hacado/ui/time-picker";
import { fileNameToMimeType } from "@hacado/utils/assets";
import { memo, useCallback } from "react";
import { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FooterSelector } from "./footer-selector";
import { HeaderSelector } from "./header-selector";

const HeaderFormField = ({
  field,
}: {
  field: ControllerRenderProps<FieldValues, "headerId">;
}) => {
  const t = useI18n("admin");
  const onHeaderChange = useCallback(
    (header?: PageHeaderListModel) => {
      field.onChange(header?._id);
      field.onBlur();
    },
    [field],
  );
  return (
    <FormItem>
      <FormLabel>{t("pages.form.header")}</FormLabel>
      <FormControl>
        <HeaderSelector
          value={field.value}
          onItemSelect={field.onChange}
          allowClear
          onValueChange={onHeaderChange}
        />
      </FormControl>
    </FormItem>
  );
};

const FooterFormField = ({
  field,
}: {
  field: ControllerRenderProps<FieldValues, "footerId">;
}) => {
  const t = useI18n("admin");
  const onFooterChange = useCallback(
    (footer?: PageFooterListModel) => {
      field.onChange(footer?._id);
      field.onBlur();
    },
    [field],
  );
  return (
    <FormItem>
      <FormLabel>{t("pages.form.footer")}</FormLabel>
      <FormControl>
        <FooterSelector
          value={field.value}
          onItemSelect={field.onChange}
          allowClear
          onValueChange={onFooterChange}
        />
      </FormControl>
    </FormItem>
  );
};

export const PageSettingsPanel = memo(
  ({ form, loading }: { form: any; loading: boolean }) => {
    const t = useI18n("admin");
    const uses12HourFormat = use12HourFormat();
    const getTags = useCallback((value: string) => {
      let tags = value?.split(/,\s?/g) || [];
      if (tags.length === 1 && !tags[0]) tags = [];
      return tags;
    }, []);

    return (
      <BaseSidebarPanel title={t("pages.form.settingsTabLabel")}>
        <FormField
          control={form.control}
          name="headerId"
          render={({ field }) => <HeaderFormField field={field} />}
        />

        <FormField
          control={form.control}
          name="footerId"
          render={({ field }) => <FooterFormField field={field} />}
        />
        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="py-2">
              <div className="flex flex-row items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="grid gap-1">
                  <FormLabel>{t("pages.form.published")}</FormLabel>
                  <FormDescription>
                    {t("pages.form.publishedTooltip")}
                  </FormDescription>
                </div>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="publishDate"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithRequiredIndicator required>
                {t("pages.form.publishDate")}
              </FormLabelWithRequiredIndicator>
              <FormControl>
                <DateTimePicker
                  use12HourFormat={uses12HourFormat}
                  onChange={(e) => {
                    field.onChange(e);
                    field.onBlur();
                  }}
                  value={field.value}
                  className="w-full"
                  classNames={{
                    trigger: "h-8 text-sm",
                  }}
                />
              </FormControl>
              <FormDescription>
                {t("pages.form.publishDateTooltip")}
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>{t("pages.form.language")}</FormLabel>
              <FormControl>
                <Combobox
                  values={[
                    {
                      label: t("pages.form.defaultLanguage"),
                      value: "default",
                    },
                    ...languages.map((language) => ({
                      label: LanguageOptions[language],
                      value: language,
                    })),
                  ]}
                  className="w-full"
                  value={field.value || "default"}
                  onItemSelect={(val) => {
                    field.onChange(val === "default" ? null : val);
                    field.onBlur();
                  }}
                  disabled={loading}
                  size="sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pages.form.tags")}</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    field.onBlur();
                  }}
                  h="sm"
                  tagValidator={pageTagSchema}
                />
              </FormControl>
              <FormDescription>{t("pages.form.tagsTooltip")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithRequiredIndicator required>
                {t("pages.form.keywords")}
              </FormLabelWithRequiredIndicator>
              <FormControl>
                <TagInput
                  {...field}
                  value={getTags(field.value || "")}
                  onChange={(value) =>
                    form.setValue("keywords", value.join(", "))
                  }
                  h="sm"
                  tagValidator={zNonEmptyString(
                    t("pages.form.keywordValidation"),
                    2,
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("pages.form.keywordsTooltip")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithRequiredIndicator required>
                {t("pages.form.description")}
              </FormLabelWithRequiredIndicator>
              <FormControl>
                <Textarea
                  disabled={loading}
                  autoResize
                  placeholder={t("pages.form.descriptionPlaceholder")}
                  {...field}
                  className="px-2 py-1"
                />
              </FormControl>
              <FormDescription>
                {t("pages.form.descriptionTooltip")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featuredImage"
          render={({ field }) => {
            const mimeType = field.value
              ? fileNameToMimeType(field.value)
              : undefined;

            return (
              <FormItem>
                <FormLabel>{t("pages.form.featuredImage")}</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-3">
                    <AssetSelectorInput
                      value={field.value ?? ""}
                      onChange={(value) => {
                        field.onChange(value || undefined);
                        field.onBlur();
                      }}
                      disabled={loading}
                      accept="image/*"
                      placeholder={t("pages.form.featuredImagePlaceholder")}
                    />
                    {field.value && mimeType?.startsWith("image/") && (
                      <AssetPreview
                        size="md"
                        src={field.value}
                        mimeType={mimeType}
                      />
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {t("pages.form.featuredImageTooltip")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="doNotCombine.title"
          render={({ field }) => (
            <FormItem className="py-2">
              <div className="flex flex-row items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="grid gap-1">
                  <FormLabel>{t("pages.form.doNotCombineTitle")}</FormLabel>
                  <FormDescription className="flex flex-col gap-2">
                    {t("pages.form.doNotCombineTitleTooltip")}
                    <code className="text-sm inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-2">
                      {"{page title} | {website title}"}
                    </code>
                  </FormDescription>
                </div>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doNotCombine.description"
          render={({ field }) => (
            <FormItem className="py-2">
              <div className="flex flex-row items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="grid gap-1">
                  <FormLabel>
                    {t("pages.form.doNotCombineDescription")}
                  </FormLabel>
                  <FormDescription className="flex flex-col gap-2">
                    {t("pages.form.doNotCombineDescriptionTooltip")}
                    <code className="text-sm inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-2">
                      {"{website description}"}
                      <br />
                      {"{page description}"}
                    </code>
                  </FormDescription>
                </div>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doNotCombine.keywords"
          render={({ field }) => (
            <FormItem className="py-2">
              <div className="flex flex-row items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="grid gap-1">
                  <FormLabel>{t("pages.form.doNotCombineKeywords")}</FormLabel>
                  <FormDescription className="flex flex-col gap-2">
                    {t("pages.form.doNotCombineKeywordsTooltip")}
                    <code className="text-sm inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-2">
                      {"{website keywords}, {page keywords}"}
                    </code>
                  </FormDescription>
                </div>
              </div>
            </FormItem>
          )}
        />
      </BaseSidebarPanel>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.form.watch() === nextProps.form.watch();
  },
);

PageSettingsPanel.displayName = "PageSettingsPanel";
