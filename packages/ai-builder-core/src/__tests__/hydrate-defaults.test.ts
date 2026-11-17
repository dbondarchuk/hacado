import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hydrateEditorBlock,
  hydrateEditorOperations,
  mergeBlockDataDefaults,
  normalizeAiBlockData,
  normalizeAiStyleMap,
} from "../operations/hydrate-defaults";

describe("hydrate-defaults", () => {
  it("does not let empty style {} wipe defaults", () => {
    const defaults = {
      style: { textAlign: [{ value: "center" }] },
      props: { level: "h2", children: [] },
    };

    const merged = mergeBlockDataDefaults(defaults, {
      style: {},
      props: {
        children: [{ id: "t1", type: "InlineText", data: {} }],
      },
    }) as {
      style: { textAlign: unknown[] };
      props: { level?: string; children: unknown[] };
    };

    assert.deepEqual(merged.style, defaults.style);
    assert.equal(merged.props.level, "h2");
    assert.equal(merged.props.children.length, 1);
  });

  it("lifts misplaced props.style and coerces Text props.text", () => {
    const normalized = normalizeAiBlockData("Text", {
      props: {
        style: {},
        text: "Dmytro Bondarchuk",
      },
    });

    assert.equal(normalized.style, undefined);
    assert.deepEqual((normalized.props as { value: unknown }).value, [
      { type: "p", children: [{ text: "Dmytro Bondarchuk" }] },
    ]);

    assert.equal((normalized.props as { text?: string }).text, undefined);
  });

  it("rewrites Plate paragraph aliases and accepts markdown Text value", () => {
    const aliased = normalizeAiBlockData("Text", {
      props: {
        value: [
          {
            type: "paragraph",
            children: [{ text: "Hello" }],
          },
        ],
      },
    });

    assert.deepEqual((aliased.props as { value: unknown }).value, [
      { type: "p", children: [{ text: "Hello" }] },
    ]);

    const markdown = normalizeAiBlockData("Text", {
      props: {
        value: "Support for nails\n\n- Gel removal\n- Nail shaping",
      },
    });

    const nodes = (markdown.props as { value: unknown[] }).value;

    assert.equal((nodes[0] as { type: string }).type, "p");
    assert.equal((nodes[1] as { type: string }).type, "ul");

    const wrappedMarkdown = normalizeAiBlockData("Text", {
      props: {
        value: [
          {
            type: "p",
            children: [{ text: "**$75**  ·  **120 minutes**" }],
          },
          {
            type: "p",
            children: [
              {
                text: "- Gel polish removal\n- Nail shaping\n- Hard gel strengthening",
              },
            ],
          },
        ],
      },
    });

    const wrapped = (wrappedMarkdown.props as { value: unknown[] }).value;
    const price = wrapped[0] as {
      type: string;
      children: Array<{ text: string; bold?: boolean }>;
    };

    assert.equal(price.type, "p");
    assert.deepEqual(price.children, [
      { text: "$75", bold: true },
      { text: "  ·  " },
      { text: "120 minutes", bold: true },
    ]);

    const withLink = normalizeAiBlockData("Text", {
      props: {
        value: [
          {
            type: "p",
            children: [
              {
                text: "Book online at [hacado.com](https://hacado.com) today.",
              },
            ],
          },
        ],
      },
    });

    assert.deepEqual((withLink.props as { value: unknown }).value, [
      {
        type: "p",
        children: [
          { text: "Book online at " },
          {
            type: "a",
            url: "https://hacado.com",
            children: [{ text: "hacado.com" }],
          },
          { text: " today." },
        ],
      },
    ]);

    const markdownLink = normalizeAiBlockData("Text", {
      props: {
        value: "See our [booking page](/book) for openings.",
      },
    });

    assert.deepEqual((markdownLink.props as { value: unknown }).value, [
      {
        type: "p",
        children: [
          { text: "See our " },
          {
            type: "a",
            url: "/book",
            children: [{ text: "booking page" }],
          },
          { text: " for openings." },
        ],
      },
    ]);

    assert.equal((wrapped[1] as { type: string }).type, "ul");
  });

  it("coerces page Heading props.text into InlineText children", () => {
    const normalized = normalizeAiBlockData("Heading", {
      props: {
        text: "Meet our team",
        level: "h2",
      },
    });

    const props = normalized.props as {
      text?: string;
      children: Array<{
        type: string;
        data: {
          props: {
            children: Array<{
              type: string;
              data: { props: { text: string } };
            }>;
          };
        };
      }>;
    };

    assert.equal(props.text, undefined);
    assert.equal(props.children[0]?.type, "InlineContainer");
    assert.equal(props.children[0]?.data.props.children[0]?.type, "InlineText");

    assert.equal(
      props.children[0]?.data.props.children[0]?.data.props.text,
      "Meet our team",
    );
  });

  it("rewrites Text nested under Heading/Button into InlineContainer/InlineText", () => {
    const heading = normalizeAiBlockData("Heading", {
      props: {
        level: "h1",
        children: [
          {
            id: "bad-text",
            type: "Text",
            data: {
              props: {
                value: [
                  { type: "p", children: [{ text: "Gel strengthening" }] },
                ],
              },
            },
          },
        ],
      },
    });

    const headingChildren = (
      heading.props as { children: Array<{ type: string; data: any }> }
    ).children;

    assert.equal(headingChildren[0]?.type, "InlineContainer");
    assert.equal(
      headingChildren[0]?.data.props.children[0]?.type,
      "InlineText",
    );

    assert.equal(
      headingChildren[0]?.data.props.children[0]?.data.props.text,
      "Gel strengthening",
    );

    const button = normalizeAiBlockData("Button", {
      props: {
        type: "link",
        url: "/book",
        children: [
          {
            id: "btn-text",
            type: "Text",
            data: {
              props: {
                value: [{ type: "p", children: [{ text: "Book now" }] }],
              },
            },
          },
        ],
      },
    });

    const buttonChildren = (
      button.props as { children: Array<{ type: string; data: any }> }
    ).children;

    assert.equal(buttonChildren[0]?.type, "InlineContainer");
    assert.equal(
      buttonChildren[0]?.data.props.children[0]?.data.props.text,
      "Book now",
    );
  });

  it("hydrates nested blocks recursively", () => {
    const defaultsByType = new Map<string, unknown>([
      [
        "Container",
        {
          style: { width: [{ value: { value: 100, unit: "%" } }] },
          props: { children: [] },
        },
      ],
      [
        "Heading",
        {
          style: { fontWeight: [{ value: "bold" }] },
          props: { level: "h2", children: [] },
        },
      ],
    ]);

    const hydrated = hydrateEditorBlock(
      {
        id: "c1",
        type: "Container",
        data: {
          props: {
            style: {},
            children: [
              {
                id: "h1",
                type: "Heading",
                data: {
                  props: {
                    style: {},
                    children: [],
                  },
                },
              },
            ],
          },
        },
      },
      defaultsByType,
    );

    assert.ok((hydrated.data as { style?: unknown }).style);
    const child = (
      hydrated.data as {
        props: { children: Array<{ data: { style?: unknown } }> };
      }
    ).props.children[0];

    assert.ok(child.data.style);
  });

  it("coerces string breakpoints and aliases like mobile→max-md", () => {
    const style = normalizeAiStyleMap({
      fontSize: [
        { value: { value: 16, unit: "px" } },
        { value: { value: 14, unit: "px" }, breakpoint: "mobile" },
      ],
      height: [
        {
          value: { value: 200, unit: "px" },
          breakpoint: ["tablet", "nope"],
        },
      ],
    }) as {
      fontSize: Array<{ breakpoint?: string[] }>;
      height: Array<{ breakpoint?: string[] }>;
    };

    assert.equal(style.fontSize[0].breakpoint, undefined);
    assert.deepEqual(style.fontSize[1].breakpoint, ["max-md"]);
    assert.deepEqual(style.height[0].breakpoint, ["md"]);

    const normalized = normalizeAiBlockData("Heading", {
      style: {
        fontSize: [{ value: "1rem", breakpoint: "mobile" }],
      },
      props: { level: "h1", children: [] },
    });

    assert.deepEqual(
      (normalized.style as { fontSize: Array<{ breakpoint?: string[] }> })
        .fontSize[0].breakpoint,
      ["max-md"],
    );

    const ops = hydrateEditorOperations(
      [
        {
          type: "set-block-data",
          value: {
            blockId: "h1",
            data: {
              style: {
                height: [
                  { value: { value: 1, unit: "px" }, breakpoint: "mobile" },
                ],
              },
            },
          },
        } as never,
      ],
      new Map(),
    );

    const patched = ops[0] as {
      value: { data: { style: { height: Array<{ breakpoint?: string[] }> } } };
    };

    assert.deepEqual(patched.value.data.style.height[0].breakpoint, ["max-md"]);
  });

  it("hydrates defaultMetadata for app blocks and preserves explicit metadata", () => {
    const defaultsByType = new Map<string, unknown>();
    const metadataByType = new Map<string, Record<string, unknown>>([
      ["BookingModern", { waitlistAppId: "app-waitlist" }],
      ["GiftCardPurchase", { giftCardStudioAppId: "app-gift" }],
    ]);

    const booking = hydrateEditorBlock(
      {
        id: "b1",
        type: "BookingModern",
        data: { props: {} },
      },
      defaultsByType,
      metadataByType,
    );

    assert.deepEqual(booking.metadata, { waitlistAppId: "app-waitlist" });

    const gift = hydrateEditorBlock(
      {
        id: "g1",
        type: "GiftCardPurchase",
        metadata: { giftCardStudioAppId: "custom-id" },
        data: { props: {} },
      },
      defaultsByType,
      metadataByType,
    );

    assert.deepEqual(gift.metadata, { giftCardStudioAppId: "custom-id" });
  });
});
