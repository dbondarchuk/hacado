import {
  canAccessFinancialsSection,
  canReadSyncedPayments,
  canViewFinancials,
} from "@hacado/utils";
import { redirectIfFeatureUnavailable } from "@/lib/billing/subscription-feature-guard";
import { getSession } from "@/app/utils";
import { forbidden } from "next/navigation";

export default async function FinancialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfFeatureUnavailable("financials");
  const session = await getSession();
  if (!canAccessFinancialsSection(session?.user)) {
    forbidden();
  }
  return children;
}
