"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { DateTime } from "luxon";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { formatDate } from "./formats";
import {
  BlogPostPublishDateProps,
  BlogPostPublishDatePropsDefaults,
  styles,
} from "./schema";

export const BlogPostPublishDateEditor = ({
  props,
  style,
}: BlogPostPublishDateProps) => {
  const currentBlock = useCurrentBlock<BlogPostPublishDateProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const format =
    currentBlock?.data?.props?.format ??
    BlogPostPublishDatePropsDefaults.props.format;

  // Get publishDate from args.post.publishDate
  const publishDate = args?.post?.publicationDate;
  let formattedDate = "";
  let showError = false;

  if (!publishDate) {
    showError = true;
  } else {
    try {
      // Try to parse as ISO string or Date
      const dateTime =
        typeof publishDate === "string"
          ? DateTime.fromISO(publishDate)
          : publishDate instanceof Date
            ? DateTime.fromJSDate(publishDate)
            : DateTime.fromJSDate(new Date(publishDate));

      if (dateTime.isValid) {
        formattedDate = formatDate(dateTime, format);
      } else {
        showError = true;
      }
    } catch (e) {
      showError = true;
    }
  }

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
        {showError ? t("notInBlogContext") : formattedDate}
      </span>
    </>
  );
};
