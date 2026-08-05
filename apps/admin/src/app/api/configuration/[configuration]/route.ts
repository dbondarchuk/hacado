import { getActor, getServicesContainer, getSession } from "@/app/utils";
import { sessionCanUseFeature } from "@/lib/billing/subscription-plan-access";
import { getLoggerFactory } from "@hacado/logger";
import { getPolarClient } from "@hacado/services";
import {
  BookingConfiguration,
  ConfigurationKey,
  configurationSchemaMap,
  type GeneralConfiguration,
  okStatus,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/configuration/[configuration]">,
) {
  const logger = getLoggerFactory("AdminAPI/configuration/[configuration]")(
    "GET",
  );
  const servicesContainer = await getServicesContainer();
  const { configuration: configurationKey } = await params;

  logger.debug(
    {
      configurationKey,
    },
    "Getting configuration",
  );

  const configuration =
    await servicesContainer.configurationService.getConfiguration(
      configurationKey as ConfigurationKey,
    );

  return NextResponse.json(configuration);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/configuration/[configuration]">,
) {
  const logger = getLoggerFactory("AdminAPI/configuration/[configuration]")(
    "PUT",
  );
  const servicesContainer = await getServicesContainer();
  const { configuration: configurationKey } = await params;
  const body = await request.json();

  logger.debug({ body }, "Updating configuration");

  const configurationSchema =
    configurationSchemaMap[configurationKey as ConfigurationKey];
  if (!configurationSchema) {
    logger.warn({ configurationKey }, "Invalid configuration key");
    return NextResponse.json(
      {
        error: "Invalid configuration key",
        success: false,
        code: "invalid_configuration_key",
      },
      { status: 400 },
    );
  }

  const parseResult = configurationSchema.safeParse(body);
  if (!parseResult.success) {
    logger.warn(
      { error: parseResult.error, configurationKey },
      "Invalid configuration",
    );
    return NextResponse.json(
      {
        error: parseResult.error,
        success: false,
        code: "invalid_configuration",
        configurationKey,
      },
      { status: 400 },
    );
  }

  let data = parseResult.data;
  if (
    configurationKey === "booking" &&
    !(await sessionCanUseFeature(await getSession(), "payments"))
  ) {
    data = {
      ...(data as BookingConfiguration),
      payments: { enabled: false },
    };
  }

  const actor = await getActor();
  await servicesContainer.configurationService.setConfiguration(
    configurationKey as ConfigurationKey,
    data,
    actor,
  );

  if (configurationKey === "general") {
    const organization =
      await servicesContainer.organizationService.getOrganization();

    if (organization && !organization.feesExempt) {
      const general = data as GeneralConfiguration;
      await getPolarClient().syncTeamCustomerFromGeneralSettings({
        organizationId: organization._id,
        name: general.name,
        email: general.email,
      });
    }
  }

  logger.debug({ configurationKey, data }, "Configuration updated");
  return NextResponse.json(okStatus);
}
