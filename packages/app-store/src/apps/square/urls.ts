export const SQUARE_API_VERSION = "2025-01-23";

export function isSquareSandbox(): boolean {
  if (process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "production") {
    return false;
  }
  if (process.env.SQUARE_ENVIRONMENT?.toLowerCase() === "sandbox") {
    return true;
  }

  return process.env.NODE_ENV !== "production";
}

export function squareConnectBaseUrl(): string {
  return isSquareSandbox()
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

export function squareOAuthAuthorizeUrl(): string {
  return `${squareConnectBaseUrl()}/oauth2/authorize`;
}

export function squareOAuthTokenUrl(): string {
  return `${squareConnectBaseUrl()}/oauth2/token`;
}

export function squareApiBaseUrl(): string {
  return isSquareSandbox()
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}
