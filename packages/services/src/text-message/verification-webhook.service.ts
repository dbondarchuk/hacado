import { getLoggerFactory } from "@hacado/logger";
import type { SmsVerificationStatusPayload } from "@hacado/types/events";
import { SmsRegistrationStore } from "./registration-store";
import { TelnyxWebhookConfigError, unwrapTelnyxWebhook } from "./telnyx/verify";
import {
  mapTelnyxVerificationStatus,
  readVerificationWebhook,
} from "./verification";
import { emitSmsVerificationStatusChange } from "./verification-events";

export class TelnyxVerificationWebhookService {
  protected readonly loggerFactory = getLoggerFactory(
    "TelnyxVerificationWebhookService",
  );

  constructor(
    private readonly store: SmsRegistrationStore = new SmsRegistrationStore(),
    private readonly emit: (
      organizationId: string,
      type: string,
      payload: SmsVerificationStatusPayload,
    ) => Promise<void> = async () => undefined,
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
    const assigned = await this.store.getAssignedProfileNumber(
      saved.organizationId,
    );
    await emitSmsVerificationStatusChange({
      previousStatus: current.status,
      nextStatus: saved.status,
      firstSubmission: false,
      phoneNumber: assigned?.phoneNumber,
      reason: saved.rejectionReason,
      emit: (type, payload) => this.emit(saved.organizationId, type, payload),
    });

    logger.info(
      { organizationId: saved.organizationId, status },
      "SMS verification status updated",
    );
    return Response.json({ success: true });
  }
}
