import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeAskUser, parseAskUserArgs } from "../ask-user";

describe("askUser", () => {
  it("parses valid askUser args", () => {
    const parsed = parseAskUserArgs({
      question: "What tone?",
      reason: "Need preference",
      required: false,
      kind: "preference",
      options: [{ label: "Warm", value: "warm" }],
    });

    assert.equal(parsed?.question, "What tone?");
    assert.equal(parsed?.kind, "preference");
    assert.equal(parsed?.options?.[0]?.value, "warm");
  });

  it("rejects invalid kind", () => {
    assert.equal(
      parseAskUserArgs({
        question: "Q",
        reason: "R",
        required: true,
        kind: "other",
      }),
      null,
    );
  });

  it("executeAskUser returns structured pause payload", () => {
    const result = executeAskUser({
      question: "Confirm publish?",
      reason: "User must confirm",
      required: true,
      kind: "confirmation",
    });

    assert.equal(result.askUser?.question, "Confirm publish?");
    assert.equal(result.error, undefined);
  });
});
