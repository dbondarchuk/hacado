"use client";

import { ConfigurationProps, PageInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { blogTextShortcuts } from "../text-shortcuts";
import { BlogPostTagProps, BlogPostTagPropsDefaults, styles } from "./schema";

export const BlogPostTagConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostTagProps>) => {
    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostTagProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostTagProps["props"] }),
      [setData, data],
    );

    const blogListUrl =
      data.props?.blogListUrl ?? BlogPostTagPropsDefaults.props.blogListUrl;

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={blogTextShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <PageInput
          label={t("block.postTag.blogListUrl.label" satisfies BlogAdminKeys)}
          helperText={t(
            "block.postTag.blogListUrl.description" satisfies BlogAdminKeys,
          )}
          defaultValue={blogListUrl || ""}
          onChange={(newUrl) =>
            updateProps({ ...data.props, blogListUrl: newUrl || undefined })
          }
        />
      </StylesConfigurationPanel>
    );
  },
);
