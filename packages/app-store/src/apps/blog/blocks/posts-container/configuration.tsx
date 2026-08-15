"use client";

import { AppSelectorInput, ConfigurationProps } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  RawNumberInput,
  StylesConfigurationPanel,
} from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { BLOG_APP_NAME } from "../../const";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { containerShortcuts } from "../shortcuts";
import { BlogPostsContainerProps, styles } from "./schema";

export const BlogPostsContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
  }: ConfigurationProps<BlogPostsContainerProps>) => {
    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostsContainerProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostsContainerProps["props"] }),
      [setData, data],
    );

    const updateMetadata = useCallback(
      (m: Record<string, any>) => onMetadataChange(m),
      [onMetadataChange],
    );

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
          onChange={(value) =>
            updateMetadata({ ...metadata, blogAppId: value })
          }
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("block.postsContainer.postsPerPage.label")}
          </label>
          <RawNumberInput
            iconLabel={<></>}
            value={data.props?.postsPerPage ?? 10}
            setValue={(value: number | null) =>
              updateProps({ ...data.props, postsPerPage: value ?? 10 })
            }
            step={1}
            min={3}
            max={20}
            options={[3, 5, 10, 20]}
            nullable
          />
        </div>
      </StylesConfigurationPanel>
    );
  },
);
