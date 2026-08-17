import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildShortLinkUrl,
  collectUniqueUrlsToShorten,
  extractHttpUrls,
  isShortLinkUrl,
  isSmsLinkShorteningEnabled,
  planSmsShortLinks,
  rewriteUrlsInText,
  SHORT_CODE_ALPHABET,
  SHORT_CODE_LENGTH,
  urlToShortCode,
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

describe("urlToShortCode", () => {
  it("returns a deterministic 8-char code from the unambiguous alphabet", () => {
    const code = urlToShortCode("https://salon.hacado.me/book");
    assert.equal(code.length, SHORT_CODE_LENGTH);
    assert.equal(
      [...code].every((char) => SHORT_CODE_ALPHABET.includes(char)),
      true,
    );
    assert.equal(urlToShortCode("https://salon.hacado.me/book"), code);
  });

  it("produces different codes for different URLs", () => {
    assert.notEqual(
      urlToShortCode("https://salon.hacado.me/book"),
      urlToShortCode("https://other.hacado.me/book"),
    );
  });

  it("can emit a longer code for collision retries", () => {
    const eight = urlToShortCode("https://example.com", 8);
    const nine = urlToShortCode("https://example.com", 9);
    assert.equal(nine.endsWith(eight) || nine.includes(eight), true);
    assert.equal(nine.length, 9);
  });
});

describe("extractHttpUrls", () => {
  it("strips trailing punctuation", () => {
    const extracted = extractHttpUrls(
      "See https://example.com/path. Thanks https://example.com/x!",
    );
    assert.deepEqual(
      extracted.map((item) => item.url),
      ["https://example.com/path", "https://example.com/x"],
    );
    assert.equal(extracted[0]?.trailing, ".");
    assert.equal(extracted[1]?.trailing, "!");
  });

  it("finds multiple URLs in one body", () => {
    const extracted = extractHttpUrls(
      "A https://a.example/one and https://b.example/two",
    );
    assert.equal(extracted.length, 2);
  });
});

describe("isShortLinkUrl", () => {
  it("treats apex short-domain links as already short", () => {
    assert.equal(isShortLinkUrl("https://hacado.me/Ab3xK9pQ", "haca.do"), true);
    assert.equal(
      isShortLinkUrl("http://localhost:5557/Ab3xK9pQ", "localhost:5557"),
      true,
    );
  });

  it("does not treat booking subdomains as short links", () => {
    assert.equal(
      isShortLinkUrl("https://salon.hacado.me/book", "haca.do"),
      false,
    );
  });
});

describe("collectUniqueUrlsToShorten", () => {
  it("skips already-short links and dedupes", () => {
    const urls = collectUniqueUrlsToShorten(
      "Book https://salon.hacado.me/book or https://salon.hacado.me/book or https://hacado.me/Ab3xK9pQ",
      "haca.do",
    );
    assert.deepEqual(urls, ["https://salon.hacado.me/book"]);
  });
});

describe("planSmsShortLinks and rewriteUrlsInText", () => {
  it("plans unique URLs and rewrites them while keeping punctuation", () => {
    const body =
      "Hi, book https://salon.hacado.me/book. Also https://salon.hacado.me/book and https://hacado.me/Already1";
    const planned = planSmsShortLinks(body, "hacado.me");
    assert.equal(planned.length, 1);
    assert.equal(planned[0]?.url, "https://salon.hacado.me/book");

    const shortUrl = buildShortLinkUrl(planned[0]!.code, "hacado.me");
    const rewritten = rewriteUrlsInText(
      body,
      new Map([[planned[0]!.url, shortUrl]]),
      "haca.do",
    );
    assert.equal(
      rewritten,
      `Hi, book ${shortUrl}. Also ${shortUrl} and https://hacado.me/Already1`,
    );
  });
});
