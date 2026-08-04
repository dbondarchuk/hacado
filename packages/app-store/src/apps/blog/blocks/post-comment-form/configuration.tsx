"use client";

import { ConfigurationProps, TextInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { BlogPostCommentFormProps, styles } from "./schema";

export const BlogPostCommentFormConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostCommentFormProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostCommentFormProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostCommentFormProps["props"] }),
      [setData, data],
    );

    const props = data.props ?? {};
    const tAdmin = useI18n<BlogAdminNamespace, BlogAdminKeys>(
      blogAdminNamespace,
    );

    const fields = [
      { key: "nameLabel", label: "block.postCommentForm.nameLabel" },
      {
        key: "namePlaceholder",
        label: "block.postCommentForm.namePlaceholder",
      },
      { key: "emailLabel", label: "block.postCommentForm.emailLabel" },
      {
        key: "emailPlaceholder",
        label: "block.postCommentForm.emailPlaceholder",
      },
      { key: "bodyLabel", label: "block.postCommentForm.bodyLabel" },
      {
        key: "bodyPlaceholder",
        label: "block.postCommentForm.bodyPlaceholder",
      },
      { key: "submitLabel", label: "block.postCommentForm.submitLabel" },
      { key: "successMessage", label: "block.postCommentForm.successMessage" },
    ] as const;

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      >
        {fields.map(({ key, label }) => (
          <TextInput
            key={key}
            label={tAdmin(label satisfies BlogAdminKeys)}
            defaultValue={
              (props as Record<string, string | null | undefined>)[key] ?? ""
            }
            onChange={(value) =>
              updateProps({ ...props, [key]: value || null })
            }
          />
        ))}
      </StylesConfigurationPanel>
    );
  },
);
