import type { IBillingService } from "@hacado/types";
import { DateTime } from "luxon";

import { APPOINTMENTS_COLLECTION_NAME } from "../collections";
import { getDbConnection } from "../database";

export async function getNonDeclinedAppointmentsCreatedInBillingCycleCount(
  organizationId: string,
  billingService: IBillingService,
): Promise<number> {
  const billingPeriod = await billingService.getBillingPeriod();
  const periodStart =
    billingPeriod?.start ?? DateTime.utc().startOf("month").toJSDate();
  const periodEnd =
    billingPeriod?.end ?? DateTime.utc().endOf("month").toJSDate();

  const db = await getDbConnection();
  return db.collection(APPOINTMENTS_COLLECTION_NAME).countDocuments({
    organizationId,
    createdAt: { $gte: periodStart, $lt: periodEnd },
    status: { $ne: "declined" },
  });
}
