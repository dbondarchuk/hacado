import { getBullMQBaseConfig } from "../utils";
import { BullMQNotificationConfig } from "./types";

export const getBullMQNotificationConfig = (
  overrides?: Partial<BullMQNotificationConfig>,
): BullMQNotificationConfig => {
  return {
    ...getBullMQBaseConfig(),
    queues: {
      email: {
        name: process.env.BULLMQ_EMAIL_QUEUE_NAME || "email-notifications",
        concurrency: parseInt(process.env.BULLMQ_EMAIL_CONCURRENCY || "5"),
      },
      textMessage: {
        name:
          process.env.BULLMQ_TEXT_MESSAGE_QUEUE_NAME ||
          "text-message-notifications",
        concurrency: parseInt(
          process.env.BULLMQ_TEXT_MESSAGE_CONCURRENCY || "5",
        ),
      },
      push: {
        name: process.env.BULLMQ_PUSH_QUEUE_NAME || "push-notifications",
        concurrency: parseInt(process.env.BULLMQ_PUSH_CONCURRENCY || "5"),
      },
    },
    ...overrides,
  };
};
