import { I18nText } from "@hacado/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { PlateStaticEditor } from "@hacado/rte";
import { cn } from "@hacado/ui";
import { useMemo } from "react";
import { BlogPublicAllKeys } from "../../translations/types";
import { resolveBlogPostDisplayContent } from "./resolve-display-content";
import { BlogPostContentReaderProps, styles } from "./schema";

export const BlogPostContentReader = ({
  props,
  style,
  block,
  args,
}: BlogPostContentReaderProps) => {
  // Get content from args.post.content
  const postContent = args?.post?.content;
  const showError = !postContent;

  const displayContent = useMemo(() => {
    if (!postContent || showError) {
      return postContent;
    }
    return resolveBlogPostDisplayContent(postContent, props);
  }, [postContent, props, showError]);

  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      {showError ? (
        <div className={cn(className, base?.className)} id={base?.id}>
          <I18nText
            text={
              "app_blog_public.notInBlogContext" satisfies BlogPublicAllKeys
            }
          />
        </div>
      ) : (
        <PlateStaticEditor
          value={displayContent}
          className={cn(className, base?.className)}
          id={base?.id}
        />
      )}
    </>
  );
};
