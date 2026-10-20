import { getLoggerFactory } from "@hacado/logger";
import type { Email } from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";
import { SmsRegistrationStore } from "./registration-store";
import { paragraph, SUPPORT_EMAIL } from "./registration-submit";
import { TelnyxWebhookConfigError, unwrapTelnyxWebhook } from "./telnyx/verify";
import {
  mapTelnyxVerificationStatus,
  readVerificationWebhook,
} from "./verification";

export class TelnyxVerificationWebhookService {
  protected readonly loggerFactory = getLoggerFactory(
    "TelnyxVerificationWebhookService",
  );

  constructor(
    private readonly store: SmsRegistrationStore = new SmsRegistrationStore(),
    private readonly sendEmail: (email: Email) => Promise<void> = async () =>
      undefined,
  ) {}

  public async processWebhook(request: Request): Promise<Response> {
    const logger = this.loggerFactory("processWebhook");
    const bodyText = await request.text();

    let event: unknown;
    try {
      event = await unwrapTelnyxWebhook<unknown>(bodyText, request.headers);
    } catch (error) {
      if (error instanceof TelnyxWebhookConfigError) {
        return Response.json({ success: false }, { status: 500 });
      }

      logger.warn(
        { error: error instanceof Error ? error.message : "invalid signature" },
        "Rejected Telnyx verification webhook",
      );
      return Response.json({ success: false }, { status: 400 });
    }

    const parsed = readVerificationWebhook(event);
    if (!parsed) {
      logger.info("Ignored Telnyx verification webhook");
      return Response.json({ success: true });
    }

    const status = mapTelnyxVerificationStatus(parsed.status);
    if (!status || status === "draft") {
      logger.info({ status: parsed.status }, "Ignored verification status");
      return Response.json({ success: true });
    }

    const current = await this.store.findByRequestId(parsed.requestId);
    if (!current) {
      logger.warn(
        { requestId: parsed.requestId },
        "No SMS registration for verification webhook",
      );
      return Response.json({ success: true });
    }

    const reason =
      status === "rejected"
        ? parsed.reason || "Verification was not approved."
        : undefined;
    if (
      current.status === status &&
      (status !== "rejected" || current.rejectionReason === reason)
    ) {
      return Response.json({ success: true });
    }

    const saved = await this.store.save({
      ...current,
      status,
      rejectionReason: reason,
      blockedReason: undefined,
      verifiedAt: status === "verified" ? new Date() : current.verifiedAt,
    });

    if (status === "rejected") {
      const settingsUrl = `${getAdminUrl()}/dashboard/settings/text-messaging`;
      const business = saved.legalName || saved.organizationId;
      const detail = `${business} text messaging was not approved. ${reason} Update the form at ${settingsUrl}.`;
      const emails: Email[] = [
        {
          to: SUPPORT_EMAIL,
          subject: `SMS verification rejected for ${business}`,
          body: paragraph(`${detail} Organization ${saved.organizationId}.`),
        },
      ];
      if (saved.contactEmail) {
        emails.unshift({
          to: saved.contactEmail,
          subject: `Text messaging was not approved for ${business}`,
          body: paragraph(detail),
        });
      }

      for (const email of emails) {
        try {
          await this.sendEmail(email);
        } catch (error) {
          logger.error({ error }, "SMS rejection email failed");
        }
      }
    }

    logger.info(
      { organizationId: saved.organizationId, status },
      "SMS verification status updated",
    );
    return Response.json({ success: true });
  }
}
