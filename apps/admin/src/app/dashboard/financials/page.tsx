import { getSession } from "@/app/utils";
import {
  canReadSyncedPayments,
  canViewFinancials,
} from "@hacado/utils";
import { forbidden, redirect } from "next/navigation";

export default async function FinancialsIndexPage() {
  const session = await getSession();
  const user = session?.user;

  if (canViewFinancials(user)) {
    redirect("/dashboard/financials/overview");
  }

  if (canReadSyncedPayments(user)) {
    redirect("/dashboard/financials/inbox");
  }

  forbidden();
}
