"use client";

import { ConfigurationProps, SelectInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback, useMemo } from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { blogTextShortcuts } from "../text-shortcuts";
import { dateFormatOptions, getFormatPreview } from "./formats";
import {
  BlogPostPublishDateProps,
  BlogPostPublishDatePropsDefaults,
  styles,
} from "./schema";

export const BlogPostPublishDateConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostPublishDateProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostPublishDateProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostPublishDateProps["props"] }),
      [setData, data],
    );

    const format =
      data.props?.format ?? BlogPostPublishDatePropsDefaults.props.format;

    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

    // Update format options with i18n labels and preview
    const formatOptions = useMemo(() => {
      return dateFormatOptions.map((option) => {
        const preview = getFormatPreview(option.value);
        const label = t(option.i18nKey);
        return {
          value: option.value,
          label: (
            <div className="flex items-center gap-2">
              <span>{label}</span>
              <span className="text-xs text-muted-foreground">({preview})</span>
            </div>
          ),
        };
      });
    }, [t]);

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={blogTextShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <SelectInput
          label={t("block.postPublishDate.dateFormat.label")}
          defaultValue={format}
          onChange={(newFormat) =>
            updateProps({ ...data.props, format: newFormat })
          }
          options={formatOptions}
        />
      </StylesConfigurationPanel>
    );
  },
);
