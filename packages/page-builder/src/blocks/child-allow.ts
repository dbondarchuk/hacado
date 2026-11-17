import type { BlockFilterRule } from "@hacado/builder/types";

/** Child filter used by Heading, Button, Link, InlineContainer, etc. */
export const INLINE_CHILDREN_ALLOW = {
  capabilities: ["inline"],
} as const satisfies BlockFilterRule;
