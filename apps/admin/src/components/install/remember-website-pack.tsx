"use client";

import { rememberPreferredWebsitePack } from "@/components/install/constants";
import { WEBSITE_PACK_IDS } from "@hacado/page-builder/templates";
import { useEffect } from "react";

/** Persists a catalog pack id from URL/query into install localStorage. */
export function RememberWebsitePack({ packId }: { packId?: string | null }) {
  useEffect(() => {
    const id = packId?.trim();
    if (!id || !(WEBSITE_PACK_IDS as string[]).includes(id)) return;
    rememberPreferredWebsitePack(id);
  }, [packId]);

  return null;
}
