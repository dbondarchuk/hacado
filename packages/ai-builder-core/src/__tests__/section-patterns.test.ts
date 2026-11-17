import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDocumentSectionPatterns,
  buildDocumentStructure,
} from "../discovery/document-structure";

describe("section-patterns", () => {
  it("builds signatures from PageLayout children", () => {
    const document = {
      id: "root",
      type: "PageLayout",
      data: {
        props: {
          children: [
            {
              id: "hero",
              type: "Container",
              data: {
                props: {
                  children: [
                    {
                      id: "h1",
                      type: "Heading",
                      data: { props: { children: [] } },
                    },
                    {
                      id: "t1",
                      type: "Text",
                      data: { props: { value: [] } },
                    },
                    {
                      id: "img1",
                      type: "Image",
                      data: { props: {} },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    } as any;

    const structure = buildDocumentStructure(document);
    const patterns = buildDocumentSectionPatterns(structure);

    assert.equal(patterns.length, 1);
    assert.equal(patterns[0]?.signature, "Container > Heading, Text, Image");
  });
});
