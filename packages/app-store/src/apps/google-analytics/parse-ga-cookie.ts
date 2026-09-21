/** Extract GA4 `client_id` from a `_ga` cookie value (`GA1.1.xxxxx.yyyyy`). */
export function parseGaClientIdFromCookie(
  cookieValue: string | undefined | null,
): string | undefined {
  if (!cookieValue) return undefined;

  const parts = cookieValue.trim().split(".");
  if (parts.length < 4) return undefined;

  const clientId = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  return isGaClientId(clientId) ? clientId : undefined;
}

export function isGaClientId(
  value: string | undefined | null,
): value is string {
  return !!value && /^\d+\.\d+$/.test(value);
}

/**
 * Extract GA4 session_id from a `_ga_<MEASUREMENT>` cookie.
 * Supports GS1 (`GS1.1.<session>.…`) and GS2 (`GS2.1.s<session>$…`) formats.
 */
export function parseGaSessionIdFromCookie(
  cookieValue: string | undefined | null,
): number | undefined {
  if (!cookieValue) return undefined;

  const gs1 = cookieValue.match(/^GS1\.\d+\.(\d+)\./);
  if (gs1) {
    const sessionId = Number(gs1[1]);
    return Number.isFinite(sessionId) && sessionId > 0 ? sessionId : undefined;
  }

  const gs2 = cookieValue.match(/^GS2\.\d+\.s(\d+)/);
  if (gs2) {
    const sessionId = Number(gs2[1]);
    return Number.isFinite(sessionId) && sessionId > 0 ? sessionId : undefined;
  }

  return undefined;
}

/** Cookie name for a web stream measurement id (`G-XXXX` → `_ga_XXXX`). */
export function gaSessionCookieName(measurementId: string): string {
  const suffix = measurementId.startsWith("G-")
    ? measurementId.slice(2)
    : measurementId;
  return `_ga_${suffix}`;
}

export function getCookieFromRequest(
  request: Request,
  name: string,
): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    return trimmed.slice(eq + 1);
  }

  return undefined;
}
