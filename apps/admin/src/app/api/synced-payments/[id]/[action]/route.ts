import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import {
  syncedPaymentAssignablePaymentTypes,
  syncedPaymentStandalonePaymentTypes,
  type SyncedPaymentAssignablePaymentType,
  type SyncedPaymentStandalonePaymentType,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ACTIONS = [
  "confirm",
  "reject",
  "reassign",
  "assign",
  "ignore",
  "record",
  "unassign",
  "unrecord",
  "update",
  "revert",
] as const;
type Action = (typeof ACTIONS)[number];

const REQUIRES_APPOINTMENT: Action[] = ["reassign", "assign"];

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/synced-payments/[id]/[action]">,
) {
  const logger = getLoggerFactory("AdminAPI/synced-payments/[id]/[action]")(
    "POST",
  );
  const auth = await requirePermission("syncedPayment", "manage", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  const { id, action } = await params;

  if (!(ACTIONS as readonly string[]).includes(action)) {
    logger.warn({ id, action }, "Unknown synced payment action");
    return NextResponse.json(
      { success: false, error: "Unknown action", code: "unknown_action" },
      { status: 400 },
    );
  }

  const typedAction = action as Action;

  const body =
    typedAction === "confirm" ||
    typedAction === "revert" ||
    typedAction === "unassign" ||
    typedAction === "unrecord"
      ? {}
      : await request.json().catch(() => ({}));

  let appointmentId: string | undefined;
  if (REQUIRES_APPOINTMENT.includes(typedAction)) {
    appointmentId = body?.appointmentId;
    if (!appointmentId) {
      logger.warn({ id, action }, "Missing appointmentId for action");
      return NextResponse.json(
        {
          success: false,
          error: "appointmentId is required",
          code: "appointment_id_required",
        },
        { status: 400 },
      );
    }
  }

  if (typedAction === "update") {
    const paymentAmount = Number(body?.paymentAmount);
    const tip = Number(body?.tip);
    const paymentType = body?.paymentType as
      | SyncedPaymentAssignablePaymentType
      | undefined;
    if (
      !Number.isFinite(paymentAmount) ||
      !Number.isFinite(tip) ||
      paymentAmount < 0 ||
      tip < 0 ||
      !paymentType ||
      !(syncedPaymentAssignablePaymentTypes as readonly string[]).includes(
        paymentType,
      )
    ) {
      logger.warn({ id, action, body }, "Invalid amounts for update action");
      return NextResponse.json(
        {
          success: false,
          error:
            "paymentAmount and tip must be non-negative numbers and paymentType must be valid",
          code: "invalid_amounts",
        },
        { status: 400 },
      );
    }
  }

  if (typedAction === "record") {
    const customerId = body?.customerId;
    const paymentType = body?.paymentType as
      | SyncedPaymentStandalonePaymentType
      | undefined;
    if (
      !customerId ||
      typeof customerId !== "string" ||
      !paymentType ||
      !(syncedPaymentStandalonePaymentTypes as readonly string[]).includes(
        paymentType,
      )
    ) {
      logger.warn({ id, action, body }, "Invalid payload for record action");
      return NextResponse.json(
        {
          success: false,
          error: "customerId and a standalone paymentType are required",
          code: "invalid_record",
        },
        { status: 400 },
      );
    }
  }

  logger.debug(
    { id, action, appointmentId },
    "Processing synced payment action",
  );

  try {
    const service = servicesContainer.syncedPaymentsService;
    let result;
    switch (typedAction) {
      case "confirm":
        result = await service.confirm(id, actor);
        break;
      case "reject":
        result = await service.reject(id, actor);
        break;
      case "ignore":
        result = await service.ignore(id, actor);
        break;
      case "reassign":
        result = await service.reassign(id, appointmentId!, actor);
        break;
      case "assign":
        result = await service.assign(id, appointmentId!, actor);
        break;
      case "unassign":
        result = await service.unassign(id, actor);
        break;
      case "unrecord":
        result = await service.unrecord(id, actor);
        break;
      case "record":
        result = await service.recordStandalone(
          id,
          {
            customerId: body.customerId as string,
            paymentType: body.paymentType as SyncedPaymentStandalonePaymentType,
          },
          actor,
        );
        break;
      case "update":
        result = await service.updateAmounts(
          id,
          {
            paymentAmount: Number(body.paymentAmount),
            tip: Number(body.tip),
            paymentType: body.paymentType as SyncedPaymentAssignablePaymentType,
          },
          actor,
        );
        break;
      case "revert":
        result = await service.revertAmounts(id, actor);
        break;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error(
      { id, action, error: error?.message || error?.toString() },
      "Failed to process synced payment action",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process action",
        code: "action_failed",
      },
      { status: 500 },
    );
  }
}
