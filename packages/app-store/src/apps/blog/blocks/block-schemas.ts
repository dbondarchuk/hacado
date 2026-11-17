import { BlogCommentAuthorPropsSchema } from "./comment-author/schema";
import { BlogCommentBodyPropsSchema } from "./comment-body/schema";
import { BlogCommentContainerPropsSchema } from "./comment-container/schema";
import { BlogCommentDatePropsSchema } from "./comment-date/schema";
import { BlogCommentNavigationButtonPropsSchema } from "./comment-navigation-button/schema";
import { BlogCommentsContainerPropsSchema } from "./comments-container/schema";
import { BlogPostAuthorPropsSchema } from "./post-author/schema";
import { BlogPostCommentCountPropsSchema } from "./post-comment-count/schema";
import { BlogPostCommentFormPropsSchema } from "./post-comment-form/schema";
import { BlogPostContainerPropsSchema } from "./post-container/schema";
import { BlogPostContentPropsSchema } from "./post-content/schema";
import { BlogPostNavigationButtonPropsSchema } from "./post-navigation-button/schema";
import { BlogPostPublishDatePropsSchema } from "./post-publish-date/schema";
import { BlogPostReadTimePropsSchema } from "./post-read-time/schema";
import { BlogPostTagPropsSchema } from "./post-tag/schema";
import { BlogPostTitlePropsSchema } from "./post-title/schema";
import { BlogPostsContainerPropsSchema } from "./posts-container/schema";

export const BlogBlocksSchema = {
  BlogPostContainer: BlogPostContainerPropsSchema,
  BlogPostTitle: BlogPostTitlePropsSchema,
  BlogPostContent: BlogPostContentPropsSchema,
  BlogPostTag: BlogPostTagPropsSchema,
  BlogPostPublishDate: BlogPostPublishDatePropsSchema,
  BlogPostReadTime: BlogPostReadTimePropsSchema,
  BlogPostAuthor: BlogPostAuthorPropsSchema,
  BlogPostsContainer: BlogPostsContainerPropsSchema,
  BlogPostNavigationButton: BlogPostNavigationButtonPropsSchema,
  BlogPostCommentCount: BlogPostCommentCountPropsSchema,
  BlogCommentsContainer: BlogCommentsContainerPropsSchema,
  BlogCommentContainer: BlogCommentContainerPropsSchema,
  BlogCommentAuthor: BlogCommentAuthorPropsSchema,
  BlogCommentDate: BlogCommentDatePropsSchema,
  BlogCommentBody: BlogCommentBodyPropsSchema,
  BlogCommentNavigationButton: BlogCommentNavigationButtonPropsSchema,
  BlogPostCommentForm: BlogPostCommentFormPropsSchema,
} as {
  BlogPostContainer: typeof BlogPostContainerPropsSchema;
  BlogPostTitle: typeof BlogPostTitlePropsSchema;
  BlogPostContent: typeof BlogPostContentPropsSchema;
  BlogPostTag: typeof BlogPostTagPropsSchema;
  BlogPostPublishDate: typeof BlogPostPublishDatePropsSchema;
  BlogPostReadTime: typeof BlogPostReadTimePropsSchema;
  BlogPostAuthor: typeof BlogPostAuthorPropsSchema;
  BlogPostsContainer: typeof BlogPostsContainerPropsSchema;
  BlogPostNavigationButton: typeof BlogPostNavigationButtonPropsSchema;
  BlogPostCommentCount: typeof BlogPostCommentCountPropsSchema;
  BlogCommentsContainer: typeof BlogCommentsContainerPropsSchema;
  BlogCommentContainer: typeof BlogCommentContainerPropsSchema;
  BlogCommentAuthor: typeof BlogCommentAuthorPropsSchema;
  BlogCommentDate: typeof BlogCommentDatePropsSchema;
  BlogCommentBody: typeof BlogCommentBodyPropsSchema;
  BlogCommentNavigationButton: typeof BlogCommentNavigationButtonPropsSchema;
  BlogPostCommentForm: typeof BlogPostCommentFormPropsSchema;
};

export const BlogBlocksAllowedInFooter = {
  BlogPostContainer: false,
  BlogPostTitle: false,
  BlogPostContent: false,
  BlogPostTag: false,
  BlogPostPublishDate: false,
  BlogPostReadTime: false,
  BlogPostAuthor: false,
  BlogPostsContainer: false,
  BlogPostNavigationButton: false,
  BlogPostCommentCount: false,
  BlogCommentsContainer: false,
  BlogCommentContainer: false,
  BlogCommentAuthor: false,
  BlogCommentDate: false,
  BlogCommentBody: false,
  BlogCommentNavigationButton: false,
  BlogPostCommentForm: false,
};
