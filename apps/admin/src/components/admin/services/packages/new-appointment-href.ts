import { serialize } from "@/app/dashboard/appointments/new/search-params";
import {
  creditsPerRedemptionForItem,
  CustomerPackageListModel,
} from "@hacado/types";

/** Build `/dashboard/appointments/new?...` URL prefilled for a sold package. */
export function newAppointmentHrefForCustomerPackage(
  pkg: Pick<
    CustomerPackageListModel,
    | "_id"
    | "customerId"
    | "items"
    | "remainingByItem"
    | "status"
    | "remainingCredits"
  >,
): string | null {
  if (pkg.status !== "active" || pkg.remainingCredits <= 0) {
    return null;
  }

  const item =
    pkg.items.find((entry) => {
      const remaining = pkg.remainingByItem[entry._id] ?? 0;
      return remaining >= creditsPerRedemptionForItem(entry);
    }) ?? pkg.items[0];

  if (!item?.optionId) return null;

  return `/dashboard/appointments/new${serialize({
    customer: pkg.customerId,
    fromValue: {
      customerId: pkg.customerId,
      optionId: item.optionId,
      customerPackageId: pkg._id,
    },
  })}`;
}
