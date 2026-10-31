"use client";

import { appsApi } from "@hacado/api-sdk/client/apps";
import type { WaitlistOfferPrefill } from "../models/waitlist-offer";

export async function fetchWaitlistOffer(
  waitlistAppId: string,
  token: string,
): Promise<WaitlistOfferPrefill | null> {
  try {
    return await appsApi.callAppApi<WaitlistOfferPrefill>({
      appId: waitlistAppId,
      path: `waitlist-offer?w=${encodeURIComponent(token)}`,
    });
  } catch {
    return null;
  }
}
