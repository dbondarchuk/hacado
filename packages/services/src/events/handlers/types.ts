import type { EventEnvelope, IConnectedAppProps } from "@hacado/types";
import type { Redis } from "ioredis";

export type EventHandlerContext = {
  envelope: EventEnvelope;
  services: IConnectedAppProps["services"];
  redis: Redis;
  getDbConnection: IConnectedAppProps["getDbConnection"];
};

export interface EventHandler {
  readonly name: string;
  run(ctx: EventHandlerContext): Promise<void>;
}
