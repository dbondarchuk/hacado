import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBlockAICapabilitiesFromEntry } from "../capabilities/registry";

describe("block AI capabilities", () => {
  it("returns aiCapabilities declared on the block entry", () => {
    const custom = [
      {
        id: "improve_form_copy",
        label: "Improve form copy",
        labelKey: "app_forms_admin.block.ai.improveFormCopy",
        description: "Improve form copy",
        kind: "generative" as const,
      },
    ];

    assert.equal(
      getBlockAICapabilitiesFromEntry({ aiCapabilities: custom }),
      custom,
    );
  });

  it("returns an empty list when the block declares nothing", () => {
    assert.deepEqual(getBlockAICapabilitiesFromEntry({}), []);
    assert.deepEqual(
      getBlockAICapabilitiesFromEntry({ aiCapabilities: [] }),
      [],
    );
  });
});
