import {
  generateId as generateBlockId,
  generateId,
  generateId as generateLinkId,
  TEditorBlock,
  TemplatesConfiguration,
} from "@hacado/builder";
import { AllKeys, I18nFn } from "@hacado/i18n";
import { TEXT_SIZE_PRESETS } from "@hacado/page-builder-base";
import { COLORS } from "@hacado/page-builder-base/style";
import {
  ArrowLeftRight,
  CalendarClock,
  FileText,
  Heading,
  Image as ImageIcon,
  Link as LinkIcon,
  ListOrdered,
  Tag,
} from "lucide-react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  BlogPublicAllKeys,
} from "../translations/types";
import { BlogCommentAuthorPropsDefaults } from "./comment-author/schema";
import { BlogCommentBodyPropsDefaults } from "./comment-body/schema";
import { BlogCommentContainerPropsDefaults } from "./comment-container/schema";
import { BlogCommentDatePropsDefaults } from "./comment-date/schema";
import { BlogCommentNavigationButtonPropsDefaults } from "./comment-navigation-button/schema";
import { BlogCommentsContainerPropsDefaults } from "./comments-container/schema";
import { BlogPostAuthorPropsDefaults } from "./post-author/schema";
import { BlogPostCommentCountPropsDefaults } from "./post-comment-count/schema";
import { BlogPostCommentFormPropsDefaults } from "./post-comment-form/schema";
import { BlogPostContainerPropsDefaults } from "./post-container/schema";
import {
  BlogPostContentPropsDefaults,
  BlogPostShortContentProps,
} from "./post-content/schema";
import { BlogPostNavigationButtonPropsDefaults } from "./post-navigation-button/schema";
import { BlogPostPublishDatePropsDefaults } from "./post-publish-date/schema";
import { BlogPostReadTimePropsDefaults } from "./post-read-time/schema";
import { BlogPostTagPropsDefaults } from "./post-tag/schema";
import { BlogPostTitlePropsDefaults } from "./post-title/schema";
import { BlogPostsContainerPropsDefaults } from "./posts-container/schema";
import { getBlogPostReadMoreLinkBlock } from "./read-more-link-block";

// Define InlineContainerPropsDefaults inline to avoid import issues
const InlineContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 0, unit: "rem" },
          bottom: { value: 0, unit: "rem" },
          left: { value: 0, unit: "rem" },
          right: { value: 0, unit: "rem" },
        },
      },
    ],
    display: [
      {
        value: "inline-flex",
      },
    ],
    flexDirection: [
      {
        value: "row",
      },
    ],
    alignItems: [
      {
        value: "center",
      },
    ],
    justifyContent: [
      {
        value: "center",
      },
    ],
    gap: [
      {
        value: {
          value: 0.5,
          unit: "rem",
        },
      },
    ],
  },
  props: {
    children: [],
  },
};

const BlogPostFeaturedImagePropsDefaults = (withLink: boolean = false) =>
  ({
    props: {
      src: "{{post.featuredImage}}",
      alt: "{{post.title}}",
      linkHref: withLink ? "{{postLink}}" : null,
    },
    style: {
      textAlign: [
        {
          value: "center",
        },
      ],
      objectFit: [
        {
          value: "cover",
        },
      ],
      objectPosition: [
        {
          value: { x: 50, y: 50 },
        },
      ],
      maxWidth: [
        {
          value: {
            value: 100,
            unit: "%",
          },
        },
      ],
      display: [
        {
          value: "block",
        },
      ],
    },
  }) as const;

const getBlogPostFeaturedImageBlock = (
  withLink: boolean = false,
): TEditorBlock => {
  const imageId = generateId();
  return {
    type: "ConditionalContainer",
    id: generateId(),
    data: {
      props: {
        condition: "post.featuredImage",
        then: {
          children: [
            {
              type: "Image",
              id: imageId,
              data: BlogPostFeaturedImagePropsDefaults(withLink),
            },
          ],
        },
        otherwise: {
          children: [],
        },
      },
    },
  };
};

const getLinkPropsDefaults = () => ({
  props: {
    url: "/",
    target: "_self",
    children: [
      {
        type: "InlineContainer",
        id: generateLinkId(),
        data: {
          style: {
            ...InlineContainerPropsDefaults.style,
            textDecoration: [
              {
                value: "underline",
              },
            ],
          },
          props: {
            children: [
              {
                type: "InlineText",
                id: generateLinkId(),
                data: {
                  props: {
                    text: "Link",
                  },
                },
              },
            ],
          },
        },
      },
    ],
  },
  style: {
    color: [
      {
        value: COLORS["primary"].value,
      },
    ],
    fontSize: [
      {
        value: {
          value: 1,
          unit: "rem",
        },
      },
    ],
    fontWeight: [
      {
        value: "normal",
      },
    ],
    textAlign: [
      {
        value: "left",
      },
    ],
    display: [
      {
        value: "inline",
      },
    ],
    transition: [
      {
        value: "color 0.2s ease",
      },
    ],
  },
});

// Defaults for ForeachContainer
const ForeachContainerPropsDefaults = {
  props: {
    value: "",
    children: [],
  },
  style: {
    display: [
      {
        value: "flex",
      },
    ],
    flexDirection: [
      {
        value: "column",
      },
    ],
    width: [
      {
        value: { value: 100, unit: "%" },
      },
    ],
    gap: [
      {
        value: {
          value: 0.5,
          unit: "rem",
        },
      },
    ],
  },
};

// Defaults for InlineContainer style
const inlineContainerStyle = {
  padding: [
    {
      value: {
        top: { value: 0, unit: "rem" },
        bottom: { value: 0, unit: "rem" },
        left: { value: 0, unit: "rem" },
        right: { value: 0, unit: "rem" },
      },
    },
  ],
  display: [
    {
      value: "inline-flex",
    },
  ],
  flexDirection: [
    {
      value: "row",
    },
  ],
  alignItems: [
    {
      value: "center",
    },
  ],
  justifyContent: [
    {
      value: "center",
    },
  ],
  gap: [
    {
      value: {
        value: 0.5,
        unit: "rem",
      },
    },
  ],
};

const smTextPreset = TEXT_SIZE_PRESETS.find((preset) => preset.key === "sm")!;

const postMetaInlineContainerStyle = {
  ...inlineContainerStyle,
  fontSize: [{ value: smTextPreset.fontSize }],
  lineHeight: [{ value: smTextPreset.lineHeight }],
  justifyContent: [
    {
      value: "flex-start",
    },
  ],
};

const createPostMetaSeparator = (id: string) => ({
  type: "InlineText" as const,
  id,
  data: {
    props: {
      text: "|",
    },
    style: {},
  },
});

const createPostMetaInlineContainer = ({
  containerId,
  authorId,
  publishDateSeparatorId,
  publishDateId,
  readTimeSeparatorId,
  readTimeId,
  commentCountSeparatorId,
  commentCountId,
}: {
  containerId: string;
  authorId: string;
  publishDateSeparatorId: string;
  publishDateId: string;
  readTimeSeparatorId: string;
  readTimeId: string;
  commentCountSeparatorId: string;
  commentCountId: string;
}) => ({
  type: "InlineContainer" as const,
  id: containerId,
  data: {
    style: postMetaInlineContainerStyle,
    props: {
      children: [
        {
          type: "BlogPostAuthor" as const,
          id: authorId,
          data: BlogPostAuthorPropsDefaults,
        },
        createPostMetaSeparator(publishDateSeparatorId),
        {
          type: "BlogPostPublishDate" as const,
          id: publishDateId,
          data: BlogPostPublishDatePropsDefaults,
        },
        createPostMetaSeparator(readTimeSeparatorId),
        {
          type: "BlogPostReadTime" as const,
          id: readTimeId,
          data: BlogPostReadTimePropsDefaults,
        },
        createPostMetaSeparator(commentCountSeparatorId),
        {
          type: "BlogPostCommentCount" as const,
          id: commentCountId,
          data: BlogPostCommentCountPropsDefaults,
        },
      ],
    },
  },
});

const getPostMetaBlock = (): TEditorBlock =>
  createPostMetaInlineContainer({
    containerId: generateId(),
    authorId: generateId(),
    publishDateSeparatorId: generateId(),
    publishDateId: generateId(),
    readTimeSeparatorId: generateId(),
    readTimeId: generateId(),
    commentCountSeparatorId: generateId(),
    commentCountId: generateId(),
  }) as TEditorBlock;

// Defaults for Heading
const getHeadingPropsDefaults = (isPostPage?: boolean) => ({
  props: {
    level: isPostPage ? "h1" : ("h2" as const),
    children: [
      {
        type: "InlineContainer",
        id: generateBlockId(),
        data: {
          style: inlineContainerStyle,
          props: {
            children: [],
          },
        },
      },
    ],
  },
  style: {
    textAlign: [
      {
        value: !isPostPage ? "left" : "center",
      },
    ],
    fontWeight: [
      {
        value: "bold",
      },
    ],
    fontFamily: [
      {
        value: "SECONDARY",
      },
    ],
  },
});

const createSectionHeading = (
  t: I18nFn<undefined, undefined>,
  level: "h3" | "h4",
  textKey: BlogPublicAllKeys,
): TEditorBlock => ({
  type: "Heading",
  id: generateId(),
  data: {
    ...getHeadingPropsDefaults(true),
    props: {
      level,
      children: [
        {
          type: "InlineContainer",
          id: generateId(),
          data: {
            style: inlineContainerStyle,
            props: {
              children: [
                {
                  type: "InlineText",
                  id: generateId(),
                  data: {
                    props: { text: t(textKey) },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  },
});

const buildBlogCommentsContainerBlock = (
  appName: string,
  appId: string,
): TEditorBlock => {
  const commentsContainerId = generateId();
  const foreachId = generateId();
  const commentContainerId = generateId();
  const authorId = generateId();
  const dateId = generateId();
  const bodyId = generateId();
  const navigationContainerId = generateId();
  const prevButtonId = generateId();
  const nextButtonId = generateId();

  return {
    id: commentsContainerId,
    type: "BlogCommentsContainer",
    metadata: {
      blogAppName: appName,
      blogAppId: appId,
    },
    data: {
      ...BlogCommentsContainerPropsDefaults,
      props: {
        ...BlogCommentsContainerPropsDefaults.props,
        children: [
          {
            id: foreachId,
            type: "ForeachContainer",
            data: {
              ...ForeachContainerPropsDefaults,
              props: {
                value: "comments",
                itemName: "comment",
                children: [
                  {
                    id: commentContainerId,
                    type: "BlogCommentContainer",
                    data: {
                      ...BlogCommentContainerPropsDefaults,
                      props: {
                        children: [
                          {
                            type: "BlogCommentAuthor",
                            id: authorId,
                            data: BlogCommentAuthorPropsDefaults,
                          },
                          {
                            type: "BlogCommentDate",
                            id: dateId,
                            data: BlogCommentDatePropsDefaults,
                          },
                          {
                            type: "BlogCommentBody",
                            id: bodyId,
                            data: BlogCommentBodyPropsDefaults,
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            id: navigationContainerId,
            type: "Container",
            data: {
              style: {
                display: [{ value: "flex" }],
                flexDirection: [{ value: "row" }],
                justifyContent: [{ value: "space-between" }],
                width: [{ value: { value: 100, unit: "%" } }],
                padding: [
                  {
                    value: {
                      top: { value: 0.5, unit: "rem" },
                      bottom: { value: 0, unit: "rem" },
                      left: { value: 0, unit: "rem" },
                      right: { value: 0, unit: "rem" },
                    },
                  },
                ],
              },
              props: {
                children: [
                  {
                    type: "BlogCommentNavigationButton",
                    id: prevButtonId,
                    data: {
                      ...BlogCommentNavigationButtonPropsDefaults,
                      props: { direction: "prev" },
                    },
                  },
                  {
                    type: "BlogCommentNavigationButton",
                    id: nextButtonId,
                    data: {
                      ...BlogCommentNavigationButtonPropsDefaults,
                      props: { direction: "next" },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
};

export const BlogTemplates: (
  appName: string,
  appId: string,
) => TemplatesConfiguration = (appName: string, appId: string) => ({
  PostFeaturedImage: {
    displayName:
      "app_blog_admin.block.templates.postFeaturedImage.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <ImageIcon />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (): TEditorBlock => getBlogPostFeaturedImageBlock(true),
  },
  PostReadMore: {
    displayName:
      "app_blog_admin.block.templates.postReadMore.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <LinkIcon />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (t): TEditorBlock =>
      getBlogPostReadMoreLinkBlock(
        t("app_blog_public.readMore" satisfies BlogPublicAllKeys),
      ),
  },
  PostTitleHeader: {
    displayName:
      "app_blog_admin.block.templates.postTitleHeader.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <Heading />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (): TEditorBlock => {
      const titleId = generateId();
      return {
        id: generateLinkId(),
        type: "Heading",
        data: {
          ...getHeadingPropsDefaults(),
          props: {
            ...getHeadingPropsDefaults().props,
            children: [
              {
                type: "BlogPostTitle",
                id: titleId,
                data: BlogPostTitlePropsDefaults,
              },
            ],
          },
        },
      };
    },
  },
  PostTags: {
    displayName:
      "app_blog_admin.block.templates.postTags.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <Tag />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (): TEditorBlock => {
      const foreachId = generateId();
      const tagId = generateId();
      return {
        id: foreachId,
        type: "ForeachContainer",
        data: {
          ...ForeachContainerPropsDefaults,
          props: {
            value: "post.tags",
            itemName: "tag",
            children: [
              {
                type: "BlogPostTag",
                id: tagId,
                data: BlogPostTagPropsDefaults,
              },
            ],
          },
          style: {
            ...ForeachContainerPropsDefaults.style,
            flexDirection: [
              {
                value: "row",
              },
            ],
            flexWrap: [
              {
                value: "wrap",
              },
            ],
          },
        },
      };
    },
  },
  PostMeta: {
    displayName:
      "app_blog_admin.block.templates.postMeta.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <CalendarClock />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (): TEditorBlock => getPostMetaBlock(),
  },
  BlogPost: {
    displayName:
      "app_blog_admin.block.templates.post.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <FileText />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (t): TEditorBlock => {
      const containerId = generateId();
      const titleHeaderId = generateId();
      const titleId = generateId();
      const contentId = generateId();
      const commentFormId = generateId();
      const foreachId = generateId();
      const tagId = generateId();

      return {
        id: containerId,
        type: "BlogPostContainer",
        metadata: {
          blogAppName: appName,
          blogAppId: appId,
        },
        data: {
          ...BlogPostContainerPropsDefaults,
          props: {
            children: [
              {
                type: "Heading",
                id: generateLinkId(),
                data: {
                  ...getHeadingPropsDefaults(true),
                  props: {
                    ...getHeadingPropsDefaults(true).props,
                    children: [
                      {
                        type: "BlogPostTitle",
                        id: titleId,
                        data: BlogPostTitlePropsDefaults,
                      },
                    ],
                  },
                },
              },
              getPostMetaBlock(),
              getBlogPostFeaturedImageBlock(),
              {
                type: "BlogPostContent",
                id: contentId,
                data: BlogPostContentPropsDefaults,
              },
              createSectionHeading(
                t,
                "h3",
                "app_blog_public.block.postCommentsList.heading" satisfies BlogPublicAllKeys,
              ),
              buildBlogCommentsContainerBlock(appName, appId),
              createSectionHeading(
                t,
                "h4",
                "app_blog_public.block.postCommentForm.addText" satisfies BlogPublicAllKeys,
              ),
              {
                type: "BlogPostCommentForm",
                id: commentFormId,
                data: BlogPostCommentFormPropsDefaults,
              },
              {
                id: foreachId,
                type: "ForeachContainer",
                data: {
                  ...ForeachContainerPropsDefaults,
                  props: {
                    value: "post.tags",
                    itemName: "tag",
                    children: [
                      {
                        type: "BlogPostTag",
                        id: tagId,
                        data: {
                          ...BlogPostTagPropsDefaults,
                          props: {
                            ...BlogPostTagPropsDefaults.props,
                            blogListUrl: "/blog",
                          },
                        },
                      },
                    ],
                  },
                  style: {
                    ...ForeachContainerPropsDefaults.style,
                    flexDirection: [
                      {
                        value: "row",
                      },
                    ],
                    flexWrap: [
                      {
                        value: "wrap",
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };
    },
  },
  CommentsListNavigation: {
    displayName:
      "app_blog_admin.block.templates.commentsListNavigation.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <ArrowLeftRight />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (): TEditorBlock => {
      const containerId = generateId();
      const prevButtonId = generateId();
      const nextButtonId = generateId();

      return {
        id: containerId,
        type: "Container",
        data: {
          style: {
            display: [{ value: "flex" }],
            flexDirection: [{ value: "row" }],
            justifyContent: [{ value: "space-between" }],
            width: [{ value: { value: 100, unit: "%" } }],
            padding: [
              {
                value: {
                  top: { value: 1, unit: "rem" },
                  bottom: { value: 1, unit: "rem" },
                  left: { value: 0, unit: "rem" },
                  right: { value: 0, unit: "rem" },
                },
              },
            ],
          },
          props: {
            children: [
              {
                type: "BlogCommentNavigationButton",
                id: prevButtonId,
                data: {
                  ...BlogCommentNavigationButtonPropsDefaults,
                  props: { direction: "prev" },
                },
              },
              {
                type: "BlogCommentNavigationButton",
                id: nextButtonId,
                data: {
                  ...BlogCommentNavigationButtonPropsDefaults,
                  props: { direction: "next" },
                },
              },
            ],
          },
        },
      };
    },
  },
  BlogCommentsList: {
    displayName:
      "app_blog_admin.block.templates.commentsList.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <ListOrdered />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (): TEditorBlock =>
      buildBlogCommentsContainerBlock(appName, appId),
  },
  PostsListNavigation: {
    displayName:
      "app_blog_admin.block.templates.postsListNavigation.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <ArrowLeftRight />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (): TEditorBlock => {
      const containerId = generateId();
      const prevButtonId = generateId();
      const nextButtonId = generateId();

      return {
        id: containerId,
        type: "Container",
        data: {
          style: {
            display: [
              {
                value: "flex",
              },
            ],
            flexDirection: [
              {
                value: "row",
              },
            ],
            justifyContent: [
              {
                value: "space-between",
              },
            ],
            width: [
              {
                value: { value: 100, unit: "%" },
              },
            ],
            padding: [
              {
                value: {
                  top: { value: 1, unit: "rem" },
                  bottom: { value: 1, unit: "rem" },
                  left: { value: 0, unit: "rem" },
                  right: { value: 0, unit: "rem" },
                },
              },
            ],
          },
          props: {
            children: [
              {
                type: "BlogPostNavigationButton",
                id: prevButtonId,
                data: {
                  ...BlogPostNavigationButtonPropsDefaults,
                  props: {
                    direction: "prev",
                  },
                },
              },
              {
                type: "BlogPostNavigationButton",
                id: nextButtonId,
                data: {
                  ...BlogPostNavigationButtonPropsDefaults,
                  props: {
                    direction: "next",
                  },
                },
              },
            ],
          },
        },
      };
    },
  },
  BlogPostsList: {
    displayName:
      "app_blog_admin.block.templates.postsList.displayName" satisfies AllKeys<
        BlogAdminNamespace,
        BlogAdminKeys
      >,
    icon: <ListOrdered />,
    category: "app_blog_admin.block.category.blog" satisfies AllKeys<
      BlogAdminNamespace,
      BlogAdminKeys
    >,
    getBlock: (t): TEditorBlock => {
      const postsContainerId = generateId();
      const foreachId = generateId();
      const blogPostId = generateId();
      const blogPostContainerId = generateId();
      const titleHeaderId = generateId();
      const titleId = generateId();
      const contentId = generateId();
      const readMoreId = generateId();
      const tagsForeachId = generateId();
      const tagId = generateId();
      const navigationContainerId = generateId();
      const prevButtonId = generateId();
      const nextButtonId = generateId();

      return {
        id: postsContainerId,
        type: "BlogPostsContainer",
        metadata: {
          blogAppName: appName,
          blogAppId: appId,
        },
        data: {
          ...BlogPostsContainerPropsDefaults,
          props: {
            children: [
              {
                id: foreachId,
                type: "ForeachContainer",
                data: {
                  ...ForeachContainerPropsDefaults,
                  props: {
                    value: "posts",
                    itemName: "post",
                    children: [
                      {
                        id: blogPostId,
                        type: "BlogPostContainer",
                        data: {
                          ...BlogPostContainerPropsDefaults,
                          props: {
                            ...BlogPostContainerPropsDefaults.props,
                            children: [
                              {
                                id: titleHeaderId,
                                type: "Link",
                                data: {
                                  ...getLinkPropsDefaults(),
                                  props: {
                                    ...getLinkPropsDefaults().props,
                                    url: "{{postLink}}",
                                    children: [
                                      {
                                        type: "Heading",
                                        id: generateLinkId(),
                                        data: {
                                          ...getHeadingPropsDefaults(),
                                          props: {
                                            ...getHeadingPropsDefaults().props,
                                            children: [
                                              {
                                                type: "BlogPostTitle",
                                                id: titleId,
                                                data: BlogPostTitlePropsDefaults,
                                              },
                                            ],
                                          },
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              getPostMetaBlock(),
                              getBlogPostFeaturedImageBlock(true),
                              {
                                type: "BlogPostContent",
                                id: contentId,
                                data: {
                                  ...BlogPostContentPropsDefaults,
                                  props: {
                                    ...BlogPostContentPropsDefaults.props,
                                    ...BlogPostShortContentProps,
                                  },
                                },
                              },
                              {
                                ...getBlogPostReadMoreLinkBlock(
                                  t(
                                    "app_blog_public.readMore" satisfies BlogPublicAllKeys,
                                  ),
                                ),
                                id: readMoreId,
                              },
                              {
                                id: tagsForeachId,
                                type: "ForeachContainer",
                                data: {
                                  ...ForeachContainerPropsDefaults,
                                  props: {
                                    value: "post.tags",
                                    itemName: "tag",
                                    children: [
                                      {
                                        type: "BlogPostTag",
                                        id: tagId,
                                        data: BlogPostTagPropsDefaults,
                                      },
                                    ],
                                  },
                                  style: {
                                    ...ForeachContainerPropsDefaults.style,
                                    flexDirection: [
                                      {
                                        value: "row",
                                      },
                                    ],
                                    flexWrap: [
                                      {
                                        value: "wrap",
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
              {
                id: navigationContainerId,
                type: "Container",
                data: {
                  style: {
                    display: [
                      {
                        value: "flex",
                      },
                    ],
                    flexDirection: [
                      {
                        value: "row",
                      },
                    ],
                    justifyContent: [
                      {
                        value: "space-between",
                      },
                    ],
                    width: [
                      {
                        value: { value: 100, unit: "%" },
                      },
                    ],
                    padding: [
                      {
                        value: {
                          top: { value: 1, unit: "rem" },
                          bottom: { value: 1, unit: "rem" },
                          left: { value: 0, unit: "rem" },
                          right: { value: 0, unit: "rem" },
                        },
                      },
                    ],
                  },
                  props: {
                    children: [
                      {
                        type: "BlogPostNavigationButton",
                        id: prevButtonId,
                        data: {
                          ...BlogPostNavigationButtonPropsDefaults,
                          props: {
                            direction: "prev",
                          },
                        },
                      },
                      {
                        type: "BlogPostNavigationButton",
                        id: nextButtonId,
                        data: {
                          ...BlogPostNavigationButtonPropsDefaults,
                          props: {
                            direction: "next",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };
    },
  },
});
