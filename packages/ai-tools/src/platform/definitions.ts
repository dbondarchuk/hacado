import type { AIToolDefinition } from "@hacado/ai-core";

export const PLATFORM_AI_TOOL_DEFINITIONS: AIToolDefinition[] = [
  {
    name: "platform_getBusinessProfile",
    description:
      "Retrieve selective business profile / catalog slices. Call whenever you need business facts - they are not preloaded. Use needs:summary for counts and short name lists.",
    ui: {
      label: "Loading business profile…",
      labelKey: "builder.ai.tools.loadingBusiness",
    },
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
    name: "platform_getCatalog",
    description:
      "Retrieve catalog services, addons, and packages (names, prices, durations, staff). Prefer when you only need catalog, not full business profile.",
    ui: {
      label: "Loading catalog…",
      labelKey: "builder.ai.tools.loadingCatalog",
    },
    inputSchema: {
      type: "object",
      properties: {
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["services", "addons", "packages"],
          },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "platform_searchPages",
    description:
      "Search organization pages (sitemap-style). Call before writing internal links so href uses real /slug paths. Returns title, slug, published.",
    ui: {
      label: "Searching pages…",
      labelKey: "builder.ai.tools.searchingPages",
    },
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
    name: "platform_searchCustomers",
    description:
      "Search customers by name/email/phone. Returns lightweight rows (id, name, email, phone). Read-only.",
    ui: {
      label: "Searching customers…",
      labelKey: "builder.ai.tools.searchingCustomers",
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "platform_getTeamMembers",
    description: "List active team members (id, name, job title). Read-only.",
    ui: {
      label: "Loading team…",
      labelKey: "builder.ai.tools.loadingTeam",
    },
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "platform_getScheduleOverview",
    description:
      "Get schedule/availability overview for a member over a date range (ISO dates). Requires memberId.",
    ui: {
      label: "Loading schedule…",
      labelKey: "builder.ai.tools.loadingSchedule",
    },
    inputSchema: {
      type: "object",
      properties: {
        memberId: { type: "string" },
        start: { type: "string" },
        end: { type: "string" },
      },
      required: ["memberId", "start", "end"],
      additionalProperties: false,
    },
  },
  {
    name: "platform_searchAppointments",
    description:
      "Search upcoming/recent appointments (read-only). Optional query string matches customer/service names when supported.",
    ui: {
      label: "Searching appointments…",
      labelKey: "builder.ai.tools.searchingAppointments",
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
        memberId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "platform_searchTemplates",
    description:
      "Search communication templates (email/SMS). Returns id, name, type.",
    ui: {
      label: "Searching templates…",
      labelKey: "builder.ai.tools.searchingTemplates",
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
        type: {
          type: "array",
          items: { type: "string", enum: ["email", "text-message"] },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "platform_listConnectedApps",
    description:
      "List installed connected apps (appId, appName, scopes). Optional scope filters to apps that declare that scope (e.g. ui-components). For app-powered blocks, use schema defaultMetadata with the matching appId.",
    ui: {
      label: "Loading connected apps…",
      labelKey: "builder.ai.tools.loadingApps",
    },
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "platform_listPageChrome",
    description:
      "List available page headers and footers (id, name, usedCount). Call before proposeDocumentSettings when choosing headerId/footerId on pages.",
    ui: {
      label: "Loading page headers and footers…",
      labelKey: "builder.ai.tools.loadingPageChrome",
    },
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "platform_searchStockImages",
    description:
      "Search stock photos from Unsplash/Pexels (when configured). Call before filling Image src. Use returned url + alt only - never invent CDN URLs. Optional provider: unsplash | pexels | all.",
    ui: {
      label: "Searching stock images…",
      labelKey: "builder.ai.tools.searchingImages",
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        count: { type: "number" },
        provider: {
          type: "string",
          enum: ["unsplash", "pexels", "all"],
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "platform_searchStockVideos",
    description:
      "Search stock videos from Pexels (when configured). Use returned urls only - never invent CDN URLs. Optional provider: pexels | all.",
    ui: {
      label: "Searching stock videos…",
      labelKey: "builder.ai.tools.searchingVideos",
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        count: { type: "number" },
        provider: {
          type: "string",
          enum: ["pexels", "all"],
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "platform_askUser",
    description:
      "Ask the user a structured question and pause. Use only when a required fact is known only by the user and tools cannot provide it (clarification), when you need explicit permission (confirmation), or for an optional preference. Do not ask for business/document data tools can load. Prefer reasonable defaults for vague taste requests. One concise question. Set required:false for skippable preferences. Never invent placeholder facts instead of asking.",
    ui: {
      label: "Asking you a question…",
      labelKey: "builder.ai.tools.askingUser",
    },
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
];
