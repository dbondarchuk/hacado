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
    description: "Retrieve detailed schemas for specific block types.",
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
    description: "Retrieve parent/child hierarchy rules for block types.",
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
    description: "Search supported style properties for the current builder.",
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
    description: "Retrieve style property definitions.",
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
    description: "Retrieve available design tokens for branding-aware styling.",
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
      "Retrieve selective business profile facts, including team members and catalog slices (services/addons/packages with memberIds + staffSource inheritance). Never invent missing facts.",
    inputSchema: {
      type: "object",
      properties: {
        needs: {
          type: "array",
          items: {
            type: "string",
            enum: [
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
      "Propose host-form document settings outside the block tree (page title/description/keywords/slug, email subject/name, footer name). For new emails, set name when empty (plain admin label) and subject (Mustache preferred when useful; static OK). Page slug may require user confirmation before apply. Can be combined with proposeDocumentOperations in the same turn.",
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
