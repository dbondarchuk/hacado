import { createHmac, timingSafeEqual } from "node:crypto";

const ENTRY_BYTES = 12;
const SLOT_BYTES = 4;
const SIG_BYTES = 16;
const PAYLOAD_BYTES = ENTRY_BYTES + SLOT_BYTES;
const TOKEN_BYTES = PAYLOAD_BYTES + SIG_BYTES;

function authSecret(): string {
  return process.env.AUTH_SECRET || "customer-auth-dev-secret";
}

function hmacTruncated(payload: Buffer): Buffer {
  return createHmac("sha256", authSecret())
    .update(payload)
    .digest()
    .subarray(0, SIG_BYTES);
}

export type WaitlistOfferTokenPayload = {
  entryId: string;
  slot: Date;
};

/** Compact signed `w` token: ObjectId (12) + slot unix (4) + HMAC-SHA256[:16], base64url. */
export function createWaitlistOfferToken(entryId: string, slot: Date): string {
  const idBytes = Buffer.from(entryId, "hex");
  if (idBytes.length !== ENTRY_BYTES) {
    throw new Error("Waitlist offer token requires a 24-character ObjectId");
  }

  const payload = Buffer.alloc(PAYLOAD_BYTES);
  idBytes.copy(payload, 0, 0, ENTRY_BYTES);
  payload.writeUInt32BE(Math.floor(slot.getTime() / 1000), ENTRY_BYTES);
  return Buffer.concat([payload, hmacTruncated(payload)]).toString("base64url");
}

export function verifyWaitlistOfferToken(
  token: string,
): WaitlistOfferTokenPayload | null {
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length !== TOKEN_BYTES) {
      return null;
    }

    const payload = buf.subarray(0, PAYLOAD_BYTES);
    const signature = buf.subarray(PAYLOAD_BYTES);
    const expected = hmacTruncated(payload);
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(signature, expected)
    ) {
      return null;
    }

    const entryId = payload.subarray(0, ENTRY_BYTES).toString("hex");
    const slotUnix = payload.readUInt32BE(ENTRY_BYTES);
    return { entryId, slot: new Date(slotUnix * 1000) };
  } catch {
    return null;
  }
}
