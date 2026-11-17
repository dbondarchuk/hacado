import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSmsLinkShorteningEnabled,
  previewShortCode,
  previewShortenUrlsInText,
} from "./short-links";

describe("isSmsLinkShorteningEnabled", () => {
  it("is off when unset, false, or 0", () => {
    assert.equal(isSmsLinkShorteningEnabled(undefined), false);
    assert.equal(isSmsLinkShorteningEnabled(""), false);
    assert.equal(isSmsLinkShorteningEnabled("false"), false);
    assert.equal(isSmsLinkShorteningEnabled("0"), false);
  });

  it("is on for true and 1", () => {
    assert.equal(isSmsLinkShorteningEnabled("true"), true);
    assert.equal(isSmsLinkShorteningEnabled("1"), true);
  });
});

describe("previewShortenUrlsInText", () => {
  it("rewrites urls to the short domain with a deterministic fake code", () => {
    const url = "https://salon.hacado.me/book";
    const code = previewShortCode(url);
    const rewritten = previewShortenUrlsInText(
      `Book ${url}. Thanks!`,
      "haca.do",
    );

    assert.equal(rewritten, `Book https://haca.do/${code}. Thanks!`);
    assert.equal(previewShortCode(url), code);
  });

  it("skips urls already on the short domain", () => {
    const body = "Open https://haca.do/Already1 please";

    assert.equal(previewShortenUrlsInText(body, "haca.do"), body);
  });
});
