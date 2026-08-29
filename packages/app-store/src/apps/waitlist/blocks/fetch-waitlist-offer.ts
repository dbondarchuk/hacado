"use client";

import { clientApi } from "@hacado/api-sdk";
import type { WaitlistOfferPrefill } from "../models/waitlist-offer";

export async function fetchWaitlistOffer(
  waitlistAppId: string,
  token: string,
): Promise<WaitlistOfferPrefill | null> {
  try {
    return await clientApi.apps.callAppApi<WaitlistOfferPrefill>({
      appId: waitlistAppId,
      path: `waitlist-offer?w=${encodeURIComponent(token)}`,
    });
  } catch {
    return null;
  }
}
