import { I18nText } from "@timelish/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
import { DateTime } from "luxon";
import { BlogPublicAllKeys } from "../../translations/types";
import { formatDate } from "../post-publish-date/formats";
import {
  BlogCommentDatePropsDefaults,
  BlogCommentDateReaderProps,
  styles,
} from "./schema";

export const BlogCommentDateDisplay = ({
  props,
  style,
  block,
  args,
}: Pick<BlogCommentDateReaderProps, "props" | "style" | "block" | "args">) => {
  const createdAt = args?.comment?.createdAt;
  const format = props?.format ?? BlogCommentDatePropsDefaults.props.format;
  const className = generateClassName();
  const base = block.base;

  let formatted = "";
  if (createdAt) {
    const dateTime =
      typeof createdAt === "string"
        ? DateTime.fromISO(createdAt)
        : DateTime.fromJSDate(new Date(createdAt));
    if (dateTime.isValid) {
      formatted = formatDate(dateTime, format);
    }
  }

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <span
        className={cn(
          className,
          "text-sm text-muted-foreground",
          base?.className,
        )}
        id={base?.id}
      >
        {formatted ? (
          formatted
        ) : (
          <I18nText
            text={
              "app_blog_public.notInBlogContext" satisfies BlogPublicAllKeys
            }
          />
        )}
      </span>
    </>
  );
};
