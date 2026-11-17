export type ConnectedAppRef = {
  appId: string;
  appName: string;
};

/** Metadata key written onto app-powered blocks (editor defaultMetadata). */
export const APP_BLOCK_METADATA_KEY: Record<string, string> = {
  waitlist: "waitlistAppId",
  "gift-card-studio": "giftCardStudioAppId",
  forms: "formsAppId",
  blog: "blogAppId",
};

export const APP_BLOCK_TYPE_HINTS: Record<string, string[]> = {
  waitlist: [
    "BookingModern",
    "BookingSimple",
    "WaitlistModern",
    "WaitlistSimple",
  ],
  "gift-card-studio": ["GiftCardPurchase", "GiftCardPurchaseShowcase"],
  forms: ["Form"],
  blog: ["BlogPostList", "BlogPostContainer"],
};

export function connectedAppMetadata(
  appName: string,
  appId: string,
): Record<string, unknown> | undefined {
  const key = APP_BLOCK_METADATA_KEY[appName];

  if (!key) return undefined;

  return { [key]: appId };
}

export function describeConnectedApps(apps: ConnectedAppRef[] | undefined) {
  return (apps ?? []).map((app) => ({
    appId: app.appId,
    appName: app.appName,
    metadataKey: APP_BLOCK_METADATA_KEY[app.appName],
    blockTypesHint: APP_BLOCK_TYPE_HINTS[app.appName],
  }));
}
