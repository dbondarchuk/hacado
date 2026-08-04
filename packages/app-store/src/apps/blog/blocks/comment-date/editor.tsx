"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { BlockStyle, useClassName } from "@timelish/page-builder-base";
import { cn } from "@timelish/ui";
import { DateTime } from "luxon";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { blogCommentFixtures } from "../comment-fixtures";
import { formatDate } from "../post-publish-date/formats";
import {
  BlogCommentDateProps,
  BlogCommentDatePropsDefaults,
  styles,
} from "./schema";

export const BlogCommentDateEditor = ({
  props,
  style,
}: BlogCommentDateProps) => {
  const currentBlock = useCurrentBlock<BlogCommentDateProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);
  const format = props?.format ?? BlogCommentDatePropsDefaults.props.format;

  const createdAt =
    args?.comment?.createdAt ??
    args?._item?.createdAt ??
    blogCommentFixtures[0]?.createdAt;

  let formatted = "";
  if (createdAt) {
    const dateTime = DateTime.fromJSDate(new Date(createdAt));
    if (dateTime.isValid) {
      formatted = formatDate(dateTime, format);
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
        className={cn(
          className,
          "text-sm text-muted-foreground",
          base?.className,
        )}
        id={base?.id}
        {...overlayProps}
      >
        {formatted || t("notInBlogContext")}
      </span>
    </>
  );
};
