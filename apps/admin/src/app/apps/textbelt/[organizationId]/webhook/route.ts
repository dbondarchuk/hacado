import { getLoggerFactory } from "@hacado/logger";
import { getTextBeltConfiguration, ServicesContainer } from "@hacado/services";
import { NextRequest, NextResponse } from "next/server";
import { TextBeltWebhookService } from "./webhook.service";

export const dynamic = "force-dynamic";

const processWebhook = async (
  request: NextRequest,
  { params }: RouteContext<"/apps/textbelt/[organizationId]/webhook">,
) => {
  const { organizationId } = await params;
  const logger = getLoggerFactory("API/textbelt-webhook")("processWebhook");

  logger.debug(
    {
      url: request.url,
      method: request.method,
      organizationId,
    },
    "Processing built-in TextBelt webhook request",
  );

  if (!organizationId) {
    logger.warn("Missing required organizationId parameter");
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 },
    );
  }

  const services = ServicesContainer(organizationId);

  const webhookService = new TextBeltWebhookService(
    organizationId,
    getTextBeltConfiguration(),
    services.configurationService,
    services.connectedAppsService,
    services.bookingService,
    services.customersService,
    services.communicationLogsService,
    services.notificationService,
    services.organizationService,
    services.billingService,
    services.eventService,
    services.teamService,
  );

  try {
    const result = await webhookService.processWebhook(request);

    if (result) {
      logger.debug(
        {
          organizationId,
          status: result.status,
        },
        "Successfully processed webhook",
      );
    } else {
      logger.warn({ organizationId }, "No webhook handler found");
    }

    return (
      result ?? NextResponse.json({ error: "unknown_handler" }, { status: 404 })
    );
  } catch (error: any) {
    logger.error(
      {
        organizationId,
        error: error?.message || error?.toString(),
      },
      "Error processing webhook",
    );
    throw error;
  }
};

export const GET = processWebhook;
export const POST = processWebhook;
export const PUT = processWebhook;
export const DELETE = processWebhook;
