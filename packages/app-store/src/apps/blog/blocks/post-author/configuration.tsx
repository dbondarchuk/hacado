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
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { blogTextShortcuts } from "../text-shortcuts";
import {
  AUTHOR_FORMAT_KEYS,
  AuthorFormatKey,
  getFormatPreview,
} from "./formats";
import {
  BlogPostAuthorProps,
  BlogPostAuthorPropsDefaults,
  styles,
} from "./schema";

export const BlogPostAuthorConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostAuthorProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostAuthorProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostAuthorProps["props"] }),
      [setData, data],
    );

    const format =
      data.props?.format ?? BlogPostAuthorPropsDefaults.props.format;

    const tAdmin = useI18n<BlogAdminNamespace, BlogAdminKeys>(
      blogAdminNamespace,
    );
    const tPublic = useI18n<BlogPublicNamespace, BlogPublicKeys>(
      blogPublicNamespace,
    );

    const formatOptions = useMemo(() => {
      return AUTHOR_FORMAT_KEYS.map((key: AuthorFormatKey) => ({
        value: key,
        label: getFormatPreview(key, tPublic),
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
            "block.postAuthor.format.label" satisfies BlogAdminKeys,
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
