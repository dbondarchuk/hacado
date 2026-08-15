import { I18nText } from "@hacado/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogPublicAllKeys } from "../../translations/types";
import { BlogCommentAuthorReaderProps, styles } from "./schema";

export const BlogCommentAuthorDisplay = ({
  style,
  block,
  args,
}: Pick<BlogCommentAuthorReaderProps, "style" | "block" | "args">) => {
  const authorName = args?.comment?.authorName;
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <span className={cn(className, base?.className)} id={base?.id}>
        {authorName ? (
          authorName
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
