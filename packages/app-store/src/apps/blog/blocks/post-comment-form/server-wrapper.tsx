import { getI18nAsync } from "@hacado/i18n/server";
import { BlogCommentsContext, BlogPost } from "../../models";
import { BlogPublicKeys, BlogPublicNamespace } from "../../translations/types";
import { BlogPostCommentFormComponent } from "./component";
import { resolveCommentFormDisplay } from "./resolve-display";
import { BlogPostCommentFormProps } from "./schema";

type BlogPostCommentFormServerWrapperProps = {
  props: BlogPostCommentFormProps["props"];
  style: BlogPostCommentFormProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: BlogCommentsContext & { post?: BlogPost; blogAppId?: string };
  blockMetadata?: { blogAppId?: string };
};

export const BlogPostCommentFormServerWrapper = async ({
  props,
  style,
  blockBase,
  args,
  blockMetadata,
}: BlogPostCommentFormServerWrapperProps) => {
  const t = await getI18nAsync<BlogPublicNamespace, BlogPublicKeys>(
    "app_blog_public",
  );

  const post = args?.post ?? null;
  const appId = blockMetadata?.blogAppId ?? args?.blogAppId ?? "";

  const config = args?.blogCommentsConfig ?? {
    commentsEnabled: false,
    commentsPremoderation: true,
  };

  const display = resolveCommentFormDisplay(props, config, t);

  return (
    <BlogPostCommentFormComponent
      post={post}
      appId={appId}
      display={display}
      style={style}
      blockBase={blockBase}
    />
  );
};
