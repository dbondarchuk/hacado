import { I18nText } from "@hacado/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogPublicAllKeys } from "../../translations/types";
import { BlogCommentBodyReaderProps, styles } from "./schema";

export const BlogCommentBodyDisplay = ({
  style,
  block,
  args,
}: Pick<BlogCommentBodyReaderProps, "style" | "block" | "args">) => {
  const body = args?.comment?.body;
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <p
        className={cn(className, "whitespace-pre-wrap", base?.className)}
        id={base?.id}
      >
        {body ? (
          body
        ) : (
          <I18nText
            text={
              "app_blog_public.notInBlogContext" satisfies BlogPublicAllKeys
            }
          />
        )}
      </p>
    </>
  );
};
