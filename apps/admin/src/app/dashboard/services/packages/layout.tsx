import { redirectIfFeatureUnavailable } from "@/lib/billing/subscription-feature-guard";

export default async function PackagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfFeatureUnavailable("packages");
  return children;
}
