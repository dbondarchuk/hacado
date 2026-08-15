import { ReaderDocumentBlocksDictionary } from "@hacado/builder";
import { BlogCommentAuthorReader } from "./comment-author/reader";
import { BlogCommentBodyReader } from "./comment-body/reader";
import { BlogCommentContainerReader } from "./comment-container/reader";
import { BlogCommentDateReader } from "./comment-date/reader";
import { BlogCommentNavigationButtonReader } from "./comment-navigation-button/reader";
import { BlogCommentsContainerReader } from "./comments-container/reader";
import { BlogPostAuthorReader } from "./post-author/reader";
import { BlogPostCommentCountReader } from "./post-comment-count/reader";
import { BlogPostCommentFormReader } from "./post-comment-form/reader";
import { BlogPostContainerReader } from "./post-container/reader";
import { BlogPostContentReader } from "./post-content/reader";
import { BlogPostNavigationButtonReader } from "./post-navigation-button/reader";
import { BlogPostPublishDateReader } from "./post-publish-date/reader";
import { BlogPostReadTimeReader } from "./post-read-time/reader";
import { BlogPostTagReader } from "./post-tag/reader";
import { BlogPostTitleReader } from "./post-title/reader";
import { BlogPostsContainerReader } from "./posts-container/reader";
import type { BlogBlocksSchema } from "./schema";

export const BlogReaders: ReaderDocumentBlocksDictionary<
  typeof BlogBlocksSchema
> = {
  BlogPostContainer: {
    Reader: BlogPostContainerReader,
  },
  BlogPostTitle: {
    Reader: BlogPostTitleReader,
  },
  BlogPostContent: {
    Reader: BlogPostContentReader,
  },
  BlogPostTag: {
    Reader: BlogPostTagReader,
  },
  BlogPostPublishDate: {
    Reader: BlogPostPublishDateReader,
  },
  BlogPostReadTime: {
    Reader: BlogPostReadTimeReader,
  },
  BlogPostAuthor: {
    Reader: BlogPostAuthorReader,
  },
  BlogPostsContainer: {
    Reader: BlogPostsContainerReader,
  },
  BlogPostNavigationButton: {
    Reader: BlogPostNavigationButtonReader,
  },
  BlogPostCommentCount: {
    Reader: BlogPostCommentCountReader,
  },
  BlogCommentsContainer: {
    Reader: BlogCommentsContainerReader,
  },
  BlogCommentContainer: {
    Reader: BlogCommentContainerReader,
  },
  BlogCommentAuthor: {
    Reader: BlogCommentAuthorReader,
  },
  BlogCommentDate: {
    Reader: BlogCommentDateReader,
  },
  BlogCommentBody: {
    Reader: BlogCommentBodyReader,
  },
  BlogCommentNavigationButton: {
    Reader: BlogCommentNavigationButtonReader,
  },
  BlogPostCommentForm: {
    Reader: BlogPostCommentFormReader,
  },
};
