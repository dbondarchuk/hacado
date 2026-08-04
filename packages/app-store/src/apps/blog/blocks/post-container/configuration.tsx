"use client";

import {
  AppSelectorInput,
  ConfigurationProps,
  PageInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import { BLOG_APP_NAME } from "../../const";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { containerShortcuts } from "../shortcuts";
import {
  BlogPostContainerProps,
  BlogPostContainerPropsDefaults,
  styles,
} from "./schema";

export const BlogPostContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
  }: ConfigurationProps<BlogPostContainerProps>) => {
    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostContainerProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostContainerProps["props"] }),
      [setData, data],
    );

    const updateMetadata = useCallback(
      (m: Record<string, any>) => onMetadataChange(m),
      [onMetadataChange],
    );

    const postUrl =
      data.props?.postUrl ?? BlogPostContainerPropsDefaults.props.postUrl;

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={containerShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <AppSelectorInput
          label={t("block.blogAppId.label")}
          helperText={t("block.blogAppId.helperText")}
          defaultValue={metadata?.blogAppId ?? ""}
          appName={BLOG_APP_NAME}
          nullable
          onChange={(value) =>
            updateMetadata({ ...metadata, blogAppId: value })
          }
        />
        <PageInput
          label={t("block.postContainer.postUrl.label" satisfies BlogAdminKeys)}
          defaultValue={postUrl}
          onChange={(url) =>
            updateProps({ ...data.props, postUrl: url ?? postUrl })
          }
          helperText={t(
            "block.postContainer.postUrl.helperText" satisfies BlogAdminKeys,
          )}
        />
      </StylesConfigurationPanel>
    );
  },
);
