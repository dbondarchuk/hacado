import { ReaderBlock } from "@hacado/builder";
import { I18nText } from "@hacado/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogCommentsContext, BlogPost } from "../../models";
import { BlogPublicAllKeys } from "../../translations/types";
import { BlogPostContainerReaderProps, styles } from "./schema";

type BlogPostContainerComponentProps = {
  post: BlogPost | null;
  error: BlogPublicAllKeys | null;
  postLink: string | null;
  children: BlogPostContainerReaderProps["props"]["children"];
  style: BlogPostContainerReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  restProps: any;
  isEditor?: boolean;
  args?: BlogCommentsContext & Record<string, unknown>;
  appId?: string;
};

export const BlogPostContainerComponent = async ({
  post,
  error,
  postLink,
  children,
  style,
  blockBase,
  restProps,
  isEditor,
  args,
  appId,
}: BlogPostContainerComponentProps) => {
  const className = generateClassName();
  const base = blockBase;

  // Inject post and postLink into args for child blocks
  const newArgs = {
    ...args,
    post,
    postLink,
    blogAppId: appId ?? args?.blogAppId,
    blogCommentsConfig: args?.blogCommentsConfig,
  };

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div className={cn(className, base?.className)} id={base?.id}>
        {error ? (
          <span>
            <I18nText text={error} />
          </span>
        ) : (
          children
            .filter((child) => !!child)
            .map((child) => (
              <ReaderBlock
                key={child.id}
                {...restProps}
                block={child}
                args={newArgs}
                isEditor={isEditor}
              />
            ))
        )}
      </div>
    </>
  );
};
