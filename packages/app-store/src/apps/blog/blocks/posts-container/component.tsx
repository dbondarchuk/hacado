import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogPost } from "../../models";
import { BlogPostsContainerReaderProps, styles } from "./schema";

type BlogPostsContainerComponentProps = {
  posts: BlogPost[];
  totalPosts: number;
  page: number;
  postsPerPage: number;
  tag?: string;
  children: BlogPostsContainerReaderProps["props"]["children"];
  style: BlogPostsContainerReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  restProps: any;
  isEditor?: boolean;
  appId?: string;
  args?: any;
};

export const BlogPostsContainerComponent = ({
  posts,
  totalPosts,
  page,
  postsPerPage,
  tag,
  children,
  style,
  blockBase,
  restProps,
  isEditor,
  appId,
  args,
}: BlogPostsContainerComponentProps) => {
  const className = generateClassName();
  const base = blockBase;

  // Inject posts and pagination data into args for child blocks
  const newArgs = {
    ...args,
    posts,
    totalPosts,
    page,
    tag,
    postsPerPage,
    blogAppId: appId ?? args?.blogAppId,
    blogCommentsConfig: args?.blogCommentsConfig,
  };

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div className={cn(className, base?.className)} id={base?.id}>
        {children.map((child) => (
          <ReaderBlock
            key={child.id}
            {...restProps}
            block={child}
            args={newArgs}
            isEditor={isEditor}
          />
        ))}
      </div>
    </>
  );
};
