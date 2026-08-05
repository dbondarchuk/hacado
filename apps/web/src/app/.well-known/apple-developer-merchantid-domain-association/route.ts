import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { IPaymentProcessor } from "@hacado/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const logger = getLoggerFactory(
    "API/.well-known/apple-developer-merchantid-domain-association",
  )("GET");

  try {
    const servicesContainer = await getServicesContainer();

    logger.debug("Getting apple pay domain association");

    const { defaultApps } =
      await servicesContainer.configurationService.getConfigurations(
        "defaultApps",
      );

    let paymentAppId = defaultApps?.paymentAppId;

    if (!paymentAppId) {
      logger.warn(
        "No default payment app configured, trying to find a payment app",
      );

      const paymentApps =
        await servicesContainer.connectedAppsService.getAppsByScope("payment");

      if (paymentApps.length === 0) {
        logger.error("No payment apps installed, returning 404");
        return new NextResponse(null, { status: 404 });
      }

      paymentAppId = paymentApps[0]._id;

      logger.debug(
        { paymentAppId, paymentAppName: paymentApps[0].name },
        "Found payment app",
      );
    }

    const { app, service } =
      await servicesContainer.connectedAppsService.getAppService<IPaymentProcessor>(
        paymentAppId,
      );

    if (!service.getApplePayDomainAssociation) {
      logger.debug(
        { appId: paymentAppId },
        "Payment app does not support Apple Pay domain association",
      );
      return new NextResponse(null, { status: 404 });
    }

    logger.debug(
      { appId: paymentAppId, appName: app.name },
      "Getting apple pay domain association from payment app",
    );

    const content = await service.getApplePayDomainAssociation(app);

    if (!content) {
      logger.error(
        { appId: paymentAppId },
        "Apple Pay domain association file is empty or unavailable",
      );
      return new NextResponse(null, { status: 404 });
    }

    logger.debug(
      { appId: paymentAppId, appName: app.name },
      "Successfully served Apple Pay domain association file",
    );

    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    logger.error(
      { error: error?.message || error?.toString() },
      "Error serving Apple Pay domain association file",
    );
    return new NextResponse(null, { status: 500 });
  }
}
