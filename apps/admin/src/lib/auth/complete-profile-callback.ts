export function buildCompleteProfileCallbackUrl(nextPath: string): string {
  return `/auth/complete-profile?next=${encodeURIComponent(nextPath)}`;
}
