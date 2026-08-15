import { getI18nAsync } from "@hacado/i18n/server";
import { BlogCommentsContext, BlogPost } from "../../models";
import { BlogPublicKeys, BlogPublicNamespace } from "../../translations/types";
import { BlogPostCommentCountComponent } from "./component";
import { getCommentCountLabel } from "./formats";
import {
  BlogPostCommentCountProps,
  BlogPostCommentCountPropsDefaults,
} from "./schema";

type BlogPostCommentCountServerWrapperProps = {
  props: BlogPostCommentCountProps["props"];
  style: BlogPostCommentCountProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: BlogCommentsContext & { post?: BlogPost; blogAppId?: string };
  blockMetadata?: { blogAppId?: string };
};

export const BlogPostCommentCountServerWrapper = async ({
  props,
  style,
  blockBase,
  args,
}: BlogPostCommentCountServerWrapperProps) => {
  const t = await getI18nAsync<BlogPublicNamespace, BlogPublicKeys>(
    "app_blog_public",
  );

  const format =
    props?.format ?? BlogPostCommentCountPropsDefaults.props.format;
  const post = args?.post;
  const config = args?.blogCommentsConfig;

  let label = "";
  if (!post) {
    label = t("notInBlogContext" satisfies BlogPublicKeys);
  } else if (!config?.commentsEnabled) {
    label = t("block.postCommentCount.disabled" satisfies BlogPublicKeys);
  } else {
    const count = post.commentsCount ?? 0;
    label = getCommentCountLabel(count, format, t);
  }

  return (
    <BlogPostCommentCountComponent
      label={label}
      style={style}
      blockBase={blockBase}
    />
  );
};
