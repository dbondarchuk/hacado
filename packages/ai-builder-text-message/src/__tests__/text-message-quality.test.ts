import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  looksLikeTextMessageBodyAsk,
  renderedSegmentCount,
  textMessageNeedsQualityFix,
  valueContainsMustache,
} from "../text-message-quality";

describe("text-message quality gate", () => {
  it("detects body asks", () => {
    assert.equal(looksLikeTextMessageBodyAsk("Shorten this message"), true);
    assert.equal(
      looksLikeTextMessageBodyAsk("Create appointment reminder"),
      true,
    );
  });

  it("requires value on create", () => {
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "text-message",
        task: "document_generation",
        message: "Create an appointment reminder text",
        documentSettings: { name: "", value: "" },
        settingsProposal: undefined,
      }),
      true,
    );
  });

  it("requires name when empty", () => {
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "text-message",
        task: "document_generation",
        message: "Write a confirmation SMS",
        documentSettings: { name: "" },
        settingsProposal: {
          summary: "Draft",
          settings: { value: "Hi {{fields.name}}, see you {{dateTime.sms}}." },
        },
      }),
      true,
    );
  });

  it("nudges appointment bodies that omit Mustache", () => {
    assert.equal(valueContainsMustache("Hello"), false);
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "text-message",
        task: "document_generation",
        message: "Create an appointment reminder SMS",
        documentSettings: { name: "Reminder" },
        settingsProposal: {
          summary: "Draft",
          settings: { value: "Hello friend, see you soon." },
        },
      }),
      true,
    );
  });

  it("nudges when rendered sample exceeds two segments", () => {
    const longBody = "A".repeat(320);

    assert.ok(renderedSegmentCount(longBody) > 2);
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "text-message",
        task: "document_editing",
        message: "Rewrite this message",
        documentSettings: { name: "Notice" },
        settingsProposal: {
          summary: "Rewrite",
          settings: { value: longBody },
        },
      }),
      true,
    );
  });

  it("nudges when body uses avoidable non-GSM punctuation", () => {
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "text-message",
        task: "document_editing",
        message: "Rewrite this message",
        documentSettings: { name: "Notice" },
        settingsProposal: {
          summary: "Rewrite",
          settings: {
            value: "Hi {{fields.name}} — see you soon.",
          },
        },
        args: { fields: { name: "Alex" } },
        language: "uk",
      }),
      true,
    );
  });

  it("accepts Ukrainian bodies without forcing GSM", () => {
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "text-message",
        task: "document_generation",
        message: "Create an appointment reminder SMS",
        documentSettings: { name: "Нагадування" },
        settingsProposal: {
          summary: "Draft",
          settings: {
            value:
              "Вітаємо, {{fields.name}}! Нагадуємо про візит {{dateTime.sms}}.",
          },
        },
        args: { fields: { name: "Оля" }, dateTime: { sms: "Вт 15:00" } },
        language: "uk",
      }),
      false,
    );
  });

  it("accepts short Mustache bodies", () => {
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "text-message",
        task: "document_generation",
        message: "Create an appointment reminder SMS",
        documentSettings: { name: "Reminder" },
        settingsProposal: {
          summary: "Draft",
          settings: {
            value: "Hi {{fields.name}}, reminder for {{dateTime.sms}}.",
          },
        },
        args: { fields: { name: "Alex" }, dateTime: { sms: "Tue 3pm" } },
        language: "en",
      }),
      false,
    );
  });

  it("does not gate email builder", () => {
    assert.equal(
      textMessageNeedsQualityFix({
        builder: "email",
        task: "document_generation",
        message: "Create reminder",
        settingsProposal: undefined,
      }),
      false,
    );
  });
});
