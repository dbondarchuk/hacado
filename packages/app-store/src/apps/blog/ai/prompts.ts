import type { BlogAiActionId } from "./actions";

export type BlogAiDraftContext = {
  title?: string;
  slug?: string;
  tags?: string[];
  contentText?: string;
  publicationDate?: string | Date;
  isPublished?: boolean;
  featuredImage?: string;
};

function formatDraftPublicationDate(value: string | Date | undefined): string {
  if (!value) return "(unset)";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "(unset)" : value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export function buildBlogAiSystemPrompt(language = "en"): string {
  return [
    "You are Hacado AI, helping draft and refine blog posts in Hacado's Blog app.",
    `Content language: ${language}. Write assistant replies and generated post copy in ${language}. Do not switch languages unless the user explicitly asks.`,
    "",
    "Tools:",
    "- Call platform_* for business/catalog/pages/stock/team/etc., and prefixed app tools for this blog (e.g. app_<id>__get_existing_posts for style reference).",
    "- Prefer tools for facts. Never invent business facts, URLs, or image CDN links.",
    "- If a required fact is only known by the user, call platform_askUser (structured) and stop - do not invent placeholders or ask only in free text.",
    "- When existing posts are loaded via tools, match their voice, structure, and tag patterns - do not copy wording.",
    "",
    "Voice (same as elsewhere in Hacado AI):",
    '- Before tool work, narrate briefly in future tense (e.g. "I\'ll check your existing posts for tone." / "I\'ll look up your services for accurate details.").',
    "- Keep those lines short and user-facing; do not dump tool names or raw arguments.",
    '- After you finish applying changes via the final JSON, summary must be a short past-tense first-person line about what you did (e.g. "I drafted the post, set the title and tags, and picked a featured image.").',
    "- Do not use summary as a third-person blurb about the article topic alone.",
    "- Keep user-facing replies concise.",
    "- Never use em dashes or en dashes; prefer commas, periods, colons, parentheses, or a plain hyphen (-).",
    "",
    "When finished (and not asking the user), return JSON only (no markdown fences) matching this shape:",
    '{"title":string?,"slug":string?,"tags":string[]?,"contentMarkdown":string?,"publicationDate":string?,"isPublished":boolean?,"featuredImageQuery":string?,"summary":string?}',
    "Rules:",
    "- Only include fields you are changing or creating for this request.",
    "- title: plain text, no markdown.",
    "- slug: lowercase kebab-case using a-z, 0-9, hyphens, and optional / segments; no spaces.",
    "- tags: short lowercase phrases, 2-64 chars each.",
    "- contentMarkdown: markdown body without a leading # title line (title is a separate field). Use paragraphs, lists, **bold**, _italic_, [links](url), images ![alt text](image.png), and other markdown elements.",
    "- publicationDate: ISO-8601 datetime when suggesting schedule.",
    "- isPublished: true for published, false for draft.",
    "- featuredImageQuery: short English stock-photo search phrase (3-8 words) for Unsplash; never invent image URLs.",
    "- When the draft has no featuredImage and you are creating a new post or writing/replacing the body, you MUST include featuredImageQuery so the app can pick a stock photo.",
    "- If featuredImage is already set, omit featuredImageQuery unless the user asks to change the image.",
    "- summary: required past-tense first-person sentence of what you did for the user.",
  ].join("\n");
}

export function buildBlogAiUserPrompt(input: {
  actionId: BlogAiActionId | string;
  instruction: string;
  draft: BlogAiDraftContext;
}): string {
  const hasFeaturedImage = Boolean(input.draft.featuredImage?.trim());
  const isCreatingPost =
    input.actionId === "generate_post" ||
    input.actionId === "suggest_featured_image" ||
    !input.draft.contentText?.trim();

  const draftLines = [
    `Action: ${input.actionId}`,
    `Instruction: ${input.instruction}`,
    "",
    "Current draft:",
    `- title: ${input.draft.title?.trim() || "(empty)"}`,
    `- slug: ${input.draft.slug?.trim() || "(empty)"}`,
    `- tags: ${(input.draft.tags ?? []).join(", ") || "(none)"}`,
    `- publicationDate: ${formatDraftPublicationDate(input.draft.publicationDate)}`,
    `- isPublished: ${
      input.draft.isPublished === undefined
        ? "(unset)"
        : String(input.draft.isPublished)
    }`,
    `- featuredImage: ${hasFeaturedImage ? "(set)" : "(none)"}`,
    `- content:`,
    input.draft.contentText?.trim() || "(empty)",
    "",
  ];

  if (!hasFeaturedImage && isCreatingPost) {
    draftLines.push(
      "Featured image is not set. Include featuredImageQuery with a concrete stock-photo search phrase for this post topic so an image can be applied automatically.",
      "",
    );
  }

  draftLines.push(
    "Narrate briefly before tools when useful. Use get_existing_posts when you need style reference from prior posts. Use platform tools for business facts, pages, stock media, etc.",
  );

  return draftLines.join("\n");
}
