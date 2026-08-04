"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  BlockStyle,
  generateClassName,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
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

type BlogPostReadTimeComponentProps = {
  props: BlogPostReadTimeProps["props"];
  style: BlogPostReadTimeProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: { post?: { content?: unknown } };
};

export const BlogPostReadTimeComponent = ({
  props,
  style,
  blockBase,
  args,
}: BlogPostReadTimeComponentProps) => {
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);
  const postContent = args?.post?.content;
  const format = props?.format ?? BlogPostReadTimePropsDefaults.props.format;
  const wordsPerMinute =
    props?.wordsPerMinute ?? BlogPostReadTimePropsDefaults.props.wordsPerMinute;

  const showError = !args?.post;
  const readingTimeLabel = showError
    ? ""
    : getReadingTimeLabel(postContent, format, wordsPerMinute, t);

  const className = generateClassName();
  const base = blockBase;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <span className={cn(className, base?.className)} id={base?.id}>
        {showError
          ? t("notInBlogContext" satisfies BlogPublicKeys)
          : readingTimeLabel}
      </span>
    </>
  );
};
