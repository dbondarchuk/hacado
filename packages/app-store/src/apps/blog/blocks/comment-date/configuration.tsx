"use client";

import { ConfigurationProps, SelectInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback, useMemo } from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import {
  dateFormatOptions,
  getFormatPreview,
} from "../post-publish-date/formats";
import { blogTextShortcuts } from "../text-shortcuts";
import {
  BlogCommentDateProps,
  BlogCommentDatePropsDefaults,
  styles,
} from "./schema";

export const BlogCommentDateConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogCommentDateProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogCommentDateProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogCommentDateProps["props"] }),
      [setData, data],
    );

    const format =
      data.props?.format ?? BlogCommentDatePropsDefaults.props.format;

    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

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
