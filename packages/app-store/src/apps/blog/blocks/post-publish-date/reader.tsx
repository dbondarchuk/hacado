import { I18nText } from "@timelish/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
import { DateTime } from "luxon";
import { BlogPublicAllKeys } from "../../translations/types";
import { formatDate } from "./formats";
import {
  BlogPostPublishDatePropsDefaults,
  BlogPostPublishDateReaderProps,
  styles,
} from "./schema";

export const BlogPostPublishDateReader = ({
  props,
  style,
  block,
  args,
}: BlogPostPublishDateReaderProps) => {
  // Get publishDate from args.post.publishDate
  const publishDate = args?.post?.publicationDate;
  const format = props?.format ?? BlogPostPublishDatePropsDefaults.props.format;

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

  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <span className={cn(className, base?.className)} id={base?.id}>
        {showError ? (
          <I18nText
            text={
              "app_blog_public.notInBlogContext" satisfies BlogPublicAllKeys
            }
          />
        ) : (
          formattedDate
        )}
      </span>
    </>
  );
};
