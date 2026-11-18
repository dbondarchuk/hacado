import type { AppAIToolDefinition, ConnectedAppData } from "@hacado/types/apps";
import type { BlogRepositoryService } from "../service/repository-service";
import {
  formatBlogPostsForAiCorpus,
  renderBlogAiCorpusMarkdown,
} from "./corpus";

export const BLOG_AI_TOOL_DEFINITIONS: AppAIToolDefinition[] = [
  {
    name: "get_existing_posts",
    description:
      "Load recent published blog posts from this blog for voice/style reference. Prefer calling this when drafting or matching existing tone instead of inventing corpus. Optional excludePostId skips the post being edited.",
    ui: {
      label: "Loading existing posts…",
      labelKey: "app_blog_admin.ai.tools.loadingExistingPosts",
    },
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        excludePostId: { type: "string" },
        query: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];

export async function executeBlogAiTool(
  name: string,
  args: Record<string, unknown>,
  input: {
    appData: ConnectedAppData;
    repositoryService: BlogRepositoryService;
  },
): Promise<unknown> {
  if (name !== "get_existing_posts") {
    return { error: `Unknown blog AI tool: ${name}` };
  }

  const limit = Math.min(12, Math.max(1, Math.floor(Number(args.limit) || 6)));

  const excludePostId =
    typeof args.excludePostId === "string" ? args.excludePostId : undefined;

  const query = typeof args.query === "string" ? args.query.trim() : "";

  const recent = await input.repositoryService.getBlogPosts({
    isPublished: true,
    limit: Math.max(limit, 8),
    offset: 0,
    search: query || undefined,
    sort: [{ id: "publicationDate", desc: true }],
  });

  const corpus = formatBlogPostsForAiCorpus(recent.items, {
    excludePostId,
    limit,
  });

  return {
    available: true,
    posts: corpus,
    markdown: renderBlogAiCorpusMarkdown(corpus),
    hint: corpus.length
      ? "Match voice and tag patterns; do not copy wording."
      : "No existing posts available for style reference.",
  };
}
