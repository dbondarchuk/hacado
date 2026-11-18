import * as z from "zod";

/** Admin fetch JSON revives ISO strings to Date — normalize back to string. */
const blogAiPublicationDateSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  return value;
}, z.string().optional());

/** Structured model output for blog post AI proposals. */
export const blogAiProposalSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  slug: z.string().min(1).max(256).optional(),
  tags: z.array(z.string().min(2).max(64)).max(20).optional(),
  contentMarkdown: z.string().optional(),
  publicationDate: blogAiPublicationDateSchema,
  isPublished: z.boolean().optional(),
  featuredImageQuery: z.string().min(1).max(200).optional(),
  summary: z.string().max(500).optional(),
});

export type BlogAiProposal = z.infer<typeof blogAiProposalSchema>;

export function parseBlogAiProposalText(text: string): BlogAiProposal {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const raw = (fenced?.[1] ?? trimmed).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error("blog_ai_invalid_json");
    }

    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  return blogAiProposalSchema.parse(parsed);
}

/** Normalize a process-API response (dates may already be revived). */
export function normalizeBlogAiProposal(value: unknown): BlogAiProposal {
  return blogAiProposalSchema.parse(value);
}
