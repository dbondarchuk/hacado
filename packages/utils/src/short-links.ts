export function isSmsLinkShorteningEnabled(
  value = process.env.SMS_LINK_SHORTENING_ENABLED,
): boolean {
  if (!value) {
    return false;
  }

  return value === "true" || value === "1";
}
