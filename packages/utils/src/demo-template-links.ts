/**
 * Ensure template preview/AI args include the usual customer-facing link vars.
 * Real sends may inject manageLink only when my-cabinet is available; demo args
 * still expose it so builders and Builder AI can use {{#manageLink}}...{{/manageLink}}.
 */
export function withDemoTemplateLinkArgs<T extends Record<string, unknown>>(
  args: T,
  websiteUrl?: string | null,
): T {
  const raw =
    (typeof args.websiteUrl === "string" && args.websiteUrl.trim()) ||
    (typeof websiteUrl === "string" && websiteUrl.trim()) ||
    "";

  const base = raw.replace(/\/$/, "");

  if (!base) {
    return args;
  }

  return {
    ...args,
    websiteUrl:
      typeof args.websiteUrl === "string" && args.websiteUrl.trim()
        ? args.websiteUrl
        : base,
    manageLink:
      typeof args.manageLink === "string" && args.manageLink.trim()
        ? args.manageLink
        : `${base}/my-cabinet`,
    bookingUrl:
      typeof args.bookingUrl === "string" && args.bookingUrl.trim()
        ? args.bookingUrl
        : `${base}/book`,
  };
}
