import { getShortPostContent } from "./get-short-post-content";
import {
  BlogPostContentProps,
  BlogPostContentPropsDefaults,
  BlogPostShortContentProps,
} from "./schema";

export const resolveBlogPostDisplayContent = (
  postContent: unknown,
  props: BlogPostContentProps["props"] | null | undefined,
): unknown => {
  if (postContent == null) {
    return postContent;
  }

  const showShort =
    props?.showShort ?? BlogPostContentPropsDefaults.props.showShort;

  const maxParagraphs =
    !!props && "maxParagraphs" in props && !!props.maxParagraphs
      ? props.maxParagraphs
      : BlogPostShortContentProps.maxParagraphs;

  const showOnlyTextParagraphs =
    !!props &&
    "showOnlyTextParagraphs" in props &&
    typeof props.showOnlyTextParagraphs === "boolean"
      ? props.showOnlyTextParagraphs
      : BlogPostShortContentProps.showOnlyTextParagraphs;

  return getShortPostContent(postContent, {
    showShort,
    maxParagraphs,
    showOnlyTextParagraphs,
  });
};
