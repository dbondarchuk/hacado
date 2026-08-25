import type { AdminKeys } from "@hacado/i18n";

/**
 * Better Auth OAuth / API error codes we surface with a specific message.
 * Unknown codes fall back to the generic auth error copy.
 */
const AUTH_ERROR_MESSAGE_KEYS: Record<string, AdminKeys> = {
  account_already_linked_to_different_user:
    "auth.error.codes.accountAlreadyLinked",
  unable_to_link_account: "auth.error.codes.unableToLink",
  account_not_linked: "auth.error.codes.unableToLink",
  "email_doesn't_match": "auth.error.codes.emailMismatch",
  email_doesnt_match: "auth.error.codes.emailMismatch",
  email_not_verified: "auth.error.codes.emailNotVerified",
  email_not_found: "auth.error.codes.emailNotFound",
  email_is_missing: "auth.error.codes.emailNotFound",
  signup_disabled: "auth.error.codes.signupDisabled",
  user_already_exists: "auth.error.codes.userAlreadyExists",
  USER_ALREADY_EXISTS: "auth.error.codes.userAlreadyExists",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "auth.error.codes.userAlreadyExists",
  access_denied: "auth.error.codes.accessDenied",
  state_mismatch: "auth.error.codes.stateMismatch",
  oauth_provider_not_found: "auth.error.codes.providerError",
  unable_to_get_user_info: "auth.error.codes.providerError",
  invalid_token: "auth.error.codes.invalidToken",
};

export function normalizeAuthErrorCode(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  return raw.trim();
}

export function authErrorMessageKey(code: string | null): string {
  if (!code) return "auth.error.genericDescription";
  return (
    AUTH_ERROR_MESSAGE_KEYS[code] ??
    AUTH_ERROR_MESSAGE_KEYS[code.toLowerCase()] ??
    "auth.error.genericDescription"
  );
}

/** Shared path Better Auth redirects to on OAuth / API failures. */
export const AUTH_ERROR_PATH = "/auth/error";
