import {
  MockAIProvider,
  registerAIProvider,
  resetAIProvidersForTests,
  resetTaskConfigurationForTests,
  resetUsageTrackerForTests,
  setTaskConfiguration,
  setUsageTracker,
} from "@hacado/ai-core";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import * as z from "zod";
import { createRegistryAdapter } from "../adapters";
import { computeDocumentRevision } from "../operations/revision";
import { runBuilderAIOrchestrator } from "../orchestration/orchestrator";

const textSchema = z.object({
  props: z.object({
    text: z.string(),
  }),
});

describe("orchestrator", () => {
  beforeEach(() => {
    resetAIProvidersForTests();
    resetTaskConfigurationForTests();
    resetUsageTrackerForTests();
    setTaskConfiguration("document_editing", {
      provider: "mock",
      model: "mock-model",
    });

    setTaskConfiguration("copywriting", {
      provider: "mock",
      model: "mock-model",
    });
  });

  it("runs tool loop and returns validated proposal", async () => {
    const events: unknown[] = [];
    setUsageTracker({
      track(event) {
        events.push(event);
      },
    });

    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        children: [
          {
            id: "text-1",
            type: "Text",
            data: { props: { text: "Hello" } },
          },
        ],
      },
    } as any;

    registerAIProvider(
      new MockAIProvider(async () => ({
        text: "Updated the text block.",
        toolCalls: [
          {
            id: "call-1",
            name: "proposeDocumentOperations",
            arguments: {
              summary: "Rewrite greeting",
              operations: [
                {
                  type: "set-block-data",
                  value: {
                    blockId: "text-1",
                    data: { props: { text: "Welcome" } },
                  },
                },
              ],
            },
          },
        ],
      })),
    );

    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "PageLayout",
          displayName: "Page",
          category: "layout",
          schema: z.object({ children: z.array(z.any()) }),
        },
        {
          type: "Text",
          displayName: "Text",
          category: "content",
          tags: ["text"],
          schema: textSchema,
        },
      ],
    });

    const revision = computeDocumentRevision(document);
    const response = await runBuilderAIOrchestrator(
      {
        builder: "page",
        document,
        documentRevision: revision,
        selection: {
          builder: "page",
          documentRevision: revision,
          selectionType: "block",
          selectedBlockIds: ["text-1"],
          selectedBlockTypes: ["Text"],
        },
        message: "Rewrite this text to say Welcome",
      },
      {
        adapter,
        organizationId: "org-1",
        providerId: "mock",
      },
    );

    assert.equal(response.proposal?.operations.length, 1);
    assert.equal(response.provider, "mock");
    assert.equal(events.length, 1);
  });

  it("nudges and refuses false Done without a proposal", async () => {
    let generateCalls = 0;
    registerAIProvider(
      new MockAIProvider(async () => {
        generateCalls += 1;
        return { text: "Done.", toolCalls: [] };
      }),
    );

    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        children: [
          {
            id: "text-1",
            type: "Text",
            data: { props: { text: "Hello" } },
          },
        ],
      },
    } as any;

    const revision = computeDocumentRevision(document);
    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "PageLayout",
          displayName: "Page",
          category: "layout",
          schema: z.object({ children: z.array(z.any()) }),
        },
        {
          type: "Text",
          displayName: "Text",
          category: "content",
          tags: ["text"],
          schema: textSchema,
        },
      ],
    });

    const response = await runBuilderAIOrchestrator(
      {
        builder: "page",
        document,
        documentRevision: revision,
        selection: {
          builder: "page",
          documentRevision: revision,
          selectionType: "document",
          selectedBlockIds: [],
          selectedBlockTypes: [],
        },
        message: "Add an addons section similar to our services",
      },
      {
        adapter,
        organizationId: "org-1",
        providerId: "mock",
        maxToolIterations: 4,
        maxCorrections: 1,
      },
    );

    assert.equal(response.proposal, undefined);
    assert.match(response.text, /couldn't produce valid document changes/i);
    assert.ok(generateCalls >= 2);
  });

  it("nudges after discovery-only turns without a proposal", async () => {
    let generateCalls = 0;
    registerAIProvider(
      new MockAIProvider(async () => {
        generateCalls += 1;

        if (generateCalls === 1) {
          return {
            text: "Looking at the document structure.",
            toolCalls: [
              {
                id: "call-structure",
                name: "getDocumentStructure",
                arguments: {},
              },
            ],
          };
        }

        return { text: "Still inspecting.", toolCalls: [] };
      }),
    );

    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        children: [
          {
            id: "text-1",
            type: "Text",
            data: { props: { text: "Hello" } },
          },
        ],
      },
    } as any;

    const revision = computeDocumentRevision(document);
    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "PageLayout",
          displayName: "Page",
          category: "layout",
          schema: z.object({ children: z.array(z.any()) }),
        },
        {
          type: "Text",
          displayName: "Text",
          category: "content",
          tags: ["text"],
          schema: textSchema,
        },
      ],
    });

    const response = await runBuilderAIOrchestrator(
      {
        builder: "page",
        document,
        documentRevision: revision,
        selection: {
          builder: "page",
          documentRevision: revision,
          selectionType: "document",
          selectedBlockIds: [],
          selectedBlockTypes: [],
        },
        message: "Add an addons section similar to our services",
      },
      {
        adapter,
        organizationId: "org-1",
        providerId: "mock",
        maxToolIterations: 4,
        maxCorrections: 1,
      },
    );

    assert.equal(response.proposal, undefined);
    assert.match(response.text, /couldn't produce valid document changes/i);
    assert.ok(generateCalls >= 2);
  });

  it("pauses on askUser after discovery and does not nudge propose", async () => {
    let generateCalls = 0;
    registerAIProvider(
      new MockAIProvider(async () => {
        generateCalls += 1;

        if (generateCalls === 1) {
          return {
            text: "Checking available popup options.",
            toolCalls: [
              {
                id: "call-structure",
                name: "getDocumentStructure",
                arguments: {},
              },
            ],
          };
        }

        return {
          text: "I need the vacation dates before adding the notice.",
          toolCalls: [
            {
              id: "call-ask",
              name: "askUser",
              arguments: {
                question:
                  "What are the exact start and end dates of your vacation, including the year?",
                reason: "Vacation dates are not in the business profile.",
                required: true,
                kind: "clarification",
              },
            },
          ],
        };
      }),
    );

    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        children: [
          {
            id: "text-1",
            type: "Text",
            data: { props: { text: "Hello" } },
          },
        ],
      },
    } as any;

    const revision = computeDocumentRevision(document);
    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "PageLayout",
          displayName: "Page",
          category: "layout",
          schema: z.object({ children: z.array(z.any()) }),
        },
        {
          type: "Text",
          displayName: "Text",
          category: "content",
          tags: ["text"],
          schema: textSchema,
        },
      ],
    });

    const response = await runBuilderAIOrchestrator(
      {
        builder: "page",
        document,
        documentRevision: revision,
        selection: {
          builder: "page",
          documentRevision: revision,
          selectionType: "document",
          selectedBlockIds: [],
          selectedBlockTypes: [],
        },
        message: "Add a Christmas vacation popup",
      },
      {
        adapter,
        organizationId: "org-1",
        providerId: "mock",
        maxToolIterations: 4,
        maxCorrections: 1,
      },
    );

    assert.equal(response.status, "waiting_for_user");
    assert.equal(response.proposal, undefined);
    assert.equal(
      response.askUser?.question,
      "What are the exact start and end dates of your vacation, including the year?",
    );

    assert.equal(generateCalls, 2);
  });

  it("ignores propose tools in the same turn as askUser", async () => {
    registerAIProvider(
      new MockAIProvider(async () => ({
        text: "Need a color first.",
        toolCalls: [
          {
            id: "call-ask",
            name: "askUser",
            arguments: {
              question: "Which primary color should I use?",
              reason: "No brand color was specified.",
              required: true,
              kind: "clarification",
              options: [
                { label: "Blush", value: "blush" },
                { label: "Navy", value: "navy" },
              ],
            },
          },
          {
            id: "call-propose",
            name: "proposeDocumentOperations",
            arguments: {
              summary: "Update text",
              operations: [
                {
                  type: "set-block-data",
                  value: {
                    blockId: "text-1",
                    data: { props: { text: "Welcome" } },
                  },
                },
              ],
            },
          },
        ],
      })),
    );

    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        children: [
          {
            id: "text-1",
            type: "Text",
            data: { props: { text: "Hello" } },
          },
        ],
      },
    } as any;

    const revision = computeDocumentRevision(document);
    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "PageLayout",
          displayName: "Page",
          category: "layout",
          schema: z.object({ children: z.array(z.any()) }),
        },
        {
          type: "Text",
          displayName: "Text",
          category: "content",
          tags: ["text"],
          schema: textSchema,
        },
      ],
    });

    const response = await runBuilderAIOrchestrator(
      {
        builder: "page",
        document,
        documentRevision: revision,
        selection: {
          builder: "page",
          documentRevision: revision,
          selectionType: "document",
          selectedBlockIds: [],
          selectedBlockTypes: [],
        },
        message: "Change the primary color",
      },
      {
        adapter,
        organizationId: "org-1",
        providerId: "mock",
        maxToolIterations: 4,
        maxCorrections: 1,
      },
    );

    assert.equal(response.status, "waiting_for_user");
    assert.equal(response.proposal, undefined);
    assert.equal(response.askUser?.kind, "clarification");
    assert.equal(response.askUser?.options?.length, 2);
  });

  it("emits stream text-delta and tool step events via onEvent", async () => {
    const streamEvents: Array<{ type: string; tool?: string; phase?: string }> =
      [];

    registerAIProvider(
      new MockAIProvider(async () => ({
        text: "Updated the text block.",
        toolCalls: [
          {
            id: "call-1",
            name: "proposeDocumentOperations",
            arguments: {
              summary: "Rewrite greeting",
              operations: [
                {
                  type: "set-block-data",
                  value: {
                    blockId: "text-1",
                    data: { props: { text: "Welcome" } },
                  },
                },
              ],
            },
          },
        ],
      })),
    );

    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        children: [
          {
            id: "text-1",
            type: "Text",
            data: { props: { text: "Hello" } },
          },
        ],
      },
    } as any;

    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "PageLayout",
          displayName: "Page",
          category: "layout",
          schema: z.object({ children: z.array(z.any()) }),
        },
        {
          type: "Text",
          displayName: "Text",
          category: "content",
          tags: ["text"],
          schema: textSchema,
        },
      ],
    });

    const revision = computeDocumentRevision(document);
    const response = await runBuilderAIOrchestrator(
      {
        builder: "page",
        document,
        documentRevision: revision,
        selection: {
          builder: "page",
          documentRevision: revision,
          selectionType: "block",
          selectedBlockIds: ["text-1"],
          selectedBlockTypes: ["Text"],
        },
        message: "Rewrite this text to say Welcome",
      },
      {
        adapter,
        organizationId: "org-1",
        providerId: "mock",
        onEvent: (event) => {
          if (event.type === "text-delta") {
            streamEvents.push({ type: "text-delta" });
          } else if (event.type === "step") {
            streamEvents.push({
              type: "step",
              tool: event.tool,
              phase: event.phase,
            });
          }
        },
      },
    );

    assert.equal(response.proposal?.operations.length, 1);
    assert.ok(streamEvents.some((event) => event.type === "text-delta"));
    assert.ok(
      streamEvents.some(
        (event) =>
          event.type === "step" &&
          event.tool === "proposeDocumentOperations" &&
          event.phase === "start",
      ),
    );

    assert.ok(
      streamEvents.some(
        (event) =>
          event.type === "step" &&
          event.tool === "proposeDocumentOperations" &&
          event.phase === "done",
      ),
    );
  });

  it("refuses clear off-topic messages before the main tool loop", async () => {
    let generateCalls = 0;
    registerAIProvider(
      new MockAIProvider(async () => {
        generateCalls += 1;
        return { text: "should not run", toolCalls: [] };
      }),
    );

    const document = {
      id: "root",
      type: "PageLayout",
      data: { children: [] },
    } as any;

    const revision = computeDocumentRevision(document);
    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "PageLayout",
          displayName: "Page",
          category: "layout",
          schema: z.object({ children: z.array(z.any()) }),
        },
      ],
    });

    const response = await runBuilderAIOrchestrator(
      {
        builder: "page",
        document,
        documentRevision: revision,
        selection: {
          builder: "page",
          documentRevision: revision,
          selectionType: "document",
          selectedBlockIds: [],
          selectedBlockTypes: [],
        },
        message: "What's the weather in Paris today?",
      },
      {
        adapter,
        organizationId: "org-1",
        providerId: "mock",
      },
    );

    assert.match(response.text, /builder document/i);
    assert.equal(response.proposal, undefined);
    assert.equal(generateCalls, 0);
  });
});
