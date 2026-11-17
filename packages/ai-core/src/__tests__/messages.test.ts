import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitInstructionsAndMessages } from "../provider/messages";

describe("splitInstructionsAndMessages", () => {
  it("keeps only the first system message as stable instructions", () => {
    const result = splitInstructionsAndMessages([
      { role: "system", content: "Stable system prompt" },
      { role: "system", content: "Volatile document context" },
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
      { role: "user", content: "Edit the hero" },
    ]);

    assert.equal(result.instructions, "Stable system prompt");
    assert.equal(result.messages.length, 4);
    assert.equal(result.messages[0]?.role, "user");
    assert.equal(result.messages[0]?.content, "Volatile document context");
    assert.equal(result.messages[1]?.role, "user");
    assert.equal(result.messages[1]?.content, "Hello");
  });
});
