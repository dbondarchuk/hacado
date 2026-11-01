import { redirect } from "next/navigation";

type Params = PageProps<"/dashboard/payments/synced">;

export default async function LegacySyncedPaymentsPage(props: Params) {
  const searchParams = await props.searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    }
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/dashboard/financials/inbox${suffix}`);
}
