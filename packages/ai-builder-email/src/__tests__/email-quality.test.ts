import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DocumentProposal } from "@hacado/ai-builder-core";
import {
  emailNeedsQualityFix,
  looksLikeEmailBodyCreate,
  looksLikeSubjectOnlyAsk,
  proposalContainsMustache,
} from "../email-quality";

const opsProposal = (text: string): DocumentProposal => ({
  documentRevision: "rev",
  operations: [
    {
      type: "add-block",
      value: {
        block: {
          id: "t1",
          type: "Text",
          data: { props: { value: [{ type: "p", children: [{ text }] }] } },
        },
        parentBlockId: "root",
        index: "last",
      },
    },
  ],
  summary: "test",
});

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
    assert.equal(proposalContainsMustache(opsProposal("Hello")), false);
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create an appointment reminder email",
        documentSettings: { name: "Appointment reminder", subject: "Hi" },
        proposal: opsProposal("Hello friend"),
      }),
      true,
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
