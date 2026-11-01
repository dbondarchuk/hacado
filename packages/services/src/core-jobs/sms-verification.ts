import { getLoggerFactory } from "@hacado/logger";
import { systemEventSource } from "@hacado/types/events";
import {
  BullMQSystemNotificationService,
  getBullMQNotificationConfig,
} from "../bullmq/notifications";
import { processSmsVerificationJob } from "../text-message/registration-submit";
import type { CoreJobProcessor } from "./processors";

export const processSmsVerificationCoreJob: CoreJobProcessor = async ({
  organizationId,
  jobId,
  services,
  payload,
}) => {
  const logger = getLoggerFactory("CoreJobs/SmsVerification")("process");

  logger.debug(
    { jobId, organizationId, hasPayload: payload !== undefined },
    "SMS verification core job entered",
  );

  const general =
    await services.configurationService.getConfiguration("general");

  logger.info(
    { jobId, organizationId, country: general.country },
    "Processing SMS verification core job",
  );

  const systemNotifications = new BullMQSystemNotificationService(
    getBullMQNotificationConfig(),
  );

  await processSmsVerificationJob({
    organizationId,
    country: general.country,
    sendEmail: (email) => systemNotifications.sendSystemEmail(email),
    scheduleJob: (job) => services.jobService.scheduleJob(job),
    emit: (type, payload) =>
      services.eventService.emit(type, payload, systemEventSource),
  });

  logger.debug({ jobId, organizationId }, "SMS verification core job finished");
};
