import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isGaClientId, parseGaClientIdFromCookie } from "./parse-ga-cookie";

describe("parseGaClientIdFromCookie", () => {
  it("parses GA1.1 cookie values", () => {
    assert.equal(
      parseGaClientIdFromCookie("GA1.1.1234567890.1700000000"),
      "1234567890.1700000000",
    );
  });

  it("parses GA1.2 cookie values", () => {
    assert.equal(
      parseGaClientIdFromCookie("GA1.2.987654321.1699999999"),
      "987654321.1699999999",
    );
  });

  it("rejects invalid values", () => {
    assert.equal(parseGaClientIdFromCookie(undefined), undefined);
    assert.equal(parseGaClientIdFromCookie(""), undefined);
    assert.equal(parseGaClientIdFromCookie("not-a-ga-cookie"), undefined);
  });
});

describe("isGaClientId", () => {
  it("accepts dotted numeric ids", () => {
    assert.equal(isGaClientId("123.456"), true);
    assert.equal(isGaClientId("GA1.1.123.456"), false);
    assert.equal(isGaClientId(undefined), false);
  });
});
