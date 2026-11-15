import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emailNeedsQualityFix,
  looksLikeEmailBodyCreate,
  looksLikeSubjectOnlyAsk,
  proposalContainsMustache,
} from "../orchestration/email-quality";
import type { DocumentProposal } from "../types";

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
    assert.equal(
      looksLikeSubjectOnlyAsk("Change the subject to Your OTP code"),
      true,
    );

    assert.equal(
      looksLikeEmailBodyCreate("Change the subject to Your OTP code"),
      false,
    );

    assert.equal(
      looksLikeEmailBodyCreate("Create a branded appointment reminder email"),
      true,
    );
  });

  it("allows subject-only settings with no body", () => {
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Update the subject to Your OTP code",
        proposal: undefined,
        settingsProposal: {
          settings: { subject: "Your OTP code" },
          summary: "subject",
        },
      }),
      false,
    );
  });

  it("requires body ops and empty name for appointment reminder creates", () => {
    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create a branded appointment reminder email",
        documentSettings: { name: "", subject: "" },
        proposal: undefined,
        settingsProposal: {
          settings: {
            subject: "Reminder: {{service.name}} on {{dateTime.date}}",
          },
          summary: "subject",
        },
      }),
      true,
    );

    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create a branded appointment reminder email",
        documentSettings: { name: "", subject: "" },
        proposal: opsProposal("Hi {{fields.name}}, see you {{dateTime.full}}"),
        settingsProposal: {
          settings: {
            subject: "Reminder: {{service.name}} on {{dateTime.date}}",
          },
          summary: "subject only",
        },
      }),
      true,
    );

    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create a branded appointment reminder email",
        documentSettings: { name: "", subject: "" },
        proposal: opsProposal("Hi {{fields.name}}, see you {{dateTime.full}}"),
        settingsProposal: {
          settings: {
            name: "Appointment reminder",
            subject: "Reminder: {{service.name}} on {{dateTime.date}}",
          },
          summary: "name + subject",
        },
      }),
      false,
    );
  });

  it("nudges appointment bodies that omit Mustache", () => {
    assert.equal(
      proposalContainsMustache(opsProposal("Hi John at VIVID")),
      false,
    );

    assert.equal(
      emailNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create an appointment reminder",
        proposal: opsProposal("Hi John at VIVID"),
        settingsProposal: undefined,
      }),
      true,
    );
  });

  it("does not gate page builder", () => {
    assert.equal(
      emailNeedsQualityFix({
        builder: "page",
        task: "document_generation",
        message: "Create a reminder section",
        proposal: undefined,
      }),
      false,
    );
  });
});
