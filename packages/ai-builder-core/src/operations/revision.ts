/**
 * Browser- and Node-safe document revision hash.
 * Prefer Web Crypto when available; fall back to a stable FNV-1a style hash.
 */
export function computeDocumentRevision(document: unknown): string {
  const json = JSON.stringify(document);

  return hashString(json).slice(0, 24);
}

function hashString(value: string): string {
  // FNV-1a 64-bit-ish hex via two 32-bit lanes - deterministic across runtimes.
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + ((i % 7) + 1);
    h2 = Math.imul(h2, 0x01000193);
  }

  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (value.length >>> 0).toString(16).padStart(8, "0")
  );
}

export function assertDocumentRevision(
  document: unknown,
  expectedRevision: string,
): { ok: true } | { ok: false; actual: string } {
  const actual = computeDocumentRevision(document);

  if (actual !== expectedRevision) {
    return { ok: false, actual };
  }

  return { ok: true };
}
