import type { AIToolDefinition, BuilderKind } from "../types";

const TEXT_MESSAGE_TOOL_NAMES = new Set([
  "getDocumentSettings",
  "getTemplateArgs",
  "proposeDocumentSettings",
]);

/** Builder/editor-only tools (platform tools come from @hacado/ai-tools). */
export const BUILDER_AI_TOOL_DEFINITIONS: AIToolDefinition[] = [
  {
    name: "searchBlocks",
    ui: {
      label: "Searching blocks…",
      labelKey: "builder.ai.tools.searchingBlocks",
    },
    description:
      "Search available blocks for the current builder. Returns lightweight metadata, not full schemas.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "getBlockSchemas",
    ui: {
      label: "Loading block schemas…",
      labelKey: "builder.ai.tools.loadingSchemas",
    },
    description:
      "Retrieve props schemas + defaultValue (+ defaultMetadata) for block types. Read prop JSON Schema description fields. Returns supportedStyles, allowedIn, and allowedChildren (nesting rules). Style value schemas are NOT inlined. Required before proposing props: use only schema fields + defaultValue shape - never invent aliases. Heading/Button children must follow allowedChildren (inline only - never nest Text). For style values call searchStyleProperties / getStyleSchema.",
    inputSchema: {
      type: "object",
      properties: {
        blockTypes: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["blockTypes"],
      additionalProperties: false,
    },
  },
  {
    name: "getBlockRelationships",
    ui: {
      label: "Checking block relationships…",
      labelKey: "builder.ai.tools.loadingRelationships",
    },
    description:
      'Retrieve parent/child hierarchy rules for block types: allowedIn (where the block may be placed) and allowedChildren (which child types/capabilities may nest under it). Heading/Button/Link only allow children with capability "inline" (InlineContainer, InlineText, Icon, …) - never Text.',
    inputSchema: {
      type: "object",
      properties: {
        blockTypes: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["blockTypes"],
      additionalProperties: false,
    },
  },
  {
    name: "searchStyleProperties",
    ui: {
      label: "Searching styles…",
      labelKey: "builder.ai.tools.searchingStyles",
    },
    description:
      "Search style property names for the current builder. Pass blockType to limit results to styles that block supports (from getBlockSchemas.supportedStyles).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        blockType: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "getStyleSchema",
    ui: {
      label: "Loading style schemas…",
      labelKey: "builder.ai.tools.loadingStyles",
    },
    description:
      'Retrieve JSON schemas for specific style properties (not returned by getBlockSchemas). Prefer names from getBlockSchemas.supportedStyles. Pass blockType to ensure the block supports them. Call before custom style overrides; values are variant arrays ({ value, breakpoint?, state? }[]), not bare CSS strings. breakpoint/state must be arrays of schema tokens (e.g. ["max-md"]), never strings like "mobile".',
    inputSchema: {
      type: "object",
      properties: {
        properties: {
          type: "array",
          items: { type: "string" },
        },
        blockType: { type: "string" },
      },
      required: ["properties"],
      additionalProperties: false,
    },
  },
  {
    name: "getDesignTokens",
    ui: {
      label: "Loading design tokens…",
      labelKey: "builder.ai.tools.loadingTokens",
    },
    description:
      'Retrieve allowed design tokens (color: var(--value-*-color); font: PRIMARY/SECONDARY/…). Call on create/design/redesign before inventing styles. Pair with platform_getBusinessProfile({ needs: ["branding"] }) for org-specific color/font choices - never invent hex or raw CSS font names when tokens exist.',
    inputSchema: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: { type: "string" },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "getDocumentStructure",
    ui: {
      label: "Inspecting the document…",
      labelKey: "builder.ai.tools.inspectingDocument",
    },
    description: "Retrieve a compact outline of the current document.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getSelectedBlocks",
    ui: {
      label: "Inspecting the selection…",
      labelKey: "builder.ai.tools.inspectingSelection",
    },
    description: "Retrieve the currently selected blocks and ancestors.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getBlocksByIds",
    ui: {
      label: "Loading blocks…",
      labelKey: "builder.ai.tools.loadingBlocks",
    },
    description:
      "Fetch full block payloads (including nested data) for specific ids from the document outline. Use after getDocumentStructure when cloning or editing an existing section.",
    inputSchema: {
      type: "object",
      properties: {
        blockIds: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["blockIds"],
      additionalProperties: false,
    },
  },
  {
    name: "cloneBlockForInsert",
    ui: {
      label: "Cloning a section…",
      labelKey: "builder.ai.tools.cloningBlock",
    },
    description:
      "Deep-clone a block subtree with fresh ids, ready for add-block. Returns parentBlockId and suggested sibling index (after the source). Prefer this over inventing section trees from schemas when mirroring an existing section (e.g. services → addons).",
    inputSchema: {
      type: "object",
      properties: {
        blockId: { type: "string" },
      },
      required: ["blockId"],
      additionalProperties: false,
    },
  },
  {
    name: "getDocumentSettings",
    ui: {
      label: "Loading document settings…",
      labelKey: "builder.ai.tools.loadingSettings",
    },
    description:
      "Retrieve host-form document settings (page title/slug/description/keywords/headerId/footerId, email name/subject, text-message name/value, footer name). For available headers/footers call platform_listPageChrome. Not preloaded in context.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getTemplateArgs",
    ui: {
      label: "Loading template variables…",
      labelKey: "builder.ai.tools.loadingTemplateArgs",
    },
    description:
      "Retrieve Mustache template argument roots/paths and sample preview values for the current document (includes installed-app extras like waitlistEntry when present). Formatted Date/DateTime values are listed once as a root path; use formatting.dateTime keys (sms, short, full, date, time, ...) in Mustache, e.g. {{dateTime.sms}}. Link vars may include websiteUrl, manageLink, bookingUrl, leaveWaitlistUrl, paymentLinkUrl - prefer those over asking the user for URLs. Call when writing dynamic email/page/text-message copy.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "searchDesignPatterns",
    ui: {
      label: "Searching design patterns…",
      labelKey: "builder.ai.tools.searchingPatterns",
    },
    description:
      "Search real design patterns from the live document sections and/or built-in templates. Returns real block trees to clone/adapt - never invent skinny patterns.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "getBlockAICapabilities",
    ui: {
      label: "Loading block actions…",
      labelKey: "builder.ai.tools.loadingCapabilities",
    },
    description: "List AI actions available for a block type.",
    inputSchema: {
      type: "object",
      properties: {
        blockType: { type: "string" },
      },
      required: ["blockType"],
      additionalProperties: false,
    },
  },
  {
    name: "proposeDocumentOperations",
    ui: {
      label: "Preparing proposed changes…",
      labelKey: "builder.ai.tools.proposingChanges",
    },
    description:
      'Propose native editor history operations. Use set-block-data / add-block / delete-block / move-block shapes with a value object. Example set-block-data: { type:"set-block-data", value:{ blockId, data } }. For mirroring a section: cloneBlockForInsert → edit cloned copy text → add-block with parentBlockId/index from the clone result. Do not use updateBlock.',
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        operations: {
          type: "array",
          items: { type: "object" },
        },
      },
      required: ["summary", "operations"],
      additionalProperties: false,
    },
  },
  {
    name: "proposeDocumentSettings",
    ui: {
      label: "Preparing document settings…",
      labelKey: "builder.ai.tools.proposingSettings",
    },
    description:
      'Propose host-form document settings outside the block tree. Pages: title, slug, description, keywords, and optionally headerId/footerId from platform_listPageChrome. Page title must NOT include brand/site suffixes (no "| Studio Name") - the host appends those. Derive slug from the short page title. Emails: name (admin label) and subject (Mustache when useful). Text messages: name (admin label) and value (Mustache SMS body). Footers: name. Required on create/design/redesign. Page slug may need user confirmation. Can combine with proposeDocumentOperations in the same turn (not for text-message).',
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        settings: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            keywords: { type: "string" },
            subject: { type: "string" },
            value: { type: "string" },
            headerId: { type: "string" },
            footerId: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      required: ["summary", "settings"],
      additionalProperties: false,
    },
  },
  {
    name: "validateOperations",
    ui: {
      label: "Validating changes…",
      labelKey: "builder.ai.tools.validatingChanges",
    },
    description: "Validate proposed document operations against live schemas.",
    inputSchema: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          items: { type: "object" },
        },
      },
      required: ["operations"],
      additionalProperties: false,
    },
  },
];

export function toolsForBuilder(builder: BuilderKind): AIToolDefinition[] {
  if (builder === "text-message") {
    return BUILDER_AI_TOOL_DEFINITIONS.filter((tool) =>
      TEXT_MESSAGE_TOOL_NAMES.has(tool.name),
    );
  }

  return BUILDER_AI_TOOL_DEFINITIONS;
}
