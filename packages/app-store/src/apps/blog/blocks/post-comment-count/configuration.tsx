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
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { blogTextShortcuts } from "../text-shortcuts";
import {
  COMMENT_COUNT_FORMAT_KEYS,
  CommentCountFormatKey,
  getCommentCountFormatPreview,
} from "./formats";
import {
  BlogPostCommentCountProps,
  BlogPostCommentCountPropsDefaults,
  styles,
} from "./schema";

export const BlogPostCommentCountConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostCommentCountProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostCommentCountProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostCommentCountProps["props"] }),
      [setData, data],
    );

    const format =
      data.props?.format ?? BlogPostCommentCountPropsDefaults.props.format;

    const tAdmin = useI18n<BlogAdminNamespace, BlogAdminKeys>(
      blogAdminNamespace,
    );
    const tPublic = useI18n<BlogPublicNamespace, BlogPublicKeys>(
      blogPublicNamespace,
    );

    const formatOptions = useMemo(() => {
      return COMMENT_COUNT_FORMAT_KEYS.map((key: CommentCountFormatKey) => ({
        value: key,
        label: getCommentCountFormatPreview(key, tPublic),
      }));
    }, [tPublic]);

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
          label={tAdmin(
            "block.postCommentCount.format.label" satisfies BlogAdminKeys,
          )}
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
