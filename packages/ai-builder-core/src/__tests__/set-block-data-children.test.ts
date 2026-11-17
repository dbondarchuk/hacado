import { editorHistoryReducer } from "@hacado/builder/editor";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("set-block-data nested children merge", () => {
  it("updates nested Text body inside Popup content children", () => {
    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        props: {
          children: [
            {
              id: "christmas-vacation-popup",
              type: "Popup",
              data: {
                props: {
                  show: "one-time",
                  overlay: "default",
                  title: { children: [] },
                  subtitle: { children: [] },
                  content: {
                    children: [
                      {
                        id: "vacation-popup-copy",
                        type: "Text",
                        data: {
                          props: {
                            value: [
                              {
                                type: "p",
                                children: [
                                  {
                                    text: "Exact vacation dates are to be confirmed.",
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  buttons: { children: [] },
                },
              },
            },
          ],
        },
      },
    };

    const result = editorHistoryReducer(document as any, null, {
      type: "set-block-data",
      value: {
        blockId: "christmas-vacation-popup",
        data: {
          props: {
            content: {
              children: [
                {
                  id: "vacation-popup-copy",
                  type: "Text",
                  data: {
                    props: {
                      value: [
                        {
                          type: "p",
                          children: [
                            {
                              text: "I'll be on vacation from December 21-27, 2026.",
                            },
                          ],
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
    });

    assert.ok(result);

    const text = (result.document as any).data.props.children[0].data.props
      .content.children[0].data.props.value[0].children[0].text;

    assert.equal(text, "I'll be on vacation from December 21-27, 2026.");
  });

  it("keeps existing children when source omits block trees (UI strip)", () => {
    const document = {
      id: "root",
      type: "Container",
      data: {
        props: {
          children: [
            {
              id: "text-1",
              type: "Text",
              data: {
                props: {
                  value: [{ type: "p", children: [{ text: "Keep me" }] }],
                },
              },
            },
          ],
        },
        style: {},
      },
    };

    const result = editorHistoryReducer(document as any, null, {
      type: "set-block-data",
      value: {
        blockId: "root",
        data: {
          style: { padding: [{ value: { top: { value: 1, unit: "rem" } } }] },
          props: {
            children: [],
          },
        },
      },
    });

    assert.ok(result);
    assert.equal(
      (result.document as any).data.props.children[0].data.props.value[0]
        .children[0].text,
      "Keep me",
    );
  });
});
