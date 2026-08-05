"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { getReadingTimeLabel } from "./formats";
import {
  BlogPostReadTimeProps,
  BlogPostReadTimePropsDefaults,
  styles,
} from "./schema";

export const BlogPostReadTimeEditor = ({
  props,
  style,
}: BlogPostReadTimeProps) => {
  const currentBlock = useCurrentBlock<BlogPostReadTimeProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const format =
    currentBlock?.data?.props?.format ??
    BlogPostReadTimePropsDefaults.props.format;
  const wordsPerMinute =
    currentBlock?.data?.props?.wordsPerMinute ??
    BlogPostReadTimePropsDefaults.props.wordsPerMinute;

  const postContent = args?.post?.content;
  const showError = !args?.post;
  const readingTimeLabel = showError
    ? ""
    : getReadingTimeLabel(postContent, format, wordsPerMinute, t);

  const className = useClassName();
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      <span
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        {showError ? t("notInBlogContext") : readingTimeLabel}
      </span>
    </>
  );
};
