import { getLoggerFactory } from "@hacado/logger";
import {
  isDisposableDomain,
  preload,
} from "@visulima/disposable-email-domains";
import { domainToASCII } from "node:url";

void preload();

const BLOCKED_TLDS = new Set(["ru", "su", "by", "xn--p1ai"]);

export type SignupEmailBlockReason = "tld" | "disposable";

export function isSignupEmailBlockingEnabled(): boolean {
  return process.env.SIGNUP_EMAIL_BLOCKING_ENABLED !== "false";
}

function parseEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;

  const rawDomain = trimmed.slice(at + 1).replace(/\.+$/, "");
  if (!rawDomain) return null;

  try {
    return domainToASCII(rawDomain) || rawDomain;
  } catch {
    return rawDomain;
  }
}

/**
 * Returns why a public signup email should be rejected, or null if allowed.
 * Matches the last DNS label for country TLDs; disposable domains (including
 * parent domains) are checked via `@visulima/disposable-email-domains`.
 */
export function getSignupEmailBlockReason(
  email: string,
): SignupEmailBlockReason | null {
  const logger = getLoggerFactory("SignupEmail")("getSignupEmailBlockReason");
  const domain = parseEmailDomain(email);

  if (!domain) {
    logger.debug(
      { hasEmail: Boolean(email.trim()) },
      "Signup email check skipped: invalid address",
    );
    return null;
  }

  const tld = domain.split(".").filter(Boolean).at(-1) ?? "";
  if (BLOCKED_TLDS.has(tld)) {
    logger.warn({ domain, tld, reason: "tld" }, "Signup email blocked: TLD");
    return "tld";
  }

  if (isDisposableDomain(domain)) {
    logger.warn(
      { domain, reason: "disposable" },
      "Signup email blocked: disposable domain",
    );
    return "disposable";
  }

  logger.debug({ domain }, "Signup email allowed");
  return null;
}
