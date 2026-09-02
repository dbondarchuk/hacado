import type { I18nFn, Language } from "@hacado/i18n";
import { AppsBlocksEditors } from "../../../blocks/editors";
import { AppsBlocksReaders } from "../../../blocks/readers";
import type { TemplatePreviewProvider } from "../../../template-previews/types";
import { BLOG_APP_NAME } from "../const";
import { BlogTranslations } from "../translations";
import { blogCommentFixtures } from "./comment-fixtures";
import { blogPostsListFixtures } from "./fixtures";
import { BLOG_TEMPLATE_PREVIEWS } from "./preview-manifest";
import { BlogTemplates } from "./templates";

const PREVIEW_APP_ID = "preview";
const PREVIEW_POST = blogPostsListFixtures[0];
const blogTemplates = BlogTemplates(BLOG_APP_NAME, PREVIEW_APP_ID);

export function getBlogTemplatePreviewArgs(): Record<string, unknown> {
  return {
    post: PREVIEW_POST,
    posts: blogPostsListFixtures,
    postLink: `/blog/${PREVIEW_POST.slug}`,
    blogAppId: PREVIEW_APP_ID,
    page: 1,
    totalPosts: blogPostsListFixtures.length,
    postsPerPage: 10,
    commentsPerPage: 10,
    totalComments: blogCommentFixtures.length,
    comments: blogCommentFixtures,
    blogCommentsConfig: {
      commentsEnabled: true,
      commentsPremoderation: true,
    },
    path: "/blog",
    searchParams: {},
  };
}

export function getBlogTemplatePreviewBlockRegistry() {
  const blogBlocks = AppsBlocksEditors[BLOG_APP_NAME] ?? {};
  const blogReaders = AppsBlocksReaders[BLOG_APP_NAME] ?? {};

  return {
    providers: [
      {
        providerName: BLOG_APP_NAME,
        priority: 100,
        blocks: Object.fromEntries(
          Object.entries(blogBlocks).map(([name, value]) => [
            name,
            {
              schema: value.schema,
              editor: {
                ...value.editor,
                defaultMetadata: value.defaultMetadata?.(
                  BLOG_APP_NAME,
                  PREVIEW_APP_ID,
                ),
              },
              reader: blogReaders[name],
            },
          ]),
        ),
      },
    ],
  };
}

export const BlogTemplatePreviewProvider: TemplatePreviewProvider = {
  sourceId: BLOG_APP_NAME,
  entries: BLOG_TEMPLATE_PREVIEWS,
  resolveBlock: (key: string, t: I18nFn<undefined, undefined>) => {
    const template = blogTemplates[key as keyof typeof blogTemplates];
    if (!template) return null;
    return template.getBlock(t);
  },
  getPreviewArgs: getBlogTemplatePreviewArgs,
  getBlockRegistry: getBlogTemplatePreviewBlockRegistry,
  getTranslations: async (language: Language) => {
    return await BlogTranslations.public(language);
  },
};
