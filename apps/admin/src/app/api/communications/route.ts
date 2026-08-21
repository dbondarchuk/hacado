import { getMember, getServicesContainer, getWebsiteUrl } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getSubscriptionFeatureBlockedResponse } from "@/lib/billing/subscription-feature-guard";
import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { BaseAllKeys } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import {
  Appointment,
  Customer,
  okStatus,
  sendCommunicationRequestSchema,
} from "@hacado/types";
import { getAdminUrl, getArguments, template } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/communications")("POST");
  const servicesContainer = await getServicesContainer();
  const member = await getMember();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing communications API request",
  );

  const { error, success, data } = sendCommunicationRequestSchema.safeParse(
    await request.json(),
  );
  if (!success || !data || error) {
    logger.error(
      {
        error: error?.message || error?.toString(),
      },
      "Error parsing communication request",
    );
    return NextResponse.json(
      {
        error: "bad_data",
        message: error?.message,
      },
      { status: 400 },
    );
  }

  let customer: Customer;
  let appointment: Appointment | null = null;

  if ("appointmentId" in data) {
    const auth = await requireCanUpdateAppointment(data.appointmentId, logger);
    if (!auth.ok) return auth.response;

    appointment = auth.appointment;
    customer = appointment.customer;
  } else {
    const _customer = await servicesContainer.customersService.getCustomer(
      data.customerId!, // Customer Id will be present
    );

    if (!_customer) {
      logger.error(
        {
          error: "customer_not_found",
          message: `Customer ${data.customerId} was not found`,
        },
        "Customer not found",
      );
      return NextResponse.json(
        {
          error: "customer_not_found",
          message: `Customer ${data.customerId} was not found`,
        },
        { status: 404 },
      );
    }

    customer = _customer;
  }

  const config = await servicesContainer.configurationService.getConfigurations(
    "booking",
    "general",
    "brand",
    "social",
  );

  const locale = config.brand.language;
  const adminUrl = getAdminUrl();
  const websiteUrl = await getWebsiteUrl();
  const args = getArguments({
    appointment,
    config,
    customer,
    locale,
    adminUrl,
    websiteUrl,
    user: member,
  });

  const customerId = "customerId" in data ? data.customerId : undefined;
  const appointmentId =
    "appointmentId" in data ? data.appointmentId : undefined;

  const handledBy = customerId
    ? ("apps.communications.handledBy.customer" satisfies BaseAllKeys)
    : ("apps.communications.handledBy.appointment" satisfies BaseAllKeys);

  switch (data.channel) {
    case "text-message": {
      const blocked = await getSubscriptionFeatureBlockedResponse("sms");
      if (blocked) return blocked;

      const body = template(data.content, args);
      await servicesContainer.notificationService.sendTextMessage({
        body,
        handledBy,
        participantType: "customer",
        phone: customer.phone,
        sender: config.general.name,
        customerId,
        appointmentId,
        webhookData: {
          customerId,
          appointmentId,
        },
        memberId: member._id,
      });

      break;
    }

    case "email": {
      const body = await renderToStaticMarkup({
        args: args,
        document: data.content,
      });

      await servicesContainer.notificationService.sendEmail({
        email: {
          body,
          subject: template(data.subject, args),
          to: customer.email,
        },
        handledBy,
        participantType: "customer",
        appointmentId,
        customerId,
        memberId: member._id,
      });
      break;
    }
  }

  logger.debug(
    {
      success: true,
      messageId: "Communication sent successfully",
    },
    "Communication sent successfully",
  );

  return NextResponse.json(okStatus);
}
