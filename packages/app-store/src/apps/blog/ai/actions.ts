import type { BlogAdminKeys } from "../translations/types";

export type BlogAiActionId =
  | "generate_post"
  | "rewrite_body"
  | "improve_clarity"
  | "shorten"
  | "expand"
  | "suggest_title"
  | "suggest_tags"
  | "suggest_slug"
  | "suggest_publish_meta"
  | "suggest_featured_image"
  | "custom_instruction";

export type BlogAiAction = {
  id: BlogAiActionId;
  labelKey: BlogAdminKeys;
  /** Default user-facing instruction when no custom text is provided. */
  message: string;
};

export const BLOG_AI_ACTIONS: BlogAiAction[] = [
  {
    id: "generate_post",
    labelKey: "ai.actions.generatePost",
    message:
      "Write a complete blog post draft with title, slug, tags, body, publish meta, and a featured image search query.",
  },
  {
    id: "rewrite_body",
    labelKey: "ai.actions.rewriteBody",
    message: "Rewrite the blog post body while keeping the same meaning.",
  },
  {
    id: "improve_clarity",
    labelKey: "ai.actions.improveClarity",
    message: "Improve clarity of the blog post body.",
  },
  {
    id: "shorten",
    labelKey: "ai.actions.shorten",
    message: "Shorten the blog post body.",
  },
  {
    id: "expand",
    labelKey: "ai.actions.expand",
    message: "Expand the blog post body with useful detail.",
  },
  {
    id: "suggest_title",
    labelKey: "ai.actions.suggestTitle",
    message: "Suggest a better title for this blog post.",
  },
  {
    id: "suggest_tags",
    labelKey: "ai.actions.suggestTags",
    message: "Suggest tags for this blog post.",
  },
  {
    id: "suggest_slug",
    labelKey: "ai.actions.suggestSlug",
    message: "Suggest a URL slug for this blog post.",
  },
  {
    id: "suggest_publish_meta",
    labelKey: "ai.actions.suggestPublishMeta",
    message: "Suggest publication date and published/draft status.",
  },
  {
    id: "suggest_featured_image",
    labelKey: "ai.actions.suggestFeaturedImage",
    message: "Suggest a featured image search query for this blog post.",
  },
  {
    id: "custom_instruction",
    labelKey: "ai.actions.customInstruction",
    message: "Follow the user's custom instruction for this blog post.",
  },
];

export function getBlogAiAction(actionId: string): BlogAiAction | undefined {
  return BLOG_AI_ACTIONS.find((action) => action.id === actionId);
}
