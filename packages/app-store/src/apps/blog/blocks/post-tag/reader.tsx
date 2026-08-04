import { I18nText } from "@timelish/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
import { BlogPublicAllKeys } from "../../translations/types";
import {
  BlogPostTagPropsDefaults,
  BlogPostTagReaderProps,
  styles,
} from "./schema";

export const BlogPostTagReader = ({
  props,
  style,
  block,
  args,
}: BlogPostTagReaderProps) => {
  // Get tag from args.tag
  const tag = args?.tag;
  const showError = !tag;

  // Get blogListUrl from props
  const blogListUrl =
    props?.blogListUrl ?? BlogPostTagPropsDefaults.props.blogListUrl;

  // Generate href
  let href = "#";
  if (!showError && tag) {
    if (blogListUrl) {
      // If blogListUrl is set, use it with tag query param
      href = `${blogListUrl}?tag=${encodeURIComponent(tag)}`;
    } else {
      // If not set, use current path (or empty) with just tag param
      href = `?tag=${encodeURIComponent(tag)}`;
    }
  }

  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <a href={href} className={cn(className, base?.className)} id={base?.id}>
        {showError ? (
          <I18nText
            text={
              "app_blog_public.notInBlogTagContext" satisfies BlogPublicAllKeys
            }
          />
        ) : (
          tag
        )}
      </a>
    </>
  );
};
