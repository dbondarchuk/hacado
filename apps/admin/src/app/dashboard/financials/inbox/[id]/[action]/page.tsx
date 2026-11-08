import { getActor, getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { canManageSyncedPayments } from "@hacado/utils/permissions";
import { forbidden, notFound, redirect } from "next/navigation";

type Props = PageProps<"/dashboard/financials/inbox/[id]/[action]">;

export default async function Page(props: Props) {
  const logger = getLoggerFactory("AdminPages")("synced-payment-action");
  const params = await props.params;
  const actor = await getActor();
  const [servicesContainer, session] = await Promise.all([
    getServicesContainer(),
    getSession(),
  ]);

  logger.debug(
    {
      syncedPaymentId: params.id,
      action: params.action,
    },
    "Processing synced payment action",
  );

  if (!canManageSyncedPayments(session.user)) {
    forbidden();
  }

  const service = servicesContainer.syncedPaymentsService;
  const existing = await service.get(params.id);

  if (!existing) {
    return notFound();
  }

  const inboxUrl = `/dashboard/financials/inbox?externalId=${encodeURIComponent(existing.externalId)}`;

  switch (params.action) {
    case "confirm":
      if (existing.status !== "matched") {
        redirect(inboxUrl);
      }

      await service.confirm(params.id, actor);

      logger.debug(
        {
          syncedPaymentId: params.id,
          action: "confirm",
        },
        "Synced payment confirmed, redirecting",
      );

      redirect(inboxUrl);

    case "reject":
      if (existing.status !== "matched") {
        redirect(inboxUrl);
      }

      await service.reject(params.id, actor);

      logger.debug(
        {
          syncedPaymentId: params.id,
          action: "reject",
        },
        "Synced payment rejected, redirecting",
      );

      redirect("/dashboard/financials/inbox");

    case "ignore":
      if (existing.status !== "unmatched") {
        redirect(inboxUrl);
      }

      await service.ignore(params.id, actor);

      logger.debug(
        {
          syncedPaymentId: params.id,
          action: "ignore",
        },
        "Synced payment ignored, redirecting",
      );

      redirect("/dashboard/financials/inbox");

    default:
      return notFound();
  }
}
