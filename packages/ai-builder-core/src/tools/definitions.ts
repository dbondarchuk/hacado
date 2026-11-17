import type { AIToolDefinition } from "../types";

export const BUILDER_AI_TOOL_DEFINITIONS: AIToolDefinition[] = [
  {
    name: "searchBlocks",
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
    description:
      "Retrieve props schemas + defaultValue (+ defaultMetadata) for block types. Read prop JSON Schema description fields. Returns supportedStyles, allowedIn, and allowedChildren (nesting rules). Style value schemas are NOT inlined. Required before proposing props: use only schema fields + defaultValue shape — never invent aliases. Heading/Button children must follow allowedChildren (inline only — never nest Text). For style values call searchStyleProperties / getStyleSchema.",
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
    description:
      "Retrieve parent/child hierarchy rules for block types: allowedIn (where the block may be placed) and allowedChildren (which child types/capabilities may nest under it). Heading/Button/Link only allow children with capability \"inline\" (InlineContainer, InlineText, Icon, …) — never Text.",
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
    description:
      "Retrieve JSON schemas for specific style properties (not returned by getBlockSchemas). Prefer names from getBlockSchemas.supportedStyles. Pass blockType to ensure the block supports them. Call before custom style overrides; values are variant arrays ({ value, breakpoint?, state? }[]), not bare CSS strings. breakpoint/state must be arrays of schema tokens (e.g. [\"max-md\"]), never strings like \"mobile\".",
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
    description:
      "Retrieve allowed design tokens (color: var(--value-*-color); font: PRIMARY/SECONDARY/…). Call on create/design/redesign before inventing styles. Pair with getBusinessProfile({ needs: [\"branding\"] }) for org-specific color/font choices — never invent hex or raw CSS font names when tokens exist.",
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
    description: "Retrieve a compact outline of the current document.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getSelectedBlocks",
    description: "Retrieve the currently selected blocks and ancestors.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getBlocksByIds",
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
    name: "getBusinessProfile",
    description:
      "Retrieve selective business profile / catalog slices. Call this whenever you need business facts — they are not preloaded in runtime context. Use needs:summary for counts and short name lists.",
    inputSchema: {
      type: "object",
      properties: {
        needs: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "summary",
              "profile",
              "contact",
              "branding",
              "services",
              "addons",
              "packages",
              "members",
              "social",
            ],
          },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "getDocumentSettings",
    description:
      "Retrieve host-form document settings (page title/slug/description/keywords/headerId/footerId, email name/subject, footer name) plus availableHeaders/availableFooters when provided. Not preloaded in context.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getTemplateArgs",
    description:
      "Retrieve Mustache template argument paths and sample preview values for the current document. Call when writing dynamic email/page copy.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "searchDesignPatterns",
    description:
      "Search real design patterns from the live document sections and/or built-in templates. Returns real block trees to clone/adapt — never invent skinny patterns.",
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
    name: "searchStockImages",
    description:
      "Search stock photos from Unsplash/Pexels (when configured). Call before filling Image or gallery src props. Use returned url + alt only — never invent Unsplash/Pexels CDN URLs or placeholder photo links.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        count: { type: "number" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "searchStockVideos",
    description:
      "Search stock videos from Pexels (when configured). Call before filling Video props.src / props.poster or backgroundVideo style src/poster. Use returned urls only — never invent Pexels CDN URLs.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        count: { type: "number" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "searchPages",
    description:
      "Search organization pages (sitemap-style). Call before writing internal links/buttons so href uses real /slug paths. Returns title, slug, published.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
        publishedOnly: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "getConnectedApps",
    description:
      "List installed builder apps and the block metadata keys/ids to set when adding app blocks (waitlist, gift-card-studio, forms, blog, etc.).",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getBlockAICapabilities",
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
    name: "askUser",
    description:
      "Ask the user a structured question and pause. Use only when a required fact is known only by the user and tools cannot provide it (clarification), when you need explicit permission (confirmation), or for an optional preference. Do not ask for business/document data tools can load. Prefer reasonable defaults for vague taste requests. One concise question. Set required:false for skippable preferences. Do not use for reversible low-risk editor changes unless the user asked for confirmation. Never invent placeholder facts instead of asking.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string" },
        reason: { type: "string" },
        required: { type: "boolean" },
        kind: {
          type: "string",
          enum: ["clarification", "confirmation", "preference"],
        },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "string" },
            },
            required: ["label", "value"],
            additionalProperties: false,
          },
        },
        allowCustomAnswer: { type: "boolean" },
      },
      required: ["question", "reason", "required", "kind"],
      additionalProperties: false,
    },
  },
  {
    name: "proposeDocumentOperations",
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
    description:
      "Propose host-form document settings outside the block tree. Pages: title, slug, description, keywords, and optionally headerId/footerId from getDocumentSettings available lists. Page title must NOT include brand/site suffixes (no \"| Studio Name\") — the host appends those. Derive slug from the short page title. Emails: name (admin label) and subject (Mustache when useful). Footers: name. Required on create/design/redesign. Page slug may need user confirmation. Can combine with proposeDocumentOperations in the same turn.",
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
