"use client";

import { useI18n } from "@hacado/i18n/client";
import { useMemo } from "react";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { blogPostsListFixtures } from "../fixtures";
import { BlogPostCommentFormComponent } from "./component";
import { resolveCommentFormDisplay } from "./resolve-display";
import { BlogPostCommentFormProps } from "./schema";

type BlogPostCommentFormEditorWrapperProps = {
  props: BlogPostCommentFormProps["props"];
  style: BlogPostCommentFormProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: { post?: unknown; blogAppId?: string };
  appId?: string;
  overlayProps?: Record<string, unknown>;
};

export const BlogPostCommentFormEditorWrapper = ({
  props,
  style,
  blockBase,
  args,
  appId = "",
  overlayProps,
}: BlogPostCommentFormEditorWrapperProps) => {
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const display = useMemo(
    () =>
      resolveCommentFormDisplay(
        props,
        { commentsEnabled: true, commentsPremoderation: true },
        t,
      ),
    [props, t],
  );

  const post = args?.post ? blogPostsListFixtures[0] : null;

  return (
    <BlogPostCommentFormComponent
      post={post}
      appId={appId}
      display={display}
      style={style}
      blockBase={blockBase}
      isEditor={Boolean(overlayProps)}
      overlayProps={overlayProps}
    />
  );
};
