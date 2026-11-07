import { BullMQConfig } from "../types";

export type BullMQNotificationConfig = BullMQConfig & {
  queues: {
    email: {
      name: string;
      concurrency: number;
    };
    textMessage: {
      name: string;
      concurrency: number;
    };
    push: {
      name: string;
      concurrency: number;
    };
  };
};
