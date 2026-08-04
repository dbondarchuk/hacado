"use client";

import { useI18n } from "@timelish/i18n/client";
import { useMemo } from "react";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { BlogPostCommentCountComponent } from "./component";
import { getCommentCountFormatPreview } from "./formats";
import {
  BlogPostCommentCountProps,
  BlogPostCommentCountPropsDefaults,
} from "./schema";

type BlogPostCommentCountEditorWrapperProps = {
  props: BlogPostCommentCountProps["props"];
  style: BlogPostCommentCountProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: { post?: unknown };
  overlayProps?: Record<string, unknown>;
};

export const BlogPostCommentCountEditorWrapper = ({
  props,
  style,
  blockBase,
  args,
  overlayProps,
}: BlogPostCommentCountEditorWrapperProps) => {
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);
  const format =
    props?.format ?? BlogPostCommentCountPropsDefaults.props.format;

  const label = useMemo(() => {
    if (!args?.post) {
      return t("notInBlogContext");
    }
    return getCommentCountFormatPreview(format, t);
  }, [args?.post, format, t]);

  return (
    <BlogPostCommentCountComponent
      label={label}
      style={style}
      blockBase={blockBase}
      isEditor={Boolean(overlayProps)}
      overlayProps={overlayProps}
    />
  );
};
