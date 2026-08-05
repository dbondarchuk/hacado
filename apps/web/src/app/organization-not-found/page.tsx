import type { Metadata } from "next";

import { getAdminUrl } from "@hacado/utils";
import { Marketing404Content } from "./marketing-404-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "We could not find a booking site at this address. Create your own on hacado.com.",
  robots: { index: false, follow: true },
};

function getBaseUrls() {
  const marketingRaw =
    process.env.NEXT_PUBLIC_MARKETING_URL?.trim() || "https://hacado.com";
  const marketingBaseUrl =
    marketingRaw.startsWith("http://") || marketingRaw.startsWith("https://")
      ? marketingRaw
      : `https://${marketingRaw}`;

  const adminBaseUrl = getAdminUrl();

  const result = { marketingBaseUrl, adminBaseUrl };
  console.log("organization-not-found", result);
  return result;
}

export default function OrganizationNotFoundPage() {
  const { marketingBaseUrl, adminBaseUrl } = getBaseUrls();
  return (
    <Marketing404Content
      marketingBaseUrl={marketingBaseUrl}
      adminBaseUrl={adminBaseUrl}
    />
  );
}
