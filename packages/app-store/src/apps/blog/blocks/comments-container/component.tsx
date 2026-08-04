import { ReaderBlock } from "@timelish/builder";
import { I18nText } from "@timelish/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
import { BlogCommentPublic } from "../../models";
import { BlogPublicAllKeys } from "../../translations/types";
import { BlogCommentsContainerReaderProps, styles } from "./schema";

type BlogCommentsContainerComponentProps = {
  comments: BlogCommentPublic[];
  totalComments: number;
  page: number;
  commentsPerPage: number;
  children: BlogCommentsContainerReaderProps["props"]["children"];
  style: BlogCommentsContainerReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  restProps: any;
  isEditor?: boolean;
  appId?: string;
  args?: Record<string, unknown>;
  showDisabled?: boolean;
};

export const BlogCommentsContainerComponent = ({
  comments,
  totalComments,
  page,
  commentsPerPage,
  children,
  style,
  blockBase,
  restProps,
  isEditor,
  appId,
  args,
  showDisabled,
}: BlogCommentsContainerComponentProps) => {
  const className = generateClassName();
  const base = blockBase;

  const newArgs = {
    ...args,
    comments,
    totalComments,
    page,
    commentsPerPage,
    blogAppId: appId ?? args?.blogAppId,
    blogCommentsConfig: args?.blogCommentsConfig,
    searchParams: args?.searchParams,
    path: args?.path,
  };

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div className={cn(className, base?.className)} id={base?.id}>
        <div id="comments" className="scroll-mt-16"></div>
        {showDisabled ? (
          <p className="text-sm text-muted-foreground">
            <I18nText
              text={
                "app_blog_public.block.postCommentsList.disabled" satisfies BlogPublicAllKeys
              }
            />
          </p>
        ) : totalComments === 0 ? (
          <p className="text-sm text-muted-foreground">
            <I18nText
              text={
                "app_blog_public.block.postCommentsList.empty" satisfies BlogPublicAllKeys
              }
            />
          </p>
        ) : (
          children.map((child) => (
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
