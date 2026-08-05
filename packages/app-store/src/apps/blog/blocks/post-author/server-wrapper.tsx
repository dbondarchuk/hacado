import { getI18nAsync } from "@hacado/i18n/server";
import { BlogPost } from "../../models";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
} from "../../translations/types";
import { BlogPostAuthorComponent } from "./component";
import { getAuthorLabel } from "./formats";
import { resolveAuthorNameFromPostAsync } from "./resolve-author";
import {
  BlogPostAuthorProps,
  BlogPostAuthorPropsDefaults,
} from "./schema";

type BlogPostAuthorServerWrapperProps = {
  props: BlogPostAuthorProps["props"];
  style: BlogPostAuthorProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: { post?: BlogPost };
};

export const BlogPostAuthorServerWrapper = async ({
  props,
  style,
  blockBase,
  args,
}: BlogPostAuthorServerWrapperProps) => {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id") as string;

  const t = await getI18nAsync<BlogPublicNamespace, BlogPublicKeys>(
    "app_blog_public",
  );

  const format = props?.format ?? BlogPostAuthorPropsDefaults.props.format;
  const post = args?.post;
  const showNotInContext = !post;

  let label = "";
  if (showNotInContext) {
    label = t("notInBlogContext" satisfies BlogPublicKeys);
  } else if (!organizationId) {
    label = t("block.postAuthor.missingAuthor" satisfies BlogPublicKeys);
  } else {
    const authorName = await resolveAuthorNameFromPostAsync(post, organizationId);
    if (!authorName) {
      label = t("block.postAuthor.missingAuthor" satisfies BlogPublicKeys);
    } else {
      label = getAuthorLabel(authorName, format, t);
    }
  }

  return (
    <BlogPostAuthorComponent
      label={label}
      style={style}
      blockBase={blockBase}
    />
  );
};
