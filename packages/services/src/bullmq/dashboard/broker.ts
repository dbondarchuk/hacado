import { getLoggerFactory } from "@hacado/logger";
import type { DashboardNotification } from "@hacado/types";
import { Redis } from "ioredis";
import { getRedisClient } from "../redis-client";

type Client = {
  id: string;
  organizationId: string;
  send: (data: DashboardNotification) => void;
};

class DashboardNotificationRealtimeBroker {
  protected readonly redisClient: Redis;
  private subscribers = new Map<string, Set<Client>>();

  protected readonly loggerFactory = getLoggerFactory(
    "DashboardNotificationRealtimeBroker",
  );

  public constructor(redisClient: Redis) {
    this.redisClient = redisClient.duplicate();
    this.redisClient.on("message", this.onMessage.bind(this));
  }

  subscribeOrganization(organizationId: string) {
    const logger = this.loggerFactory("subscribeOrganization");
    logger.info({ organizationId }, "Subscribing to organization");
    if (!this.subscribers.has(organizationId)) {
      this.subscribers.set(organizationId, new Set());
      this.redisClient.subscribe(`dashboard:notifications:${organizationId}`);
      logger.info({ organizationId }, "Subscribed to organization");
    } else {
      logger.info({ organizationId }, "Already subscribed to organization");
    }
  }

  unsubscribeOrganization(organizationId: string) {
    const logger = this.loggerFactory("unsubscribeOrganization");
    logger.info({ organizationId }, "Unsubscribing from organization");
    const clients = this.subscribers.get(organizationId);
    if (clients && clients.size === 0) {
      this.redisClient.unsubscribe(`dashboard:notifications:${organizationId}`);
      this.subscribers.delete(organizationId);
      logger.info({ organizationId }, "Unsubscribed from organization");
    } else {
      logger.info({ organizationId }, "Not subscribed to organization");
    }
  }

  registerClient(organizationId: string, client: Client) {
    const logger = this.loggerFactory("registerClient");
    logger.info({ organizationId, clientId: client.id }, "Registering client");
    this.subscribeOrganization(organizationId);
    const set = this.subscribers.get(organizationId)!;
    set.add(client);
    logger.info({ organizationId, clientId: client.id }, "Registered client");
  }

  unregisterClient(organizationId: string, client: Client) {
    const logger = this.loggerFactory("unregisterClient");
    logger.info(
      { organizationId, clientId: client.id },
      "Unregistering client",
    );
    const set = this.subscribers.get(organizationId);
    if (!set) return;
    set.delete(client);
    if (set.size === 0) this.unsubscribeOrganization(organizationId);
    logger.info({ organizationId, clientId: client.id }, "Unregistered client");
  }

  private onMessage(channel: string, raw: string) {
    const logger = this.loggerFactory("onMessage");
    logger.info({ channel, raw }, "Received message");

    const organizationId = channel.split(":").pop()!;
    const clients = this.subscribers.get(organizationId);
    if (!clients) {
      logger.info({ organizationId }, "No clients found");
      return;
    }

    const data = JSON.parse(raw);
    for (const client of clients) client.send(data);
    logger.info(
      { organizationId, clients: clients.size },
      "Sent message to clients",
    );
  }
}

let realtimeBroker: DashboardNotificationRealtimeBroker | null = null;

export const getDashboardNotificationRealtimeBroker =
  (): DashboardNotificationRealtimeBroker => {
    if (!realtimeBroker) {
      realtimeBroker = new DashboardNotificationRealtimeBroker(
        getRedisClient(),
      );
    }

    return realtimeBroker;
  };
