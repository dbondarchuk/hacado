"use client";

import { useI18n } from "@hacado/i18n/client";
import { useMemo } from "react";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { BlogPostAuthorComponent } from "./component";
import { getFormatPreview } from "./formats";
import { BlogPostAuthorProps, BlogPostAuthorPropsDefaults } from "./schema";

type BlogPostAuthorEditorWrapperProps = {
  props: BlogPostAuthorProps["props"];
  style: BlogPostAuthorProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: { post?: unknown };
  overlayProps?: Record<string, unknown>;
};

export const BlogPostAuthorEditorWrapper = ({
  props,
  style,
  blockBase,
  args,
  overlayProps,
}: BlogPostAuthorEditorWrapperProps) => {
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);
  const format = props?.format ?? BlogPostAuthorPropsDefaults.props.format;

  const label = useMemo(() => {
    if (!args?.post) {
      return t("notInBlogContext");
    }

    return getFormatPreview(format, t);
  }, [args?.post, format, t]);

  return (
    <BlogPostAuthorComponent
      label={label}
      style={style}
      blockBase={blockBase}
      isEditor={Boolean(overlayProps)}
      overlayProps={overlayProps}
    />
  );
};
