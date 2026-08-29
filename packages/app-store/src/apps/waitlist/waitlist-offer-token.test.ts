import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createWaitlistOfferToken,
  verifyWaitlistOfferToken,
} from "./waitlist-offer-token";

describe("waitlist offer token", () => {
  const entryId = "507f1f77bcf86cd799439011";
  const slot = new Date("2026-08-27T15:30:00.000Z");

  it("round-trips entry id and slot unix seconds", () => {
    const token = createWaitlistOfferToken(entryId, slot);
    const decoded = verifyWaitlistOfferToken(token);
    assert.ok(decoded);
    assert.equal(decoded.entryId, entryId);
    assert.equal(
      Math.floor(decoded.slot.getTime() / 1000),
      Math.floor(slot.getTime() / 1000),
    );
  });

  it("rejects tampered tokens", () => {
    const token = createWaitlistOfferToken(entryId, slot);
    const tampered = `${token.slice(0, -2)}aa`;
    assert.equal(verifyWaitlistOfferToken(tampered), null);
  });

  it("rejects garbage", () => {
    assert.equal(verifyWaitlistOfferToken("not-a-token"), null);
  });
});
