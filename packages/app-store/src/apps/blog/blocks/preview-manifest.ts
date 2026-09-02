import {
  templatePreviewPath,
  type TemplatePreviewEntry,
} from "../../../template-previews/types";
import { BLOG_APP_NAME } from "../const";

export const BLOG_TEMPLATE_PREVIEWS = [
  { key: "PostFeaturedImage", group: "blog", file: "post-featured-image.png" },
  { key: "PostReadMore", group: "blog", file: "post-read-more.png" },
  { key: "PostTitleHeader", group: "blog", file: "post-title-header.png" },
  { key: "PostTags", group: "blog", file: "post-tags.png" },
  { key: "PostMeta", group: "blog", file: "post-meta.png" },
  { key: "BlogPost", group: "blog", file: "blog-post.png" },
  {
    key: "CommentsListNavigation",
    group: "blog",
    file: "comments-list-navigation.png",
  },
  { key: "BlogCommentsList", group: "blog", file: "blog-comments-list.png" },
  {
    key: "PostsListNavigation",
    group: "blog",
    file: "posts-list-navigation.png",
  },
  {
    key: "BlogPostsList",
    group: "blog",
    file: "blog-posts-list.png",
    delayMs: 5000,
  },
] as const satisfies readonly TemplatePreviewEntry[];

export function blogTemplatePreviewPath(file: string): string {
  return templatePreviewPath(BLOG_APP_NAME, file);
}
