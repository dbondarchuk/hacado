import type { DocumentProposal } from "@hacado/ai-builder-core";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emailNeedsQualityFix,
  isPlainTextHeavyEmailProposal,
  looksLikeEmailBodyCreate,
  looksLikeSubjectOnlyAsk,
  proposalContainsMustache,
} from "../email-quality";

const opsProposal = (
  blocks: Array<{ id: string; type: string; text?: string }>,
): DocumentProposal => ({
  documentRevision: "rev",
  operations: blocks.map((block, index) => ({
    type: "add-block",
    value: {
      block: {
        id: block.id,
        type: block.type,
        data:
          block.type === "Text"
            ? {
                props: {
                  value: [
                    {
                      type: "p",
                      children: [{ text: block.text ?? "Hello" }],
                    },
                  ],
                },
              }
            : block.type === "Heading"
              ? { props: { text: block.text ?? "Title" } }
              : block.type === "Button"
                ? {
                    props: {
                      text: "Manage",
                      url: "{{manageLink}}",
                    },
                  }
                : { props: {} },
      },
      parentBlockId: "root",
      index: index === blocks.length - 1 ? "last" : index,
    },
  })),
  summary: "test",
});

const textOnlyProposal = (text: string): DocumentProposal =>
  opsProposal([{ id: "t1", type: "Text", text }]);

describe("email quality gate", () => {
  it("detects subject-only vs body create asks", () => {
    assert.equal(looksLikeSubjectOnlyAsk("Change the subject"), true);
    assert.equal(looksLikeEmailBodyCreate("Create appointment reminder"), true);
  });

  it("allows subject-only settings with no body", () => {
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Update the subject line",
        documentSettings: { name: "", subject: "" },
        proposal: undefined,
      }),
      false,
    );
  });

  it("requires body ops and empty name for appointment reminder creates", () => {
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create an appointment reminder email",
        documentSettings: { name: "", subject: "" },
        proposal: undefined,
      }),
      true,
    );
  });

  it("nudges appointment bodies that omit Mustache", () => {
    assert.equal(proposalContainsMustache(textOnlyProposal("Hello")), false);
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create an appointment reminder email",
        documentSettings: { name: "Appointment reminder", subject: "Hi" },
        proposal: textOnlyProposal("Hello friend"),
      }),
      true,
    );
  });

  it("nudges plain Heading+Text creates without CTA/layout", () => {
    const plain = opsProposal([
      { id: "h1", type: "Heading", text: "Reminder" },
      { id: "t1", type: "Text", text: "See you soon {{fields.name}}" },
    ]);

    assert.equal(isPlainTextHeavyEmailProposal(plain), true);
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create an appointment reminder email",
        documentSettings: { name: "Appointment reminder", subject: "Hi" },
        proposal: plain,
      }),
      true,
    );
  });

  it("accepts richer layouts with a Button CTA", () => {
    const rich = opsProposal([
      { id: "h1", type: "Heading", text: "Reminder" },
      { id: "t1", type: "Text", text: "See you soon {{fields.name}}" },
      { id: "b1", type: "Button" },
    ]);

    assert.equal(isPlainTextHeavyEmailProposal(rich), false);
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create an appointment reminder email",
        documentSettings: { name: "Appointment reminder", subject: "Hi" },
        proposal: rich,
      }),
      false,
    );
  });

  it("does not gate page builder", () => {
    assert.equal(
      emailNeedsQualityFix({
        builder: "page",
        task: "document_generation",
        message: "Create an appointment reminder email",
        documentSettings: { name: "", subject: "" },
        proposal: undefined,
      }),
      false,
    );
  });
});
