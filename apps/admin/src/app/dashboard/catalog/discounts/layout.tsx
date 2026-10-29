import { redirectIfFeatureUnavailable } from "@/lib/billing/subscription-feature-guard";

export default async function DiscountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfFeatureUnavailable("discounts");
  return children;
}
