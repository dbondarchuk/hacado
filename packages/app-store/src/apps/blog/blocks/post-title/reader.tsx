import { I18nText } from "@hacado/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogPublicAllKeys } from "../../translations/types";
import { BlogPostTitleReaderProps, styles } from "./schema";

export const BlogPostTitleReader = ({
  props,
  style,
  block,
  args,
}: BlogPostTitleReaderProps) => {
  // Get title from args.post.title
  const title = args?.post?.title;
  const showError = !title;

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
          title
        )}
      </span>
    </>
  );
};
