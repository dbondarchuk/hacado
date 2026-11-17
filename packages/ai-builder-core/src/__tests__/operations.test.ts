import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as z from "zod";
import { applyDocumentProposal } from "../operations/apply";
import { normalizeEditorOperations } from "../operations/normalize";
import { computeDocumentRevision } from "../operations/revision";
import { validateOperationsAgainstDocument } from "../operations/validate";

const textSchema = z.object({
  props: z.object({
    text: z.string(),
  }),
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

describe("operations", () => {
  it("computes stable document revisions", () => {
    const a = computeDocumentRevision(document);
    const b = computeDocumentRevision(document);
    assert.equal(a, b);
  });

  it("rejects invalid set-block-data", () => {
    const result = validateOperationsAgainstDocument({
      document,
      schemas: {
        PageLayout: z.object({ children: z.array(z.any()) }),
        Text: textSchema,
      },
      operations: [
        {
          type: "set-block-data",
          value: {
            blockId: "text-1",
            data: { props: { text: 123 } },
          },
        },
      ],
    });

    assert.equal(result.valid, false);
  });

  it("accepts valid set-block-data", () => {
    const result = validateOperationsAgainstDocument({
      document,
      schemas: {
        PageLayout: z.object({ children: z.array(z.any()) }),
        Text: textSchema,
      },
      operations: [
        {
          type: "set-block-data",
          value: {
            blockId: "text-1",
            data: { props: { text: "Updated" } },
          },
        },
      ],
    });

    assert.equal(result.valid, true);
  });

  it("rejects stale revisions on apply", () => {
    const dispatched: unknown[] = [];
    const result = applyDocumentProposal({
      document,
      expectedRevision: "stale",
      operations: [
        {
          type: "set-block-data",
          value: {
            blockId: "text-1",
            data: { props: { text: "Updated" } },
          },
        },
      ],
      dispatch: (entry) => dispatched.push(entry),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "stale_revision");
    }

    assert.equal(dispatched.length, 0);
  });

  it("normalizes updateBlock aliases to set-block-data", () => {
    const result = normalizeEditorOperations([
      {
        type: "updateBlock",
        blockId: "text-1",
        data: { props: { text: "Expanded" } },
      },
    ]);

    assert.deepEqual(result.issues, []);
    assert.deepEqual(result.operations, [
      {
        type: "set-block-data",
        value: {
          blockId: "text-1",
          data: { props: { text: "Expanded" } },
        },
      },
    ]);
  });

  it("rejects unknown operation types", () => {
    const result = validateOperationsAgainstDocument({
      document,
      schemas: {
        PageLayout: z.object({ children: z.array(z.any()) }),
        Text: textSchema,
      },
      operations: [{ type: "updateBlock", blockId: "text-1" } as any],
    });

    assert.equal(result.valid, false);
  });

  it("rejects Text blocks that fake titles with Plate heading nodes", () => {
    const pageTextSchema = z.object({
      props: z
        .object({
          value: z.any().optional().nullable(),
        })
        .optional()
        .nullable(),
      style: z.any().optional(),
    });

    const result = validateOperationsAgainstDocument({
      document,
      schemas: {
        PageLayout: z.object({ children: z.array(z.any()) }),
        Text: pageTextSchema,
        Container: z.object({
          props: z.object({ children: z.array(z.any()) }),
          style: z.any().optional(),
        }),
      },
      operations: [
        {
          type: "add-block",
          value: {
            parentBlockId: "root",
            index: "last",
            block: {
              id: "section-1",
              type: "Container",
              data: {
                props: {
                  children: [
                    {
                      id: "text-bad",
                      type: "Text",
                      data: {
                        props: {
                          value: [
                            {
                              type: "h2",
                              children: [{ text: "Meet our team" }],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    });

    assert.equal(result.valid, false);
    assert.ok(
      result.issues.some((issue) =>
        issue.message.includes("use a Heading block"),
      ),
    );
  });

  it("rejects nested invalid styles inside add-block trees", () => {
    const headingSchema = z.object({
      props: z
        .object({ children: z.array(z.any()) })
        .optional()
        .nullable(),
      style: z.object({
        fontFamily: z
          .array(z.object({ value: z.enum(["PRIMARY", "SECONDARY"]) }))
          .optional(),
      }),
    });

    const containerSchema = z.object({
      props: z.object({ children: z.array(z.any()) }),
      style: z.object({}).optional(),
    });

    const result = validateOperationsAgainstDocument({
      document,
      schemas: {
        PageLayout: z.object({ children: z.array(z.any()) }),
        Text: textSchema,
        Container: containerSchema,
        Heading: headingSchema,
      },
      operations: [
        {
          type: "add-block",
          value: {
            parentBlockId: "root",
            index: "last",
            block: {
              id: "section-1",
              type: "Container",
              data: {
                props: {
                  children: [
                    {
                      id: "heading-1",
                      type: "Heading",
                      data: {
                        props: { children: [] },
                        style: {
                          fontFamily: [{ value: "Cormorant Garamond" }],
                        },
                      },
                    },
                  ],
                },
                style: {},
              },
            },
          },
        },
      ],
    });

    assert.equal(result.valid, false);
  });

  it("applies operations when revision matches", () => {
    const dispatched: unknown[] = [];
    const revision = computeDocumentRevision(document);
    const result = applyDocumentProposal({
      document,
      expectedRevision: revision,
      operations: [
        {
          type: "set-block-data",
          value: {
            blockId: "text-1",
            data: { props: { text: "Updated" } },
          },
        },
      ],
      dispatch: (entry) => dispatched.push(entry),
    });

    assert.equal(result.ok, true);
    assert.equal(dispatched.length, 1);
  });
});
