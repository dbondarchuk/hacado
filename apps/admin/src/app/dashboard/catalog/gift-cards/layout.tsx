import { redirectIfFeatureUnavailable } from "@/lib/billing/subscription-feature-guard";

export default async function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfFeatureUnavailable("giftCards");
  return children;
}
