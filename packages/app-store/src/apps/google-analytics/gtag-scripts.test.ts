import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGtagScripts } from "./gtag-scripts";

describe("buildGtagScripts", () => {
  it("returns remote gtag loader and inline config", () => {
    const scripts = buildGtagScripts("G-TEST123");

    assert.equal(scripts.length, 2);
    assert.deepEqual(scripts[0], {
      id: "gtag-js-G-TEST123",
      source: "remote",
      url: "https://www.googletagmanager.com/gtag/js?id=G-TEST123",
    });
    assert.equal(scripts[1].source, "inline");
    assert.equal(scripts[1].id, "gtag-config-G-TEST123");
    if (scripts[1].source === "inline") {
      assert.match(scripts[1].value, /gtag\('config', "G-TEST123"\)/);
      assert.match(scripts[1].value, /window\.dataLayer/);
    }
  });
});
