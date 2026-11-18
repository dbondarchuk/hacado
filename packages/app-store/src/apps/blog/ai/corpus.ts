import type { BlogPost } from "../models";

export type BlogAiCorpusEntry = {
  title: string;
  slug: string;
  tags: string[];
  excerpt: string;
};

const EXCERPT_MAX = 500;

/** Walk Plate / loose JSON nodes into plain text for corpus excerpts. */
export function plateValueToPlainText(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    return value
      .map((node) => plateValueToPlainText(node))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (typeof value === "object") {
    const node = value as Record<string, unknown>;

    if (typeof node.text === "string") {
      return node.text;
    }

    if (Array.isArray(node.children)) {
      return plateValueToPlainText(node.children);
    }
  }

  return "";
}

function truncate(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;

  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function formatBlogPostsForAiCorpus(
  posts: BlogPost[],
  options?: { excludePostId?: string; limit?: number },
): BlogAiCorpusEntry[] {
  const limit = options?.limit ?? 6;
  const exclude = options?.excludePostId;

  return posts
    .filter((post) => !exclude || post._id !== exclude)
    .slice(0, limit)
    .map((post) => ({
      title: post.title,
      slug: post.slug,
      tags: post.tags ?? [],
      excerpt: truncate(plateValueToPlainText(post.content), EXCERPT_MAX),
    }));
}

export function renderBlogAiCorpusMarkdown(
  entries: BlogAiCorpusEntry[],
): string {
  if (!entries.length) {
    return "No existing posts available for style reference.";
  }

  return entries
    .map((entry, index) => {
      const tags = entry.tags.length ? entry.tags.join(", ") : "(none)";

      return [
        `### Post ${index + 1}`,
        `Title: ${entry.title}`,
        `Slug: ${entry.slug}`,
        `Tags: ${tags}`,
        `Excerpt: ${entry.excerpt || "(empty)"}`,
      ].join("\n");
    })
    .join("\n\n");
}
