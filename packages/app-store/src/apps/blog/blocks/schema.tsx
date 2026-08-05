import { EditorDocumentBlocksDictionary } from "@hacado/builder";
import { AllKeys } from "@hacado/i18n";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Heading,
  MessageSquare,
  SquareSquare,
  User,
} from "lucide-react";
import { BlogAdminKeys, BlogAdminNamespace } from "../translations/types";
import { BlogCommentAuthorConfiguration } from "./comment-author/configuration";
import { BlogCommentAuthorEditor } from "./comment-author/editor";
import {
  BlogCommentAuthorPropsDefaults,
  BlogCommentAuthorPropsSchema,
} from "./comment-author/schema";
import { BlogCommentBodyConfiguration } from "./comment-body/configuration";
import { BlogCommentBodyEditor } from "./comment-body/editor";
import {
  BlogCommentBodyPropsDefaults,
  BlogCommentBodyPropsSchema,
} from "./comment-body/schema";
import { BlogCommentContainerConfiguration } from "./comment-container/configuration";
import { BlogCommentContainerEditor } from "./comment-container/editor";
import {
  BlogCommentContainerPropsDefaults,
  BlogCommentContainerPropsSchema,
} from "./comment-container/schema";
import { BlogCommentDateConfiguration } from "./comment-date/configuration";
import { BlogCommentDateEditor } from "./comment-date/editor";
import {
  BlogCommentDatePropsDefaults,
  BlogCommentDatePropsSchema,
} from "./comment-date/schema";
import { BlogCommentNavigationButtonConfiguration } from "./comment-navigation-button/configuration";
import { BlogCommentNavigationButtonEditor } from "./comment-navigation-button/editor";
import {
  BlogCommentNavigationButtonPropsDefaults,
  BlogCommentNavigationButtonPropsSchema,
} from "./comment-navigation-button/schema";
import { BlogCommentsContainerConfiguration } from "./comments-container/configuration";
import { BlogCommentsContainerEditor } from "./comments-container/editor";
import {
  BlogCommentsContainerPropsDefaults,
  BlogCommentsContainerPropsSchema,
} from "./comments-container/schema";
import { BlogPostAuthorConfiguration } from "./post-author/configuration";
import { BlogPostAuthorEditor } from "./post-author/editor";
import {
  BlogPostAuthorPropsDefaults,
  BlogPostAuthorPropsSchema,
} from "./post-author/schema";
import { BlogPostCommentCountConfiguration } from "./post-comment-count/configuration";
import { BlogPostCommentCountEditor } from "./post-comment-count/editor";
import {
  BlogPostCommentCountPropsDefaults,
  BlogPostCommentCountPropsSchema,
} from "./post-comment-count/schema";
import { BlogPostCommentFormConfiguration } from "./post-comment-form/configuration";
import { BlogPostCommentFormEditor } from "./post-comment-form/editor";
import {
  BlogPostCommentFormPropsDefaults,
  BlogPostCommentFormPropsSchema,
} from "./post-comment-form/schema";
import { BlogPostContainerConfiguration } from "./post-container/configuration";
import { BlogPostContainerEditor } from "./post-container/editor";
import {
  BlogPostContainerPropsDefaults,
  BlogPostContainerPropsSchema,
} from "./post-container/schema";
import { BlogPostContainerToolbar } from "./post-container/toolbar";
import { BlogPostContentConfiguration } from "./post-content/configuration";
import { BlogPostContentEditor } from "./post-content/editor";
import {
  BlogPostContentPropsDefaults,
  BlogPostContentPropsSchema,
} from "./post-content/schema";
import { BlogPostNavigationButtonConfiguration } from "./post-navigation-button/configuration";
import { BlogPostNavigationButtonEditor } from "./post-navigation-button/editor";
import {
  BlogPostNavigationButtonPropsDefaults,
  BlogPostNavigationButtonPropsSchema,
} from "./post-navigation-button/schema";
import { BlogPostNavigationButtonToolbar } from "./post-navigation-button/toolbar";
import { BlogPostPublishDateConfiguration } from "./post-publish-date/configuration";
import { BlogPostPublishDateEditor } from "./post-publish-date/editor";
import {
  BlogPostPublishDatePropsDefaults,
  BlogPostPublishDatePropsSchema,
} from "./post-publish-date/schema";
import { BlogPostReadTimeConfiguration } from "./post-read-time/configuration";
import { BlogPostReadTimeEditor } from "./post-read-time/editor";
import {
  BlogPostReadTimePropsDefaults,
  BlogPostReadTimePropsSchema,
} from "./post-read-time/schema";
import { BlogPostTagConfiguration } from "./post-tag/configuration";
import { BlogPostTagEditor } from "./post-tag/editor";
import {
  BlogPostTagPropsDefaults,
  BlogPostTagPropsSchema,
} from "./post-tag/schema";
import { BlogPostTitleConfiguration } from "./post-title/configuration";
import { BlogPostTitleEditor } from "./post-title/editor";
import {
  BlogPostTitlePropsDefaults,
  BlogPostTitlePropsSchema,
} from "./post-title/schema";
import { BlogPostsContainerConfiguration } from "./posts-container/configuration";
import { BlogPostsContainerEditor } from "./posts-container/editor";
import {
  BlogPostsContainerPropsDefaults,
  BlogPostsContainerPropsSchema,
} from "./posts-container/schema";
import { BlogPostsContainerToolbar } from "./posts-container/toolbar";
import { BlogTextToolbar } from "./text-toolbar";

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

export const BlogBlocksDefaultMetadata = (
  appName: string,
  appId: string,
): Record<string, any> => ({
  blogAppId: appId,
});

export const BlogEditors: EditorDocumentBlocksDictionary<
  typeof BlogBlocksSchema
> = {
  BlogPostContainer: {
    displayName:
      "app_blog_admin.block.postContainer.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <FileText />,
    Configuration: BlogPostContainerConfiguration,
    Editor: BlogPostContainerEditor,
    Toolbar: BlogPostContainerToolbar,
    defaultValue: BlogPostContainerPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["container", "post-provider"],
    tags: ["container", "blog", "post-container"],
  },
  BlogPostTitle: {
    displayName: "app_blog_admin.block.postTitle.displayName" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    icon: <Heading />,
    Configuration: BlogPostTitleConfiguration,
    Editor: BlogPostTitleEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogPostTitlePropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-post-title"],
    tags: ["blog", "blog-post-title"],
  },
  BlogPostContent: {
    displayName: "app_blog_admin.block.postContent.displayName" as any,
    icon: <FileText />,
    Configuration: BlogPostContentConfiguration,
    Editor: BlogPostContentEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogPostContentPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["block", "blog-post-content"],
    tags: ["blog", "blog-post-content"],
  },
  BlogPostTag: {
    displayName: "app_blog_admin.block.postTag.displayName" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    icon: <SquareSquare />,
    Configuration: BlogPostTagConfiguration,
    Editor: BlogPostTagEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogPostTagPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-post-tag", "link"],
    tags: ["blog", "blog-post-tag", "link"],
  },
  BlogPostPublishDate: {
    displayName:
      "app_blog_admin.block.postPublishDate.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <Calendar />,
    Configuration: BlogPostPublishDateConfiguration,
    Editor: BlogPostPublishDateEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogPostPublishDatePropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-post-publish-date"],
    tags: ["blog", "blog-post-publish-date"],
  },
  BlogPostReadTime: {
    displayName:
      "app_blog_admin.block.postReadTime.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <Clock />,
    Configuration: BlogPostReadTimeConfiguration,
    Editor: BlogPostReadTimeEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogPostReadTimePropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-post-read-time"],
    tags: ["blog", "blog-post-read-time"],
  },
  BlogPostAuthor: {
    displayName:
      "app_blog_admin.block.postAuthor.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <User />,
    Configuration: BlogPostAuthorConfiguration,
    Editor: BlogPostAuthorEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogPostAuthorPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-post-author"],
    tags: ["blog", "blog-post-author"],
  },
  BlogPostsContainer: {
    displayName:
      "app_blog_admin.block.postsContainer.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <FileText />,
    Configuration: BlogPostsContainerConfiguration,
    Editor: BlogPostsContainerEditor,
    Toolbar: BlogPostsContainerToolbar,
    defaultValue: BlogPostsContainerPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["container", "blog-posts-provider"],
    tags: ["container", "blog", "blog-posts-container"],
  },
  BlogPostNavigationButton: {
    displayName:
      "app_blog_admin.block.postNavigationButton.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <ArrowRight />,
    Configuration: BlogPostNavigationButtonConfiguration,
    Editor: BlogPostNavigationButtonEditor,
    Toolbar: BlogPostNavigationButtonToolbar,
    defaultValue: BlogPostNavigationButtonPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["button", "action", "link", "blog-post-navigation-button"],
    tags: ["blog", "blog-post-navigation-button"],
  },
  BlogPostCommentCount: {
    displayName:
      "app_blog_admin.block.postCommentCount.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <MessageSquare />,
    Configuration: BlogPostCommentCountConfiguration,
    Editor: BlogPostCommentCountEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogPostCommentCountPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-post-comment-count"],
    tags: ["blog", "blog-post-comment-count"],
  },
  BlogCommentsContainer: {
    displayName:
      "app_blog_admin.block.commentsContainer.displayName" as any satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <MessageSquare />,
    Configuration: BlogCommentsContainerConfiguration,
    Editor: BlogCommentsContainerEditor,
    defaultValue: BlogCommentsContainerPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["container", "blog-comments-provider"],
    tags: ["container", "blog", "blog-comments-container"],
  },
  BlogCommentContainer: {
    displayName:
      "app_blog_admin.block.commentContainer.displayName" as any satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <MessageSquare />,
    Configuration: BlogCommentContainerConfiguration,
    Editor: BlogCommentContainerEditor,
    defaultValue: BlogCommentContainerPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["container"],
    tags: ["blog", "blog-comment-container"],
  },
  BlogCommentAuthor: {
    displayName:
      "app_blog_admin.block.commentAuthor.displayName" as any satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <User />,
    Configuration: BlogCommentAuthorConfiguration,
    Editor: BlogCommentAuthorEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogCommentAuthorPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-comment-author"],
    tags: ["blog", "blog-comment-author"],
  },
  BlogCommentDate: {
    displayName:
      "app_blog_admin.block.commentDate.displayName" as any satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <Calendar />,
    Configuration: BlogCommentDateConfiguration,
    Editor: BlogCommentDateEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogCommentDatePropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["inline", "blog-comment-date"],
    tags: ["blog", "blog-comment-date"],
  },
  BlogCommentBody: {
    displayName:
      "app_blog_admin.block.commentBody.displayName" as any satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <MessageSquare />,
    Configuration: BlogCommentBodyConfiguration,
    Editor: BlogCommentBodyEditor,
    Toolbar: BlogTextToolbar,
    defaultValue: BlogCommentBodyPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["block", "blog-comment-body"],
    tags: ["blog", "blog-comment-body"],
  },
  BlogCommentNavigationButton: {
    displayName:
      "app_blog_admin.block.commentNavigationButton.displayName" as any satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <ArrowRight />,
    Configuration: BlogCommentNavigationButtonConfiguration,
    Editor: BlogCommentNavigationButtonEditor,
    defaultValue: BlogCommentNavigationButtonPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["button", "action", "blog-comment-navigation-button"],
    tags: ["blog", "blog-comment-navigation-button"],
  },
  BlogPostCommentForm: {
    displayName:
      "app_blog_admin.block.postCommentForm.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <MessageSquare />,
    Configuration: BlogPostCommentFormConfiguration,
    Editor: BlogPostCommentFormEditor,
    defaultValue: BlogPostCommentFormPropsDefaults,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    capabilities: ["block", "blog-post-comment-form"],
    tags: ["blog", "blog-post-comment-form"],
  },
};

type BlogBlocksType = {
  [K in keyof typeof BlogBlocksSchema]: {
    schema: (typeof BlogBlocksSchema)[K];
    editor: (typeof BlogEditors)[K];
    allowedInFooter: (typeof BlogBlocksAllowedInFooter)[K];
    defaultMetadata: (appName: string, appId: string) => Record<string, any>;
  };
};

export const BlogBlocks = Object.fromEntries(
  Object.entries(BlogBlocksSchema).map(([key, schema]) => [
    key,
    {
      schema,
      editor: BlogEditors[key as keyof typeof BlogBlocksSchema],
      allowedInFooter:
        BlogBlocksAllowedInFooter[key as keyof typeof BlogBlocksSchema],
      defaultMetadata: BlogBlocksDefaultMetadata,
    },
  ]),
) as BlogBlocksType;
