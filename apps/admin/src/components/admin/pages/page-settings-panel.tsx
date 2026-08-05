import { LanguageOptions } from "@/constants/texts";
import { BaseSidebarPanel } from "@hacado/builder";
import { languages, useI18n } from "@hacado/i18n/client";
import {
  PageFooterListModel,
  PageHeaderListModel,
  pageTagSchema,
  zNonEmptyString,
} from "@hacado/types";
import {
  Checkbox,
  Combobox,
  DateTimePicker,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  TagInput,
  Textarea,
  use12HourFormat,
} from "@hacado/ui";
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
            <FormItem className="flex flex-row items-center gap-2 space-y-0 py-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>
                {t("pages.form.published")}{" "}
                <InfoTooltip>{t("pages.form.publishedTooltip")}</InfoTooltip>
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="publishDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("pages.form.publishDate")}
                <InfoTooltip>{t("pages.form.publishDateTooltip")}</InfoTooltip>
              </FormLabel>
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
              <FormLabel>
                {t("pages.form.tags")}{" "}
                <InfoTooltip>{t("pages.form.tagsTooltip")}</InfoTooltip>
              </FormLabel>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("pages.form.keywords")}{" "}
                <InfoTooltip>{t("pages.form.keywordsTooltip")}</InfoTooltip>
              </FormLabel>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("pages.form.description")}{" "}
                <InfoTooltip>{t("pages.form.descriptionTooltip")}</InfoTooltip>
              </FormLabel>
              <FormControl>
                <Textarea
                  disabled={loading}
                  autoResize
                  placeholder={t("pages.form.descriptionPlaceholder")}
                  {...field}
                  className="text-sm px-2 py-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doNotCombine.title"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0 py-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>
                {t("pages.form.doNotCombineTitle")}{" "}
                <InfoTooltip>
                  <p>{t("pages.form.doNotCombineTitleTooltip")}</p>
                  <p>
                    <code className="text-sm sm:text-base inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-2">
                      {"{page title} | {website title}"}
                    </code>
                  </p>
                </InfoTooltip>
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doNotCombine.description"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0 py-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>
                {t("pages.form.doNotCombineDescription")}{" "}
                <InfoTooltip>
                  <p>{t("pages.form.doNotCombineDescriptionTooltip")}</p>
                  <p>
                    <code className="text-sm sm:text-base inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-2">
                      {"{website description}"}
                      <br />
                      {"{page description}"}
                    </code>
                  </p>
                </InfoTooltip>
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doNotCombine.keywords"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0 py-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>
                {t("pages.form.doNotCombineKeywords")}{" "}
                <InfoTooltip>
                  <p>{t("pages.form.doNotCombineKeywordsTooltip")}</p>
                  <p>
                    <code className="text-sm sm:text-base inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-2">
                      {"{website keywords}, {page keywords}"}
                    </code>
                  </p>
                </InfoTooltip>
              </FormLabel>
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
