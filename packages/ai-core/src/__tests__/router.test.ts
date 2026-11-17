import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  resetAIProvidersForTests,
  registerAIProvider,
  MockAIProvider,
} from "../provider";
import { resolveModelForTask } from "../models/router";
import {
  getTaskConfiguration,
  resetTaskConfigurationForTests,
  setTaskConfiguration,
} from "../models/tasks";

describe("task model router", () => {
  beforeEach(() => {
    resetAIProvidersForTests();
    resetTaskConfigurationForTests();
    registerAIProvider(new MockAIProvider());
    setTaskConfiguration("copywriting", {
      provider: "mock",
      model: "openai/gpt-6-luna",
      temperature: 0.2,
    });
    setTaskConfiguration("document_generation", {
      provider: "mock",
      model: "openai/gpt-6-luna",
      temperature: 0.4,
      fallback: {
        provider: "mock",
        model: "openai/gpt-6.1-terra",
      },
    });
  });

  it("resolves economy model for copywriting", () => {
    const resolved = resolveModelForTask("copywriting");
    assert.equal(resolved.model, "openai/gpt-6-luna");
    assert.equal(resolved.provider, "mock");
  });

  it("escalates to GPT-6.1 Terra when requested", () => {
    const resolved = resolveModelForTask("document_generation", {
      escalate: true,
    });
    assert.equal(resolved.model, "openai/gpt-6.1-terra");
  });

  it("maps document editing to standard Terra via gateway by default", () => {
    resetTaskConfigurationForTests();
    const config = getTaskConfiguration("document_editing");
    assert.equal(config.model, "openai/gpt-6.1-terra");
    assert.equal(config.provider, "gateway");
  });

  it("keeps document generation on the premium tier", () => {
    resetTaskConfigurationForTests();
    const config = getTaskConfiguration("document_generation");
    assert.equal(config.model, "openai/gpt-6.1-terra");
    assert.equal(config.provider, "gateway");
    assert.ok((config.maxOutputTokens ?? 0) >= 8192);
  });
});
